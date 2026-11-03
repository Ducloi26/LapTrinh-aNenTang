// The browser's userId is never used as the authority for a database write.
module.exports = function registerListeningHistory(app, { admin, jwt, secret }) {
  app.post('/api/listening-history', async (req, res) => {
    let actor;
    try {
      const header = req.headers.authorization || '';
      if (!header.startsWith('Bearer ')) throw new Error('missing token');
      actor = jwt.verify(header.slice(7), secret);
      if (!actor.id) throw new Error('missing identity');
    } catch {
      return res.status(401).json({ success: false, error: 'Phiên đăng nhập backend không hợp lệ. Vui lòng đăng nhập lại.' });
    }
    if (req.body.userId !== actor.id) return res.status(403).json({ success: false, error: 'Lượt nghe không thuộc tài khoản đang đăng nhập.' });
    if (!admin) return res.status(503).json({ success: false, error: 'Cần cấu hình SUPABASE_SERVICE_ROLE_KEY trên backend để lưu lịch sử.' });
    const r = req.body;
    try {
      const { data, error } = await admin.rpc('record_backend_listening_history', {
        p_user_id: actor.id, p_playback_id: r.playbackId, p_track_id: r.trackId,
        p_listened_sec: r.listenedSec, p_duration_sec: r.durationSec,
        p_end_reason: r.endReason, p_played_at: r.playedAt,
        p_journey_id: r.journeyId ?? null, p_mood_id: r.moodId ?? null, p_stage: r.stage ?? null,
      });
      if (error) return res.status(error.code === 'PGRST202' ? 503 : 400).json({ success: false,
        error: error.code === 'PGRST202' ? 'Chạy file backend/sql/listening-history-backend.sql trong Supabase SQL Editor trước khi lưu lịch sử.' : error.message });
      return res.json({ success: true, data });
    } catch {
      return res.status(503).json({ success: false, error: 'Không kết nối được database để lưu lịch sử. Hãy thử lưu lại.' });
    }
  });
};
