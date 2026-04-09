"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import DigitalSmartNotesTab from "@/app/components/micro-learning/DigitalSmartNotesTab";
import { segmentTranscript } from "@/lib/segmenter";
import { useTheme } from "next-themes";
import BackButton from "@/app/components/micro-learning/BackButton";
import {
  FileText,
  ChevronLeft,
  RefreshCw,
  CheckCircle,
  RotateCcw,
  Play,
  Loader2,
  Lock,
  Check,
} from "lucide-react";

// Saves current video progress to the active session API
// Guard prevents multiple concurrent requests from stacking up
let _videoSaveInFlight = false;
async function saveVideoSession({
  sessionId,
  videoId,
  playlistId,
  videoTitle,
  currentTime,
}) {
  if (_videoSaveInFlight) return; // Skip if a save is already running
  _videoSaveInFlight = true;
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !sessionId) return;
    await fetch("/api/micro-learning/active-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        gameType: "mcq",
        moduleId: "microLearning",
        title: videoTitle || "Micro-Learning Video",
        quizState: {
          stage: "video",
          videoId,
          playlistId,
          progress: Math.round(currentTime || 0),
          videoTitle: videoTitle || "Micro-Learning Video",
        },
      }),
    });
  } catch {
    /* silent */
  } finally {
    _videoSaveInFlight = false;
  }
}

