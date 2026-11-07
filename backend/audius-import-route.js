const crypto = require('node:crypto');
function sourceUuid(kind, id) {
  const hex = crypto.createHash('sha256').update(`moodflow:audius:${kind}:${id}`).digest('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
module.exports = function register(app, { admin, jwt, secret, apiKey, fetchImpl = globalThis.fetch }) {
  app.post('/api/audius/tracks/:sourceId/import', async (req, res) => {
    try {
      const token = (req.headers.authorization || '').replace(/^Bearer /, '');
      if (!jwt.verify(token, secret)?.id) throw Error('No user');
    } catch { return res.status(401).json({success:false,error:'Đăng nhập để lưu bài Audius và lịch sử nghe.'}); }
    if (!/^[a-z0-9]{1,40}$/i.test(req.params.sourceId)) return res.status(400).json({success:false,error:'ID Audius không hợp lệ.'});
    if (!admin) return res.status(503).json({success:false,error:'Backend chưa cấu hình khóa quản trị Supabase.'});
    try {
      // Never trust title, artist, stream URLs or features supplied by the browser.
      const response = await fetchImpl(`https://api.audius.co/v1/tracks/${req.params.sourceId}`, {
        headers: apiKey ? {'x-api-key':apiKey} : {}, signal:AbortSignal.timeout(15000),
      });
      if (!response.ok) throw Error('Không đọc được bài từ Audius.');
      const t = (await response.json()).data;
      if (!t || t.id !== req.params.sourceId || !t.user?.id || t.is_streamable !== true || t.is_stream_gated || t.is_delete) {
        return res.status(400).json({success:false,error:'Bài Audius này không hỗ trợ phát công khai.'});
      }
      const artistId = sourceUuid('artist',t.user.id), id = sourceUuid('track',t.id);
      const safeUrl = value => typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null;
      const artist = await admin.from('artists').upsert({id:artistId,name:t.user.name || 'Audius artist'}, {onConflict:'id'});
      if (artist.error) throw artist.error;
      const row = {id,artist_id:artistId,title:t.title,genre:t.genre || 'Khác',duration_sec:Math.max(1,Math.round(t.duration)),
        cover_url:safeUrl(t.artwork?.['480x480'] || t.artwork?.['150x150']) || '',
        audio_url:`https://api.audius.co/v1/tracks/${t.id}/stream?app_name=MoodFlow`};
      const track = await admin.from('tracks').upsert(row,{onConflict:'id'});
      if (track.error) throw track.error;
      const bpm = typeof t.bpm === 'number' && Number.isFinite(t.bpm) && t.bpm > 0 ? Math.round(t.bpm) : null;
      if (bpm !== null) {
        const feature = await admin.from('track_features').upsert({track_id:id,bpm,
          energy:null,valence:null,acousticness:null,instrumentalness:null,vocal_intensity:null,vocal_density:null,
          is_estimated:true},{onConflict:'track_id',ignoreDuplicates:true});
        if (feature.error) throw feature.error;
      }
      return res.json({success:true,data:{id,title:row.title,artist:t.user.name,genre:row.genre,cover:row.cover_url || '',
        audioUrl:row.audio_url,durationSec:row.duration_sec,bpm}});
    } catch(e) {
      return res.status(502).json({success:false,error:e.code === '42501'
        ? 'Backend thiếu quyền nhập nhạc. Chạy backend/sql/audius-import-permissions.sql trong Supabase SQL Editor.'
        : `Chưa lưu được bài Audius: ${e.message || 'lỗi kết nối'}`});
    }
  });
};
module.exports.sourceUuid = sourceUuid;
