module.exports = function registerAudius(app, { apiKey, apiUrl, siteUrl, fetchImpl = globalThis.fetch } = {}) {
  // Restrict configuration to the expected HTTPS API; never proxy arbitrary URLs.
  if (!apiUrl) throw new Error('Cần cấu hình AUDIUS_API_URL trong backend/.env');
  const base = new URL(apiUrl);
  if (base.protocol !== 'https:' || !['api.audius.co', 'discoveryprovider.audius.co'].includes(base.hostname)) {
    throw new Error('AUDIUS_API_URL must use an official Audius HTTPS host');
  }
  const root = base.href.replace(/\/$/, '');
  app.get('/api/audius/search', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const offset = Number(req.query.offset || 0);
    if (!q || q.length > 200 || !Number.isInteger(offset) || offset < 0 || offset > 10000) {
      return res.status(400).json({ success: false, error: 'Nhập từ khóa từ 1–200 ký tự và trang hợp lệ.' });
    }
    const url = new URL(`${root}/tracks/search`);
    url.search = new URLSearchParams({ query: q, limit: '20', offset: String(offset), app_name: 'MoodFlow' }).toString();
    try {
      const response = await fetchImpl(url, { headers: apiKey ? { 'x-api-key': apiKey } : {}, signal: AbortSignal.timeout(15000) });
      if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ success: false,
        error: response.status === 429 ? 'Audius đang giới hạn lượt tìm kiếm. Hãy thử lại sau.' : 'Audius từ chối tìm kiếm. Kiểm tra API key hoặc thử lại sau.' });
      const payload = await response.json();
      if (!Array.isArray(payload.data)) throw new Error('Invalid Audius response');
      const safeUrl = value => typeof value === 'string' && /^https?:\/\//i.test(value) ? value : '';
      const data = payload.data.filter(t => /^[a-z0-9]+$/i.test(t.id || '') && t.is_streamable === true && !t.is_stream_gated && !t.is_delete).map(t => ({
        sourceId: t.id, title: String(t.title || 'Bài hát'), artist: String(t.user?.name || 'Nghệ sĩ'),
        durationSec: Math.max(0, Number(t.duration) || 0), genre: String(t.genre || 'Khác'),
        cover: safeUrl(t.artwork?.['480x480'] || t.artwork?.['150x150']),
        // Public stream endpoint, no private bearer credentials exposed in URLs.
        audioUrl: `${root}/tracks/${encodeURIComponent(t.id)}/stream?app_name=MoodFlow`,
        shareUrl: siteUrl && t.permalink?.startsWith('/') ? new URL(t.permalink, siteUrl).href : '',
        licenseUrl: '',
      }));
      return res.json({ success: true, data, nextOffset: payload.data.length === 20 ? offset + 20 : null, testMode: false });
    } catch (error) {
      return res.status(502).json({ success: false, error: error.name === 'TimeoutError'
        ? 'Audius phản hồi quá lâu. Hãy thử lại.' : 'Không tải được dữ liệu từ Audius.' });
    }
  });
};