export default function VideoPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const videoId = params.videoId;
  const playlistId = searchParams.get("list");
  const urlSessionId = searchParams.get("sessionId");
  const sessionIdRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = `ml_${videoId}_${Date.now()}`;
  }, [videoId]);

  const [videos, setVideos] = useState([]);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoDetails, setVideoDetails] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState("course");

  // Video playback state
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  // Transcript states
  const hasTriggeredGladia = useRef(false);
  const [transcriptStatus, setTranscriptStatus] = useState("not_started");

  // MCQ states
  const hasSentToMCQ = useRef(false);
  const [mcqStatus, setMcqStatus] = useState("not_started");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = resolvedTheme === "light";

  const theme = {
    accent: isLight ? "#9067C6" : "#934CF0",
    bg: isLight ? "#ffffff" : "#0a080d",
    border: isLight ? "rgba(144, 103, 198, 0.15)" : "rgba(255, 255, 255, 0.1)",
    sidebar: isLight ? "rgba(144, 103, 198, 0.04)" : "rgba(147, 76, 240, 0.05)",
    textPrimary: isLight ? "#242038" : "#ffffff",
    textMuted: isLight ? "#655A7C" : "#94a3b8",
    success: "#10b981",
    isLight: isLight,
  };

  // Reset everything on video change
  useEffect(() => {
    hasTriggeredGladia.current = false;
    hasSentToMCQ.current = false;
    setTranscriptStatus("not_started");
    setMcqStatus("not_started");
  }, [videoId]);

  // Progress checking + Gladia + auto-MCQ
  useEffect(() => {
    if (!player || !videoId) return;

    const interval = setInterval(async () => {
      if (player.getCurrentTime && player.getDuration) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();

        if (duration > 0) {
          const progress = (currentTime / duration) * 100;

          // ─── Persist video progress to ActiveSession (every 5s) ───
          saveVideoSession({
            sessionId: sessionIdRef.current,
            videoId,
            playlistId,
            videoTitle: videoDetails?.title,
            currentTime,
          });

          if (
            progress >= 70 &&
            !hasTriggeredGladia.current &&
            transcriptStatus === "not_started"
          ) {
            hasTriggeredGladia.current = true;
            setTranscriptStatus("generating");
            console.log("70% reached → Starting transcript generation");

            try {
              // Route handles Step 1 (youtube-transcript-plus server-side)
              // and Step 2 (@ybd-project/ytdl-core/serverless → Gladia buffer) as fallback
              const response = await fetch(
                "/api/micro-learning/generate-transcript",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ videoId }),
                },
              );

              if (!response.ok)
                throw new Error(`Transcript fetch failed: ${response.status}`);

              const data = await response.json();
              if (data.transcript) {
                localStorage.setItem(`transcript_${videoId}`, data.transcript);
                setTranscriptStatus("ready");
                console.log("Transcript ready and cached");
              } else {
                throw new Error("No transcript data");
              }
            } catch (err) {
              console.error("Transcript error:", err);
              setTranscriptStatus("error");
            }
          }

          if (
            transcriptStatus === "ready" &&
            !hasSentToMCQ.current &&
            mcqStatus === "not_started"
          ) {
            hasSentToMCQ.current = true;
            setMcqStatus("generating");
            console.log("Transcript ready → Starting MCQ generation");

            const storedTranscript = localStorage.getItem(
              `transcript_${videoId}`,
            );
            if (storedTranscript) {
              try {
                const segments = segmentTranscript(storedTranscript, 1);

                const mcqResponse = await fetch("/api/micro-learning/mcq", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ segments, videoId }),
                });

                if (mcqResponse.ok) {
                  setMcqStatus("ready");
                  console.log("MCQs generated and cached");
                } else {
                  console.error("MCQ fail:", mcqResponse.status);
                  setMcqStatus("error");
                }
              } catch (err) {
                console.error("MCQ generation error:", err);
                setMcqStatus("error");
              }
            }
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [player, videoId, transcriptStatus, mcqStatus]);

  // Fetch playlist
  useEffect(() => {
    async function fetchPlaylist() {
      if (!playlistId) {
        // No playlist — still need to stop the loading spinner
        setLoading(false);
        return;
      }
      try {
        const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`,
        );
        if (!res.ok) throw new Error(`Playlist fetch failed: ${res.status}`);
        const data = await res.json();
        const items =
          data.items?.map((item) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url,
          })) || [];
        setVideos(items);
        setLoading(false);
      } catch (err) {
        console.error("Playlist error:", err);
        setLoading(false);
      }
    }
    fetchPlaylist();
  }, [playlistId, router]);

  // Fetch video details
  useEffect(() => {
    if (!videoId) return;
    setIsVideoEnded(false);

    async function fetchVideoDetails() {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!apiKey) return;

      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
        );
        if (!res.ok) throw new Error(`Video fetch failed: ${res.status}`);
        const data = await res.json();
        if (data.items?.[0]?.snippet) {
          const item = data.items[0].snippet;
          setVideoDetails({
            title: item.title,
            description: item.description || "No description available.",
          });
          // Store title so quiz/articulation pages can carry it forward as session label
          localStorage.setItem("ml_videoTitle", item.title);
        }
      } catch (err) {
        console.error("Video details error:", err);
      }
    }
    fetchVideoDetails();
  }, [videoId]);

  // YouTube player init
  useEffect(() => {
    if (!videoId || player) return;

    let intervalId = null;

    const initPlayer = () => {
      const playerElement = document.getElementById("youtube-player");
      if (!playerElement) return;

      const newPlayer = new window.YT.Player("youtube-player", {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          origin: typeof window !== "undefined" ? window.location.origin : "",
          disablekb: 1,
        },
        events: {
          onReady: () => console.log("YouTube Player ready"),
          onStateChange: (event) => {
            const state = event.data;
            if (state === window.YT.PlayerState.ENDED) {
              setIsVideoEnded(true);
              setIsVideoPaused(false);
              handleAutoNext();
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsVideoPaused(true);
            } else if (state === window.YT.PlayerState.PLAYING) {
              setIsVideoPaused(false);
              setIsVideoEnded(false);
            }
          },
        },
      });

      setPlayer(newPlayer);
      clearInterval(intervalId);
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    intervalId = setInterval(() => {
      if (window.YT && window.YT.Player) initPlayer();
    }, 100);

    return () => clearInterval(intervalId);
  }, [videoId, player]);

  // Keyboard controls: Space = play/pause, Left = -5s, Right = +5s
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent action when typing in input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (!player) return;

      // Space → Play/Pause
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault(); // prevent page scroll
        const state = player.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      }

      // Arrow Left → -5 seconds
      else if (e.code === "ArrowLeft") {
        e.preventDefault();
        const current = player.getCurrentTime();
        player.seekTo(Math.max(0, current - 5), true); // true = allow seek during buffering
      }

      // Arrow Right → +5 seconds
      else if (e.code === "ArrowRight") {
        e.preventDefault();
        const current = player.getCurrentTime();
        const duration = player.getDuration() || 999999;
        player.seekTo(Math.min(duration, current + 5), true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player]);

  const switchVideo = (newId) => {
    if (player && player.loadVideoById) {
      player.loadVideoById(newId);
      router.push(`/micro-learning/video/${newId}?list=${playlistId}`);
    }
  };

  const handleAutoNext = () => {
    const currentIndex = videos.findIndex((v) => v.id === videoId);
    if (currentIndex !== -1 && currentIndex < videos.length - 1) {
      // Optional auto-next – you can implement switchVideo(videos[currentIndex + 1].id) here
    }
  };

  if (!mounted) return null;

  if (loading && videos.length === 0) {
    return (
      <div
        style={{
          background: "transparent",
          color: theme.textPrimary,
          height: "100vh",
          padding: "40px",
        }}
      >
        Loading...
      </div>
    );
  }

  const isAssessmentEnabled = isVideoEnded && mcqStatus === "ready";

  return (
    <div
      className="ml-video-root"
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        maxWidth: "100%",
        backgroundColor: "transparent",
        color: theme.textPrimary,
        height: "115vh", // Slightly more than screen size
        overflowY: "auto", // Allow root scroll
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <BackButton target={`/micro-learning/playlist/${playlistId}`} />
      {/* Left: Video + Info */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          paddingTop: "32px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}
        className="ml-video-main"
      >
        {/* Top: Video + Controls (Fixed) */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              backgroundColor: "#000",
              borderRadius: "24px",
              overflow: "hidden",
              background: theme.sidebar,
              border: `1px solid ${theme.border}`,
              backdropFilter: "blur(12px)",
              boxShadow: isLight
                ? "0 25px 50px -12px rgba(144, 103, 198, 0.1)"
                : "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Smart overlay: blocks YouTube suggested video clicks when paused/ended */}
            {(isVideoPaused || isVideoEnded) && (
              <div
                onClick={() => {
                  if (player) {
                    if (isVideoEnded) {
                      player.seekTo(0, true);
                      player.playVideo();
                    } else {
                      player.playVideo();
                    }
                  }
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isLight
                    ? "rgba(255, 255, 255, 0.45)"
                    : "rgba(0, 0, 0, 0.45)",
                  backdropFilter: "blur(2px)",
                  transition: "opacity 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: theme.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 30px ${isLight ? "rgba(144, 103, 198, 0.3)" : "rgba(147, 76, 240, 0.5)"}`,
                    transition: "transform 0.2s ease",
                  }}
                >
                  {isVideoEnded ? (
                    <RotateCcw size={32} strokeWidth={2.5} color="#fff" />
                  ) : (
                    <Play size={36} fill="#fff" color="#fff" />
                  )}
                </div>
                <span
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    color: isLight
                      ? theme.textPrimary
                      : "rgba(255,255,255,0.7)",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    letterSpacing: "0.05em",
                  }}
                >
                  {isVideoEnded ? "Click to Replay" : "Click to Resume"}
                </span>
              </div>
            )}
            {/* Top bar overlay to block YouTube logo click */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "42px",
                zIndex: 9,
                background: "transparent",
              }}
            />
            <div
              id="youtube-player"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginTop: "32px",
              gap: "24px",
            }}
          >
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "800",
                  margin: 0,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  color: theme.textPrimary,
                }}
              >
                {videoDetails?.title || "Loading..."}
              </h1>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginTop: "16px",
                }}
              >
                {transcriptStatus === "generating" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: theme.accent,
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    <Loader2
                      size={16}
                      strokeWidth={2.5}
                      className="animate-spin"
                    />
                    <span>Transcript Processing</span>
                  </div>
                )}

                {transcriptStatus === "ready" && mcqStatus === "generating" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: theme.accent,
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    <Loader2
                      size={16}
                      strokeWidth={2.5}
                      className="animate-spin"
                    />
                    <span>Transcript Ready. Generating Questions...</span>
                  </div>
                )}

                {mcqStatus === "ready" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: theme.success,
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    <CheckCircle size={16} strokeWidth={2.5} />
                    <span>Questions Ready!</span>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={!isAssessmentEnabled}
              onClick={() =>
                router.push(`/micro-learning/quiz?videoId=${videoId}`)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 32px",
                borderRadius: "16px",
                whiteSpace: "nowrap",
                fontSize: "0.85rem",
                fontWeight: "800",
                letterSpacing: "0.1em",
                cursor: isAssessmentEnabled ? "pointer" : "not-allowed",
                transition: "all 0.3s ease",
                background: isAssessmentEnabled
                  ? `linear-gradient(135deg, ${theme.accent} 0%, #4338CA 100%)`
                  : isLight
                    ? "rgba(144, 103, 198, 0.08)"
                    : "rgba(255, 255, 255, 0.03)",
                color: isAssessmentEnabled ? "#fff" : theme.textMuted,
                border: isAssessmentEnabled
                  ? "none"
                  : `1px solid ${theme.border}`,
                boxShadow: isAssessmentEnabled
                  ? `0 0 20px ${isLight ? "rgba(144, 103, 198, 0.2)" : "rgba(147, 76, 240, 0.3)"}`
                  : "none",
              }}
            >
              {isAssessmentEnabled ? (
                <Check size={18} strokeWidth={2.5} />
              ) : (
                <Lock size={18} strokeWidth={2} style={{ opacity: 0.5 }} />
              )}
              <span>{isAssessmentEnabled ? "TAKE ASSESSMENT" : "LOCKED"}</span>
            </button>
          </div>
        </div>

        {/* Bottom Area: Description (Scrollable) */}
        <div
          style={{
            height: "auto",
            maxHeight: "800px",
            overflowY: "auto",
            minHeight: 0,
            marginTop: "32px",
            paddingRight: "12px",
            overscrollBehaviorY: "contain",
          }}
          className="custom-scrollbar-area"
        >
          <div
            style={{
              marginTop: "32px",
              padding: "24px",
              background: theme.sidebar,
              backdropFilter: "blur(12px)",
              border: `1px solid ${theme.border}`,
              borderRadius: "16px",
              transition: "all 0.4s ease",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                color: theme.textMuted,
                fontSize: "1rem",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {videoDetails?.description || "Loading description..."}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Sidebar */}
      <div
        className="ml-video-sidebar"
        style={{
          width: "400px",
          maxWidth: "100%",
          background: theme.sidebar,
          backdropFilter: "blur(12px)",
          borderLeft: `1px solid ${theme.border}`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2
            style={{
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: theme.accent,
              fontWeight: "900",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            {activeRightTab === "course"
              ? "COURSE CONTENT"
              : "DIGITAL SMART NOTES"}
          </h2>

          <button
            onClick={() =>
              setActiveRightTab(
                activeRightTab === "course" ? "notes" : "course",
              )
            }
            style={{
              background: isLight
                ? "rgba(144, 103, 198, 0.05)"
                : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${theme.border}`,
              color: theme.textMuted,
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: "700",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {activeRightTab === "course" ? (
              <>
                <FileText size={14} /> Notes
              </>
            ) : (
              <>
                <ChevronLeft size={14} /> Back to Course
              </>
            )}
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            padding: "16px",
            overscrollBehaviorY: "contain",
          }}
          className="custom-scrollbar-area"
        >
          {activeRightTab === "course" ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {videos.map((v, index) => (
                <div
                  key={`${v.id}-${index}`}
                  onClick={() => switchVideo(v.id)}
                  className="playlist-item-el"
                  style={{
                    display: "flex",
                    gap: "16px",
                    padding: "12px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    backgroundColor:
                      videoId === v.id
                        ? isLight
                          ? "rgba(144, 103, 198, 0.1)"
                          : "rgba(147, 76, 240, 0.1)"
                        : "transparent",
                    border: `1px solid ${videoId === v.id ? theme.accent + "33" : theme.border}`,
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      width: "120px",
                      aspectRatio: "16/9",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={v.thumbnail}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      lineHeight: "1.4",
                      color:
                        videoId === v.id ? theme.textPrimary : theme.textMuted,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      paddingTop: "4px",
                    }}
                  >
                    {v.title}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DigitalSmartNotesTab
              player={player}
              videoId={videoId}
              theme={theme}
              videoTitle={videoDetails?.title}
            />
          )}
        </div>
      </div>

      {/* Scoped CSS for layout, scrollbar, hover effects, animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        /* Layout responsiveness */
        .ml-video-root {
          flex-direction: column;
        }

        @media (min-width: 1024px) {
          .ml-video-root {
            flex-direction: row;
          }
          .ml-video-main {
            padding: 40px;
            height: 115vh;
          }
          .ml-video-sidebar {
            width: 400px;
            height: 115vh;
          }
        }

        @media (max-width: 1023px) {
          .ml-video-sidebar {
            width: 100%;
            border-left: none;
            border-top: 1px solid ${theme.border};
          }
        }

        .custom-scrollbar-area::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-area::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar-area::-webkit-scrollbar-thumb {
          background: ${isLight ? "rgba(144, 103, 198, 0.3)" : "rgba(147, 76, 240, 0.3)"};
          border-radius: 10px;
        }
        .custom-scrollbar-area::-webkit-scrollbar-thumb:hover {
          background: ${isLight ? "rgba(144, 103, 198, 0.6)" : "rgba(147, 76, 240, 0.6)"};
        }
        .custom-scrollbar-area {
          scrollbar-width: thin;
          scrollbar-color: ${isLight ? "rgba(144, 103, 198, 0.3)" : "rgba(147, 76, 240, 0.3)"} transparent;
        }
        .playlist-item-el:hover {
          background: ${isLight ? "rgba(144, 103, 198, 0.1)" : "rgba(147, 76, 240, 0.1)"} !important;
          border-color: ${theme.accent}33 !important;
        }
      `}</style>
    </div>
  );
}
