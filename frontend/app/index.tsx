import { COLORS, moodById, Track, TRACK_POOL } from "@/constants/moodflow";
import { PlayerQueueEntry } from "@/contexts/PlayerContext";
import { supabase } from "@/lib/supabase";
import { AIParsedResult } from "@/services/ai-prompt-parser";
import { presetForMoodActivity } from "@/services/audio-presets";
import { generateJourney, Journey, Stage } from "@/services/journey-generator";
import {
  normalizeSavedJourney,
  saveGeneratedJourney,
} from "@/services/journey-library";
import { loadMusicCatalog } from "@/services/track-catalog";
import { trackKey } from "@/services/track-source";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

// Shared Layout Components
import BottomPlayer from "@/components/moodflow/player/BottomPlayer";
import AmbientGlow from "@/components/moodflow/shared/AmbientGlow";
import Icon from "@/components/moodflow/shared/Icon";
import MobileNav from "@/components/moodflow/shared/MobileNav";
import Sidebar from "@/components/moodflow/shared/Sidebar";

// Feature Pages
import CommunityPage from "@/components/moodflow/community/CommunityPage";
import DiscoverPage from "@/components/moodflow/discover/DiscoverPage";
import HomePage from "@/components/moodflow/home/HomePage";
import JourneyPage from "@/components/moodflow/journey/JourneyPage";
import MusicDNAPage from "@/components/moodflow/music-dna/MusicDNAPage";
import MyMusicPage from "@/components/moodflow/my-music/MyMusicPage";
import SettingsPage from "@/components/moodflow/settings/SettingsPage";
import StatisticsPage from "@/components/moodflow/statistics/StatisticsPage";


import AIAssistantModal from "@/components/moodflow/ai-assistant/AIAssistantModal";
import GeneratingModal from "@/components/moodflow/ai-assistant/GeneratingModal";
import NowPlayingModal from "@/components/moodflow/player/NowPlayingModal";
import SessionFeedbackModal from "@/components/moodflow/statistics/SessionFeedbackModal";

// Auth Screen
import AuthScreen from "@/app/auth";
import type { DNARecommendationPreferences } from "@/services/dna-service";
import {
  DEFAULT_DNA_PREFERENCES,
  getDNARecommendationPreferences,
} from "@/services/dna-service";
import { getCurrentUserProfile } from "@/services/mood-service";

