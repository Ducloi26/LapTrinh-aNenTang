import { COLORS, moodById, Track, TRACK_POOL } from "@/constants/moodflow";
import { AIParsedResult } from "@/services/ai-prompt-parser";
import { audioSynth } from "@/services/audio-service";
import {
  presetForMoodActivity,
  SynthPresetId,
} from "@/services/audio-presets";
import { generateJourney, Journey, Stage } from "@/services/journey-generator";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

// Shared Layout Components
import AmbientGlow from "@/components/moodflow/shared/AmbientGlow";
import Icon from "@/components/moodflow/shared/Icon";
import MobileNav from "@/components/moodflow/shared/MobileNav";
import Sidebar from "@/components/moodflow/shared/Sidebar";
import BottomPlayer from "@/components/moodflow/player/BottomPlayer";

// Feature Pages
import CommunityPage from "@/components/moodflow/community/CommunityPage";
import DiscoverPage from "@/components/moodflow/discover/DiscoverPage";
import HomePage from "@/components/moodflow/home/HomePage";
import JourneyPage from "@/components/moodflow/journey/JourneyPage";
import MusicDNAPage from "@/components/moodflow/music-dna/MusicDNAPage";
import MyMusicPage from "@/components/moodflow/my-music/MyMusicPage";
import SettingsPage from "@/components/moodflow/settings/SettingsPage";
import StatisticsPage from "@/components/moodflow/statistics/StatisticsPage";

// Modals & Player
import AIAssistantModal from "@/components/moodflow/ai-assistant/AIAssistantModal";
import GeneratingModal from "@/components/moodflow/ai-assistant/GeneratingModal";
import NowPlayingModal from "@/components/moodflow/player/NowPlayingModal";

// Auth Screen
import AuthScreen from "@/app/auth";

