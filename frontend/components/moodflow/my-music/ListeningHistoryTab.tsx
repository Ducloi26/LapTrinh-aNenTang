import {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, Text, View} from 'react-native';
import {COLORS} from '@/constants/moodflow';
import {usePlayer} from '@/contexts/PlayerContext';
import {getBackendSession} from '@/services/backend-session';

interface HistoryRow {
  played_at: string; listened_sec: number; completed: boolean;
  tracks: {id:string;title:string;artists?:{name?:string}|{name?:string}[]} | null;
}
export default function ListeningHistoryTab() {
  const {historyRevision, historyError, retryHistory}=usePlayer();
  const [rows,setRows]=useState<HistoryRow[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [version,setVersion]=useState(0);
  useEffect(()=>{
    let active=true;const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    setLoading(true);setError('');
    (async()=>{
      const session=getBackendSession();if(!session)throw Error('Đăng nhập để xem lịch sử nghe của bạn.');
      const response=await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL||'http://localhost:5000'}/api/music-dna/${encodeURIComponent(session.userId)}/listening-history`,{
        headers:{Authorization:`Bearer ${session.token}`},signal:controller.signal,
      });
      const result=await response.json();
      if(!response.ok||!result.success||!Array.isArray(result.data))throw Error(result.error||'Không tải được lịch sử.');
      if(active)setRows(result.data);
    })().catch(e=>{if(active)setError(e.name==='AbortError'?'Tải lịch sử quá lâu. Hãy thử lại.':e.message);})
      .finally(()=>{clearTimeout(timer);if(active)setLoading(false);});
    return ()=>{active=false;controller.abort();clearTimeout(timer);};
  },[historyRevision,version]);
  return <View style={{gap:14}}>
    <Text style={{color:COLORS.text,fontWeight:'700'}}>Lịch sử nghe đã lưu · 30 ngày gần nhất</Text>
    <Pressable accessibilityRole="button" disabled={loading} onPress={()=>{
      void retryHistory().then(()=>setVersion(v=>v+1));
    }}><Text style={{color:COLORS.ok}}>↻ Thử lưu lại và làm mới</Text></Pressable>
    {!!historyError&&<Text style={{color:COLORS.danger}}>{historyError}</Text>}
    {loading?<ActivityIndicator color={COLORS.ok}/>:error?<Text style={{color:COLORS.danger}}>{error}</Text>:rows.length===0?
      <Text style={{color:COLORS.muted}}>Chưa có lượt nghe đã lưu. Nghe ít nhất 5 giây rồi đổi bài hoặc dừng; pause chưa kết thúc lượt nghe.</Text>:
      rows.map((row,index)=>{
        const artists=row.tracks?.artists;const artist=Array.isArray(artists)?artists[0]?.name:artists?.name;
        return <View key={`${row.played_at}-${row.tracks?.id}-${index}`} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:COLORS.border,gap:5}}>
          <Text style={{color:COLORS.text,fontWeight:'600'}}>{row.tracks?.title||'Bài hát'}</Text>
          <Text style={{color:COLORS.muted}}>{artist||'Nghệ sĩ'} · Đã nghe {row.listened_sec} giây · {row.completed?'Hoàn thành':'Chưa hoàn thành'}</Text>
          <Text style={{color:COLORS.muted}}>{new Date(row.played_at).toLocaleString()}</Text>
        </View>;
      })}
  </View>;
}