export default function MoodFlowMain() {
  const [authed, setAuthed] = useState(true);
  const [userName, setUserName] = useState("Người nghe");
  const [userId, setUserId] = useState<string>("guest");
  const [userRole, setUserRole] = useState<"user" | "admin">("user");
  const [dnaPreferences, setDnaPreferences] =
    useState<DNARecommendationPreferences>(DEFAULT_DNA_PREFERENCES);
  const [dnaPreferencesReady, setDnaPreferencesReady] = useState(false);
  const [dnaPreferencesLoadError, setDnaPreferencesLoadError] = useState<
    string | null
  >(null);

  // Kiểm tra session từ Backend JWT hoặc Supabase Cloud
  React.useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const savedUser = localStorage.getItem("moodflow_user");
      const savedToken = localStorage.getItem("moodflow_token");
      if (savedToken && savedUser) {
        try {
          const u = JSON.parse(savedUser);
          if (u?.displayName) setUserName(u.displayName);
          if (u?.id) setUserId(u.id);
          if (u?.role) setUserRole(u.role);
          setAuthed(true);
        } catch (e) {}
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthed(true);
        if (session.user.id) setUserId(session.user.id);
        getCurrentUserProfile().then((prof) => {
          if (prof?.displayName) setUserName(prof.displayName);
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthed(true);
        if (session.user.id) setUserId(session.user.id);
        getCurrentUserProfile().then((prof) => {
          if (prof?.displayName) setUserName(prof.displayName);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    let active = true;
    setDnaPreferencesReady(false);
    setDnaPreferencesLoadError(null);
    setDnaPreferences(DEFAULT_DNA_PREFERENCES);

    getDNARecommendationPreferences(userId)
      .then((preferences) => {
        if (active) setDnaPreferences(preferences);
      })
      .catch((cause: unknown) => {
        if (active) {
          setDnaPreferencesLoadError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải tùy chỉnh Music DNA.",
          );
        }
      })
      .finally(() => {
        if (active) setDnaPreferencesReady(true);
      });

    return () => {
      active = false;
    };
  }, [userId]);

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
    moodFrom: "deep_focus",
    moodTo: "calm_unwind",
    activity: "deep_work",
    duration: 30,
  });

  const [journey, setJourney] = useState<Journey | null>(() =>
    generateJourney({
      moodFrom: moodById("deep_focus"),
      moodTo: moodById("calm_unwind"),
      activity: "deep_work",
      duration: 30,
    }),
  );

  // Music Playback state
  const [nowPlaying, setNowPlaying] = useState<Track | null>(
    () => TRACK_POOL.acknowledge?.[0] || null,
  );
  const [stageInfo, setStageInfo] = useState({
    index: 0,
    total: 4,
    title: "Khởi đầu & Thấu cảm",
  });
  const [playing, setPlaying] = useState(false);

  // Cảnh báo người dùng trước khi đóng tab/tắt app khi đang nghe
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const handleBeforeUnload = (e: any) => {
        if (playing) {
          e.preventDefault();
          e.returnValue =
            "Bạn có muốn đánh giá phiên trị liệu âm nhạc trước khi rời đi?";
          return e.returnValue;
        }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [playing]);

  const currentMood = moodById(state.moodFrom);

  const previousQueueEnd = useRef(queueEndCount);
  useEffect(() => {
    if (
      queueEndCount !== previousQueueEnd.current &&
      queue[currentIndex]?.historyContext?.stage
    )
      setFeedbackModalOpen(true);
    previousQueueEnd.current = queueEndCount;
  }, [queueEndCount, queue, currentIndex]);

  useEffect(() => {
    if (typeof window === "undefined" || !playing) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [playing]);

  useEffect(() => {
    const nextPreset = presetForMoodActivity(state.moodTo, state.activity);
    void setPreset(nextPreset);
  }, [state.moodTo, state.activity, setPreset]);

  // Trigger Journey Generation with 5-step animation
  const triggerGenerateJourney = useCallback(
    (customState?: typeof state) => {
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
              preferences: dnaPreferences,
            });
            setJourney(j);
            void saveGeneratedJourney(j, userId, userName).catch(
              (error: unknown) =>
                console.error("Không lưu được hành trình", error),
            );
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
              setPlaying(true);
              audioSynth.play();
            }

            // TỰ ĐỘNG LƯU VÀO CSDL BACKEND KHI TẠO HÀNH TRÌNH (GẮN VỚI USER ID)
            try {
              const token =
                typeof localStorage !== "undefined"
                  ? localStorage.getItem("moodflow_token")
                  : null;
              const savedUserStr =
                typeof localStorage !== "undefined"
                  ? localStorage.getItem("moodflow_user")
                  : null;
              let currentUserId = "guest";
              if (savedUserStr) {
                try {
                  const u = JSON.parse(savedUserStr);
                  if (u?.id) currentUserId = u.id;
                } catch (e) {}
              }

              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };
              if (token) headers.Authorization = `Bearer ${token}`;

              await fetch("http://localhost:5000/api/journeys", {
                method: "POST",
                headers,
                body: JSON.stringify({
                  title: `${from.emoji} ${from.label} ➔ ${to.emoji} ${to.label}`,
                  moodFrom: from,
                  moodTo: to,
                  activity: j.activityLabel || activeState.activity,
                  duration: j.totalMin,
                  stages: j.stages,
                  userId: currentUserId,
                  userName: userName || "Người nghe",
                }),
              });
            } catch (err) {
              console.error("Lỗi tự động lưu hành trình vào CSDL:", err);
            }
          }, 500);
          return prev;
        });
      }, 600);
    },
    [
      selectTrack,
      state,
      trackPool,
      catalogLoading,
      catalogError,
      userId,
      userName,
    ],
  );

  const handlePlayTrack = useCallback(
    (track: Track, stage?: Stage, stageIndex?: number) => {
      const queue: PlayerQueueEntry[] =
        stage && stageIndex !== undefined && journey
          ? journey.stages.flatMap((journeyStage, index) =>
              journeyStage.tracks.map((journeyTrack) => ({
                track: journeyTrack,
                stageInfo: {
                  index,
                  total: journey.stages.length,
                  title: journeyStage.title,
                },
                historyContext: {
                  journeyId: journey.id ?? null,
                  moodId: index === 0 ? journey.moodFromId : journey.moodToId,
                  stage: journeyStage.key,
                },
              })),
            )
          : libraryTracks.map((libraryTrack) => ({
              track: libraryTrack,
              stageInfo: { index: 0, total: 1, title: "Thư viện" },
            }));
      let trackIndex = queue.findIndex(
        (entry) =>
          trackKey(entry.track) === trackKey(track) &&
          (stageIndex === undefined || entry.stageInfo?.index === stageIndex),
      );
      if (trackIndex < 0) {
        queue.unshift({ track, stageInfo: null });
        trackIndex = 0;
      }
      const selectedStage =
        stage && stageIndex !== undefined && journey
          ? {
              index: stageIndex,
              total: journey.stages.length,
              title: stage.title,
            }
          : queue[trackIndex]?.stageInfo;
      selectTrack(track, selectedStage, queue, trackIndex);
    },
    [journey, selectTrack, libraryTracks],
  );

  const handleSelectJourney = useCallback(
    (raw: unknown) => {
      const selected = normalizeSavedJourney(raw, libraryTracks);
      setJourney(selected);
      setState((current) => ({
        ...current,
        moodFrom: selected.moodFrom.id,
        moodTo: selected.moodTo.id,
      }));
      setPage("journey");
      const entries: PlayerQueueEntry[] = selected.stages.flatMap(
        (stage, index) =>
          stage.tracks.map((track) => ({
            track,
            stageInfo: {
              index,
              total: selected.stages.length,
              title: stage.title,
            },
            historyContext: {
              journeyId: selected.id ?? null,
              moodId: index === 0 ? selected.moodFromId : selected.moodToId,
              stage: stage.key,
            },
          })),
      );
      if (entries[0])
        selectTrack(entries[0].track, entries[0].stageInfo, entries, 0);
    },
    [libraryTracks, selectTrack],
  );

  const handleNextTrack = () => {
    if (
      queue[currentIndex]?.historyContext?.stage &&
      currentIndex === queue.length - 1
    ) {
      void stopPlayback();
      setFeedbackModalOpen(true);
    } else nextTrack();
  };

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

  const performActualLogout = useCallback(() => {
    void stopPlayback()
      .then(async () => {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("moodflow_token");
          localStorage.removeItem("moodflow_user");
        }
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Failed to sign out", error);
        setAuthed(false);
        setLogoutPending(false);
      })
      .catch((error: unknown) => {
        console.error("Failed to stop audio before logout", error);
        setAuthed(false);
      });
  }, [stopPlayback]);

  const handleLogout = useCallback(() => {
    setLogoutPending(true);
    setFeedbackModalOpen(true);
  }, []);

  // Switch page content
  const pageContent = useMemo(() => {
    switch (page) {
      case "home":
        return (
          <HomePage
            state={state}
            setState={setState}
            onCreateJourney={() => triggerGenerateJourney()}
            onOpenAI={() => setAiOpen(true)}
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
        return (
          <MusicDNAPage
            userId={userId}
            preferences={dnaPreferences}
            preferencesReady={dnaPreferencesReady}
            preferencesLoadError={dnaPreferencesLoadError}
            onPreferencesChange={setDnaPreferences}
          />
        );
      case "discover":
        return <DiscoverPage />;
      case "mymusic":
        return (
          <MyMusicPage
            onPlayTrack={handlePlayTrack}
            onSelectJourney={(selectedJ) => {
              setJourney(selectedJ);
              setPage("journey");
              const first = selectedJ.stages?.[0]?.tracks?.[0];
              if (first) {
                handlePlayTrack(first, selectedJ.stages[0], 0);
              }
            }}
            onGoToHome={() => setPage("home")}
          />
        );
      case "community":
        return (
          <CommunityPage
            onSelectJourney={(selectedJ) => {
              setJourney(selectedJ);
              setPage("journey");
              const first = selectedJ.stages?.[0]?.tracks?.[0];
              if (first) {
                handlePlayTrack(first, selectedJ.stages[0], 0);
              }
            }}
            userId={userId}
            userName={userName}
            userRole={userRole}
          />
        );
      case "stats":
        return (
          <StatisticsPage
            userId={userId}
            userName={userName}
            currentJourney={journey}
          />
        );
      case "settings":
        return <SettingsPage onLogout={handleLogout} userName={userName} />;
      default:
        return null;
    }
  }, [
    page,
    state,
    journey,
    userName,
    playing,
    userId,
    userRole,
    dnaPreferences,
    dnaPreferencesReady,
    dnaPreferencesLoadError,
  ]);

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  const performActualLogout = async () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("moodflow_token");
      localStorage.removeItem("moodflow_user");
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    audioSynth.pause();
    setPlaying(false);
    setAuthed(false);
    setLogoutPending(false);
  };

  const handleLogout = () => {
    // Khi người dùng bấm đăng xuất hoặc tắt app: Bật Pop-up đánh giá cảm xúc & lưu CSDL
    setLogoutPending(true);
    setFeedbackModalOpen(true);
  };

  // If user is not logged in, render AuthScreen
  if (!authed) {
    return (
      <AuthScreen
        onAuthSuccess={(name) => {
          setUserName(name || "Người nghe");
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

          {catalogLoading && (
            <Text style={{ color: COLORS.muted, marginBottom: 12 }}>
              Đang tải thư viện nhạc…
            </Text>
          )}
          {!catalogLoading && (
            <View style={{ marginBottom: 12, gap: 8 }}>
              {catalogError && (
                <Text
                  accessibilityRole="alert"
                  style={{ color: COLORS.danger }}
                >
                  {catalogError}
                </Text>
              )}
              <Pressable
                onPress={() => {
                  setCatalogLoading(true);
                  setCatalogError(null);
                  void loadMusicCatalog()
                    .then((catalog) => {
                      setTrackPool(catalog.pools);
                      setLibraryTracks(catalog.tracks);
                      initializeLibrary(catalog.tracks);
                      setJourney(null);
                    })
                    .catch((reason: unknown) =>
                      setCatalogError(
                        reason instanceof Error
                          ? reason.message
                          : "Không tải được thư viện nhạc.",
                      ),
                    )
                    .finally(() => setCatalogLoading(false));
                }}
              >
                <Text style={{ color: COLORS.ok }}>Tải lại thư viện</Text>
              </Pressable>
            </View>
          )}
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
        nowPlaying={nowPlaying}
        playing={playing}
        setPlaying={handleTogglePlay}
        stageInfo={stageInfo}
        onOpenNowPlaying={() => setNowPlayingModal(true)}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onFinishJourney={() => setFeedbackModalOpen(true)}
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
          onNext={handleNextTrack}
          onPrev={previousTrack}
        />
      )}

      {/* Generating 5-Step Animation Modal */}
      {isGenerating && (
        <GeneratingModal stepIndex={generationStep} currentMood={currentMood} />
      )}
      <SessionFeedbackModal
        visible={feedbackModalOpen}
        userId={userId}
        journey={journey}
        onClose={() => {
          setFeedbackModalOpen(false);
          if (logoutPending) performActualLogout();
        }}
      />
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
