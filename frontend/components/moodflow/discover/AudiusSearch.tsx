import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '@/constants/moodflow';
import { usePlayer } from '@/contexts/PlayerContext';
import { AudiusTrack, audiusToTrack, searchAudius } from '@/services/audius-search-service';

export default function AudiusSearch() {
  const { playTrack, nowPlaying, error: playbackError } = usePlayer();
  const [query, setQuery] = useState('Sơn Tùng M-TP');
  const [songs, setSongs] = useState<AudiusTrack[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const term = useRef('');
  const search = async (more = false) => {
    if (busy || (!more && !query.trim())) return;
    const value = more ? term.current : query.trim();
    setBusy(true); setError(''); setSearched(true);
    if (!more) { setSongs([]); setNext(null); term.current = value; }
    try {
      const result = await searchAudius(value, more ? next ?? 0 : 0);
      setSongs(previous => more ? [...previous, ...result.data.filter(item => !previous.some(p => p.sourceId === item.sourceId))] : result.data);
      setNext(result.nextOffset); setTestMode(result.testMode);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tìm được nhạc.'); }
    finally { setBusy(false); }
  };
  return <View style={styles.panel}>
    <Text style={styles.title}>Nghe nhạc Audius</Text>
    <Text style={styles.hint}>Khi phát, bài được thêm vào thư viện để lưu lịch sử và cập nhật Music DNA. Nghe ít nhất 5 giây rồi đổi bài hoặc dừng để lưu lượt nghe. Bản edit/remix có thể khác bản gốc.</Text>
    <View style={styles.row}>
      <TextInput value={query} onChangeText={setQuery} editable={!busy} maxLength={200}
        accessibilityLabel="Tìm nhạc Audius" placeholder="Tên bài, nghệ sĩ hoặc piano, ambient..."
        placeholderTextColor={COLORS.faint} style={styles.input} onSubmitEditing={() => void search()} />
      <Pressable disabled={busy || !query.trim()} onPress={() => void search()} style={styles.button} accessibilityRole="button"><Text>Tìm nhạc</Text></Pressable>
    </View>
    {busy && <ActivityIndicator color={COLORS.ok} />}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {searched && !busy && !error && songs.length === 0 && <Text style={styles.hint}>Không tìm thấy bài phù hợp trong kho Audius.</Text>}
    {songs.map(song => <View key={song.sourceId} style={styles.song}>
      {!!song.cover && <Image source={{uri: song.cover}} style={styles.cover} />}
      <View style={styles.info}>
        <Text style={styles.title}>{song.title}</Text><Text style={styles.hint}>{song.artist} · {audiusToTrack(song).duration}</Text>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => {
            const queue = songs.map(s => ({ track: audiusToTrack(s), stageInfo: null }));
            playTrack(audiusToTrack(song), null, queue, songs.findIndex(s => s.sourceId === song.sourceId));
          }}><Text style={styles.link}>{nowPlaying?.audioUrl === song.audioUrl ? 'Đang chọn' : '▶ Phát'}</Text></Pressable>
          {!!song.shareUrl && <Text style={styles.link} onPress={() => void Linking.openURL(song.shareUrl)}>Audius ↗</Text>}
          {!!song.licenseUrl && <Text style={styles.link} onPress={() => void Linking.openURL(song.licenseUrl)}>Giấy phép ↗</Text>}
        </View>
      </View>
    </View>)}
    {songs.some(song => song.audioUrl === nowPlaying?.audioUrl) && playbackError && <Text style={styles.error}>{playbackError}</Text>}
    {next !== null && <Pressable disabled={busy} onPress={() => void search(true)}><Text style={styles.link}>Xem thêm kết quả</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  panel: { gap: 14, padding: 18, marginBottom: 28, backgroundColor: COLORS.surface2, borderRadius: 14 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  hint: { color: COLORS.muted, fontSize: 13 }, error: { color: COLORS.danger },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 },
  input: { flex: 1, minWidth: 160, color: COLORS.text, borderColor: COLORS.borderStrong, borderWidth: 1, padding: 12, borderRadius: 8 },
  button: { backgroundColor: COLORS.ok, padding: 12, borderRadius: 8 },
  song: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  info: { flex: 1, gap: 8 }, cover: { width: 64, height: 64, borderRadius: 8 },
  link: { color: COLORS.ok, paddingVertical: 6 },
});
