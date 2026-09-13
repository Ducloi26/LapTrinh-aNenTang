import { useEffect, useState } from 'react';
import { MOODS } from '@/constants/moodflow';

export function useMoodCycle(intervalMs = 4200) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MOODS.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return { index, mood: MOODS[index] };
}
