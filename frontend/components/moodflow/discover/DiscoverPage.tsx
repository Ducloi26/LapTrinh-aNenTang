import { StyleSheet, View } from 'react-native';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import AudiusSearch from '@/components/moodflow/discover/AudiusSearch';

export default function DiscoverPage() {
  return (
    <View style={styles.container}>
      <SectionTitle title="Khám phá" subtitle="Tìm và nghe nhạc Audius." />
      <AudiusSearch />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 980,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
  },
});
