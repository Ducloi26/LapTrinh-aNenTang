const { randomUUID } = require('crypto');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createCommunityHandlers({ serverAuth, database, journeys, readPosts, writePosts,
  onError = (entry) => console.error('[COMMUNITY]', JSON.stringify(entry)) }) {
  const missing = (res) => res.status(404).json({ success: false, error: 'Bài viết không còn khả dụng.' });
  function route(action, authenticated = true) {
    return async (req, res) => {
      let auth;
      if (authenticated) {
        try { auth = await serverAuth.authenticate(/^Bearer (\S+)$/.exec(req.headers.authorization || '')?.[1]); }
        catch (error) { return serverAuth.respondError(res, error, 'account_verify'); }
      }
      try {
        if (!database) throw { code: 'DB_UNAVAILABLE' };
        return await action(req, res, auth);
      } catch (error) {
        onError({ code: /^[A-Z0-9_]{1,40}$/.test(error?.code || '') ? error.code : 'UNAVAILABLE' });
        return res.status(503).json({ success: false, error: 'Không thể xác minh hoặc lưu bài viết. Vui lòng tải lại.' });
      }
    };
  }
  const linked = (post) => UUID.test(post.journey_id || '') && UUID.test(post.user_id || '')
    && Number.isSafeInteger(post.source_share_version) && post.source_share_version >= 0;
  const valid = (post, source) => linked(post) && source?.user_id === post.user_id
    && source.is_public === true && source.share_version === post.source_share_version;
  function present(post, source) {
    return { id: post.id, user_id: post.user_id, author_name: post.author_name,
      caption: post.caption, created_at: post.created_at, updated_at: post.updated_at,
      like_count: (post.liked_by || []).length, liked_by: post.liked_by || [],
      comment_count: (post.comments || []).length, comments: post.comments || [], journey: source };
  }
  async function current(id) {
    const post = readPosts().find((item) => item.id === id);
    if (!post || !linked(post)) return null;
    const sources = await journeys.sources(database, [post.journey_id]);
    const source = sources.get(post.journey_id);
    if (!valid(post, source)) return null;
    const posts = readPosts();
    const latest = posts.find((item) => item.id === id);
    return latest && valid(latest, source) ? { posts, post: latest, source } : null;
  }
  const captionValid = (body) => body && typeof body.caption === 'string' && body.caption.trim().length > 0
    && body.caption.length <= 5000;
  const invalid = (res) => res.status(400).json({ success: false, error: 'Nội dung hoặc nguồn chia sẻ không hợp lệ.' });

  return {
    list: route(async (req, res) => {
      const posts = readPosts().filter(linked);
      const sources = await journeys.sources(database, [...new Set(posts.map((post) => post.journey_id))]);
      let data = posts.filter((post) => valid(post, sources.get(post.journey_id)))
        .map((post) => present(post, sources.get(post.journey_id)));
      if (req.query.mood && req.query.mood !== 'all') data = data.filter((post) =>
        post.journey.mood_from === req.query.mood || post.journey.mood_to === req.query.mood);
      data.sort(req.query.tab === 'trending'
        ? (a, b) => (b.like_count * 2 + b.comment_count * 3) - (a.like_count * 2 + a.comment_count * 3)
        : (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      return res.json({ success: true, data, count: data.length });
    }, false),
    get: route(async (req, res) => {
      const found = await current(req.params.id);
      return found ? res.json({ success: true, post: present(found.post, found.source) }) : missing(res);
    }, false),
    create: route(async (req, res, auth) => {
      if (!captionValid(req.body) || !UUID.test(req.body.journeyId || '')
        || Object.keys(req.body).some((key) => !['caption', 'journeyId'].includes(key))) return invalid(res);
      const sources = await journeys.sources(database, [req.body.journeyId]);
      const source = sources.get(req.body.journeyId);
      if (!source || source.user_id !== auth.user.id) return missing(res);
      if (!source.is_public) return res.status(409).json({ success: false, error: 'Hãy cho phép chia sẻ journey trước khi đăng bài.' });
      if (!Number.isSafeInteger(source.share_version) || source.share_version < 0) throw { code: 'INVALID_SOURCE_VERSION' };
      const post = { id: randomUUID(), user_id: auth.user.id, author_name: auth.user.displayName,
        caption: req.body.caption.trim(), journey_id: source.id, source_share_version: source.share_version,
        liked_by: [], comments: [], created_at: new Date().toISOString() };
      const posts = readPosts();
      posts.unshift(post);
      writePosts(posts);
      const confirmed = await current(post.id);
      return confirmed ? res.status(201).json({ success: true, post: present(confirmed.post, confirmed.source) }) : missing(res);
    }),
    like: route(async (req, res, auth) => {
      const found = await current(req.params.id);
      if (!found) return missing(res);
      const { posts, post } = found;
      const liked = new Set(post.liked_by || []);
      if (liked.has(auth.user.id)) liked.delete(auth.user.id); else liked.add(auth.user.id);
      post.liked_by = [...liked];
      writePosts(posts);
      return res.json({ success: true, liked: liked.has(auth.user.id), like_count: liked.size });
    }),
    comment: route(async (req, res, auth) => {
      if (typeof req.body?.content !== 'string' || !req.body.content.trim() || req.body.content.length > 2000) return invalid(res);
      const found = await current(req.params.id);
      if (!found) return missing(res);
      const comment = { id: randomUUID(), user_id: auth.user.id, author_name: auth.user.displayName,
        content: req.body.content.trim(), created_at: new Date().toISOString() };
      found.post.comments = [...(found.post.comments || []), comment];
      writePosts(found.posts);
      return res.status(201).json({ success: true, comment, comment_count: found.post.comments.length });
    }),
    save: route(async (req, res) => {
      const found = await current(req.params.id);
      if (!found) return missing(res);
      const source = found.source;
      return journeys.save({ headers: req.headers, body: {
        title: `[Cộng đồng] ${source.title}`.slice(0, 200),
        moodFrom: { id: source.mood_from }, moodTo: { id: source.mood_to },
        activity: source.activity, duration: source.duration_minutes, stages: source.stages,
      } }, res, { forcePrivate: true });
    }),
    edit: route(async (req, res, auth) => {
      if (!captionValid(req.body) || Object.keys(req.body).some((key) => key !== 'caption')) return invalid(res);
      const found = await current(req.params.id);
      if (!found || found.post.user_id !== auth.user.id) return missing(res);
      found.post.caption = req.body.caption.trim();
      found.post.updated_at = new Date().toISOString();
      writePosts(found.posts);
      return res.json({ success: true, post: present(found.post, found.source) });
    }),
    remove: route(async (req, res, auth) => {
      const found = await current(req.params.id);
      if (!found || (found.post.user_id !== auth.user.id && auth.user.role !== 'admin')) return missing(res);
      writePosts(found.posts.filter((post) => post.id !== found.post.id));
      return res.json({ success: true });
    }),
    removeComment: route(async (req, res, auth) => {
      const found = await current(req.params.id);
      if (!found) return missing(res);
      const comment = found.post.comments?.find((item) => item.id === req.params.commentId);
      if (!comment || (comment.user_id !== auth.user.id && auth.user.role !== 'admin')) return missing(res);
      found.post.comments = found.post.comments.filter((item) => item.id !== comment.id);
      writePosts(found.posts);
      return res.json({ success: true, comment_count: found.post.comments.length });
    }),
  };
}

module.exports = { createCommunityHandlers };
