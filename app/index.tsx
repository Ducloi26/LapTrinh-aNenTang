import { COLORS, moodById, Track, TRACK_POOL } from "@/constants/moodflow";
import { AIParsedResult } from "@/services/ai-prompt-parser";
import { presetForMoodActivity } from "@/services/audio-presets";
import { generateJourney, Journey, Stage } from "@/services/journey-generator";
import { PlayerQueueEntry, usePlayer } from "@/contexts/PlayerContext";
import { trackKey } from "@/services/track-source";
import { loadMusicCatalog } from "@/services/track-catalog";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  const {
    playTrack: selectTrack,
    togglePlay,
    stop: stopPlayback,
    setPreset,
    playing,
    nowPlaying,
    stageInfo,
    elapsedSeconds,
    durationSeconds,
    seekTo,
    initializeLibrary,
  } = usePlayer();
  const [authed, setAuthed] = useState(true);
  const [userName, setUserName] = useState("Lợi");
  const [trackPool, setTrackPool] = useState(TRACK_POOL);
  const [libraryTracks, setLibraryTracks] = useState<Track[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

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
  const initialJourney = useRef(journey);

  useEffect(() => {
    let active = true;
    void loadMusicCatalog().then((catalog) => {
      if (!active) return;
      setTrackPool(catalog.pools);
      setLibraryTracks(catalog.tracks);
      initializeLibrary(catalog.tracks);
      setJourney((current) => current === initialJourney.current ? generateJourney({
        moodFrom: moodById("anxious"), moodTo: moodById("focus"),
        activity: "coding", duration: 120, trackPool: catalog.pools,
      }) : current);
    }).catch((reason: unknown) => {
      if (active) setCatalogError(reason instanceof Error ? reason.message : "Không tải được thư viện nhạc.");
    }).finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [initializeLibrary]);

  const currentMood = moodById(state.moodFrom);

  useEffect(() => {
    const nextPreset = presetForMoodActivity(state.moodTo, state.activity);
    void setPreset(nextPreset);
  }, [state.moodTo, state.activity, setPreset]);

  // Trigger Journey Generation with 5-step animation
  const triggerGenerateJourney = useCallback((customState?: typeof state) => {
    if (catalogLoading || catalogError) return;
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
            trackPool,
          });
          setJourney(j);
          setIsGenerating(false);
          setPage("journey");
          const first = j.stages[0]?.tracks[0];
          if (first) {
            const queue: PlayerQueueEntry[] = j.stages.flatMap((stage, index) =>
              stage.tracks.map((track) => ({
                track,
                stageInfo: {
                  index,
                  total: j.stages.length,
                  title: stage.title,
                },
              })),
            );
            selectTrack(first, queue[0]?.stageInfo, queue, 0);
          }
        }, 500);
        return prev;
      });
    }, 600);
  }, [selectTrack, state, trackPool, catalogLoading, catalogError]);

  const handlePlayTrack = useCallback((
    track: Track,
    stage?: Stage,
    stageIndex?: number,
  ) => {
    const queue: PlayerQueueEntry[] = stage && stageIndex !== undefined && journey
      ? journey.stages.flatMap((journeyStage, index) =>
          journeyStage.tracks.map((journeyTrack) => ({
            track: journeyTrack,
            stageInfo: {
              index,
              total: journey.stages.length,
              title: journeyStage.title,
            },
          })),
        )
      : libraryTracks.map((libraryTrack) => ({
          track: libraryTrack,
          stageInfo: { index: 0, total: 1, title: "Thư viện" },
        }));
    const trackIndex = Math.max(0, queue.findIndex((entry) =>
      trackKey(entry.track) === trackKey(track) &&
      (stageIndex === undefined || entry.stageInfo?.index === stageIndex),
    ));
    const selectedStage = stage && stageIndex !== undefined && journey
      ? { index: stageIndex, total: journey.stages.length, title: stage.title }
      : queue[trackIndex]?.stageInfo;
    selectTrack(track, selectedStage, queue, trackIndex);
  }, [journey, selectTrack, libraryTracks]);

  const handleTogglePlay = () => {
    togglePlay();
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
        return <MyMusicPage tracks={libraryTracks} onPlayTrack={handlePlayTrack} />;
      case "community":
        return <CommunityPage />;
      case "stats":
        return <StatisticsPage />;
      case "settings":
        return (
          <SettingsPage
            onLogout={() => {
              void stopPlayback().then(() => {
                setAuthed(false);
              }).catch((error: unknown) => {
                console.error("Failed to stop audio before logout", error);
                setAuthed(false);
              });
            }}
            userName={userName}
          />
        );
      default:
        return null;
    }
  }, [
    page,
    state,
    journey,
    userName,
    stopPlayback,
    handlePlayTrack,
    triggerGenerateJourney,
    libraryTracks,
  ]);

  const handleLogout = () => {
    void stopPlayback().finally(() => setAuthed(false));
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
            { paddingBottom: isDesktop ? 160 : 220 },
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

          {catalogLoading && <Text style={{ color: COLORS.muted, marginBottom: 12 }}>Đang tải thư viện nhạc…</Text>}
          {!catalogLoading && <View style={{ marginBottom: 12, gap: 8 }}>
            {catalogError && <Text accessibilityRole="alert" style={{ color: COLORS.danger }}>{catalogError}</Text>}
            <Pressable onPress={() => {
              setCatalogLoading(true);
              setCatalogError(null);
              void loadMusicCatalog().then((catalog) => {
                setTrackPool(catalog.pools);
                setLibraryTracks(catalog.tracks);
                initializeLibrary(catalog.tracks);
                setJourney(null);
              }).catch((reason: unknown) => setCatalogError(reason instanceof Error ? reason.message : "Không tải được thư viện nhạc."))
                .finally(() => setCatalogLoading(false));
            }}><Text style={{ color: COLORS.ok }}>Tải lại thư viện</Text></Pressable>
          </View>}
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
        <BottomPlayer
          bottomOffset={isDesktop ? 0 : 60}
          onOpenNowPlaying={() => setNowPlayingModal(true)}
        />

      {/* Full-Screen Now Playing Experience Modal */}
      {nowPlayingModal && (
        <NowPlayingModal
          track={nowPlaying}
          isPlaying={playing}
          onTogglePlay={handleTogglePlay}
          elapsedSeconds={elapsedSeconds}
          durationSeconds={durationSeconds}
          onSeek={seekTo}
          currentMood={currentMood}
          stageInfo={stageInfo ?? undefined}
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