export default function MoodFlowMain() {
  const [authed, setAuthed] = useState(true);
  const [userName, setUserName] = useState("Lợi");

  // App Navigation & Responsive
  const [page, setPage] = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // Modals & Assistant
  const [aiOpen, setAiOpen] = useState(false);
  const [nowPlayingModal, setNowPlayingModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // App State: Mood selection & generated journey
  const [state, setState] = useState({
    moodFrom: "anxious",
    moodTo: "focus",
    activity: "coding",
    duration: 120,
  });

  const [journey, setJourney] = useState<Journey | null>(() =>
    generateJourney({
      moodFrom: moodById("anxious"),
      moodTo: moodById("focus"),
      activity: "coding",
      duration: 120,
    }),
  );

  // Music Playback state
  const [nowPlaying, setNowPlaying] = useState<Track | null>(
    () => TRACK_POOL.focus[0],
  );
  const [stageInfo, setStageInfo] = useState({
    index: 0,
    total: 4,
    title: "Focus",
  });
  const [playing, setPlaying] = useState(false);
  const [presetId, setPresetId] = useState<SynthPresetId>("deep-work");
  const [volume, setVolume] = useState(0.55);
  const [audioError, setAudioError] = useState<string | null>(null);

  const currentMood = moodById(state.moodFrom);

  const reportAudioError = (error: unknown) => {
    setAudioError(
      error instanceof Error ? error.message : "Không thể khởi tạo bộ phát âm thanh.",
    );
    setPlaying(false);
  };

  const startSynth = async (nextPreset = presetId) => {
    try {
      await audioSynth.play(nextPreset);
      setAudioError(null);
      setPlaying(true);
    } catch (error) {
      reportAudioError(error);
    }
  };

  const stopSynth = async () => {
    try {
      await audioSynth.stop();
      setAudioError(null);
    } catch (error) {
      reportAudioError(error);
    } finally {
      setPlaying(false);
    }
  };

  const changePreset = async (nextPreset: SynthPresetId) => {
    setPresetId(nextPreset);
    try {
      await audioSynth.setPreset(nextPreset);
      setAudioError(null);
    } catch (error) {
      reportAudioError(error);
    }
  };

  useEffect(() => {
    const nextPreset = presetForMoodActivity(state.moodTo, state.activity);
    setPresetId(nextPreset);
    void audioSynth.setPreset(nextPreset).then(() => {
      setAudioError(null);
    }).catch((error: unknown) => {
      setAudioError(
        error instanceof Error
          ? error.message
          : "Không thể đổi preset âm thanh.",
      );
      setPlaying(false);
    });
  }, [state.moodTo, state.activity]);

  useEffect(() => {
    return () => {
      void audioSynth.stop().catch((error: unknown) => {
        console.error("Failed to release Web Audio resources", error);
      });
    };
  }, []);

  const changeVolume = (nextVolume: number) => {
    setVolume(nextVolume);
    audioSynth.setVolume(nextVolume);
  };

  // Trigger Journey Generation with 5-step animation
  const triggerGenerateJourney = (customState?: typeof state) => {
    const activeState = customState || state;
    setIsGenerating(true);
    setGenerationStep(0);

    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < 4) return prev + 1;
        clearInterval(interval);
        setTimeout(() => {
          const j = generateJourney({
            moodFrom: moodById(activeState.moodFrom),
            moodTo: moodById(activeState.moodTo),
            activity: activeState.activity,
            duration: activeState.duration,
          });
          setJourney(j);
          setIsGenerating(false);
          setPage("journey");
          const first = j.stages[0]?.tracks[0];
          if (first) {
            setNowPlaying(first);
            setStageInfo({
              index: 0,
              total: j.stages.length,
              title: j.stages[0].title,
            });
            void startSynth();
          }
        }, 500);
        return prev;
      });
    }, 600);
  };

  const handlePlayTrack = (
    track: Track,
    stage?: Stage,
    stageIndex?: number,
  ) => {
    setNowPlaying(track);
    if (stage && stageIndex !== undefined && journey) {
      setStageInfo({
        index: stageIndex,
        total: journey.stages.length,
        title: stage.title,
      });
    }
    void startSynth();
  };

  const handleTogglePlay = () => {
    if (playing) {
      void audioSynth.pause().then(() => {
        setPlaying(false);
      }).catch(reportAudioError);
    } else {
      void startSynth();
    }
  };

  const applyFromAI = (parsed: AIParsedResult) => {
    const next = {
      moodFrom: parsed.mood,
      moodTo: parsed.goal,
      activity: parsed.activity,
      duration: parsed.duration,
    };
    setState(next);
    triggerGenerateJourney(next);
  };

  // Switch page content
  const pageContent = useMemo(() => {
    switch (page) {
      case "home":
        return (
          <HomePage
            state={state}
            setState={setState}
            onCreateJourney={() => triggerGenerateJourney()}
            userName={userName}
          />
        );
      case "journey":
        return (
          <JourneyPage
            journey={journey}
            state={state}
            onPlayTrack={handlePlayTrack}
          />
        );
      case "dna":
        return <MusicDNAPage />;
      case "discover":
        return <DiscoverPage />;
      case "mymusic":
        return <MyMusicPage onPlayTrack={handlePlayTrack} />;
      case "community":
        return <CommunityPage />;
      case "stats":
        return <StatisticsPage />;
      case "settings":
        return (
          <SettingsPage
            onLogout={() => {
              void audioSynth.stop().then(() => {
                setAudioError(null);
                setPlaying(false);
                setAuthed(false);
              }).catch((error: unknown) => {
                setAudioError(
                  error instanceof Error
                    ? error.message
                    : "Không thể dừng bộ phát âm thanh.",
                );
                setPlaying(false);
                setAuthed(false);
              });
            }}
            userName={userName}
          />
        );
      default:
        return null;
    }
  }, [page, state, journey, userName, playing]);

  const handleLogout = () => {
    void stopSynth().finally(() => setAuthed(false));
  };

  // If user is not logged in, render AuthScreen
  if (!authed) {
    return (
      <AuthScreen
        onAuthSuccess={(name) => {
          setUserName(name || "Lợi");
          setAuthed(true);
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* Dynamic Ambient Background Glow shifting with Mood */}
      <AmbientGlow currentMood={currentMood} />

      {/* Main Body with Sidebar on Desktop */}
      <View style={styles.body}>
        {isDesktop && (
          <Sidebar
            page={page}
            setPage={setPage}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            currentMood={currentMood}
            userName={userName}
            onLogout={handleLogout}
          />
        )}

        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={[
            styles.mainScrollContent,
            { paddingBottom: isDesktop ? 120 : 160 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Quick Logout Button */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginBottom: 14,
            }}
          >
            <Pressable onPress={handleLogout} style={styles.topLogoutBtn}>
              <Icon name="logout" size={14} color={COLORS.danger} />
              <Text style={styles.topLogoutText}>Đăng xuất</Text>
            </Pressable>
          </View>

          {pageContent}
        </ScrollView>
      </View>

      {/* Mobile Navigation Bar */}
      {!isDesktop && (
        <MobileNav page={page} setPage={setPage} onLogout={handleLogout} />
      )}

      {/* Floating AI Assistant Button & Popover */}
      {page !== "mymusic" && (
        <AIAssistantModal
          open={aiOpen}
          setOpen={setAiOpen}
          applyFromAI={applyFromAI}
          currentMood={currentMood}
        />
      )}

      {/* Persistent Bottom Music Player */}
      {Platform.OS === "web" && (
        <BottomPlayer
          nowPlaying={nowPlaying}
          playing={playing}
          presetId={presetId}
          volume={volume}
          bottomOffset={isDesktop ? 0 : 60}
          error={audioError}
          onTogglePlay={handleTogglePlay}
          onStop={() => void stopSynth()}
          onVolumeChange={changeVolume}
          onPresetChange={(nextPreset) => void changePreset(nextPreset)}
          onOpenNowPlaying={() => setNowPlayingModal(true)}
        />
      )}

      {/* Full-Screen Now Playing Experience Modal */}
      {nowPlayingModal && (
        <NowPlayingModal
          track={nowPlaying}
          isPlaying={playing}
          onTogglePlay={handleTogglePlay}
          currentMood={currentMood}
          stageInfo={stageInfo}
          onClose={() => setNowPlayingModal(false)}
        />
      )}

      {/* Generating 5-Step Animation Modal */}
      {isGenerating && (
        <GeneratingModal stepIndex={generationStep} currentMood={currentMood} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    position: "relative",
    overflow: "hidden",
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  mainScroll: {
    flex: 1,
    zIndex: 10,
  },
  mainScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  topLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(251, 113, 133, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(251, 113, 133, 0.3)",
  },
  topLogoutText: {
    color: COLORS.danger,
    fontSize: 12.5,
    fontWeight: "700",
  },
});
