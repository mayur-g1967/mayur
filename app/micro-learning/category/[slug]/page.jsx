"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORY_MAP, ACADEMIC_PLAYLIST_MAP } from "@/lib/data";
import { Space_Grotesk } from "next/font/google";
import { useTheme } from "next-themes";
import BackButton from "@/app/components/micro-learning/BackButton";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default function CategoryPlaylistsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ ...styles.main, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading...
        </div>
      }
    >
      <CategoryPlaylists />
    </Suspense>
  );
}

function CategoryPlaylists() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const mode = searchParams.get("mode") || "personality";
  const isAcademic = mode === "academic";

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setLoading(true);
    const ids = isAcademic ? ACADEMIC_PLAYLIST_MAP[slug] : CATEGORY_MAP[slug];

    if (!ids) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    fetch(`/api/micro-learning/playlists?ids=${ids}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setPlaylists(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setPlaylists([]);
        setLoading(false);
      });
  }, [slug, isAcademic]);

  if (!mounted) return null;

  const isLight = resolvedTheme === "light";

  const t = {
    primary: isLight ? "#9067C6" : "#934CF0",
    textPrimary: isLight ? "#242038" : "#ffffff",
    textMuted: isLight ? "#655A7C" : "#94A3B8",
    cardBorder: isLight ? "rgba(144, 103, 198, 0.15)" : "rgba(255, 255, 255, 0.1)",
    glow: isLight ? "rgba(144, 103, 198, 0.4)" : "rgba(147, 76, 240, 0.6)",
  };

  const displayTitle = isAcademic
    ? `${slug.replace(/-/g, " ")} Playlists & Courses`
    : `${slug.charAt(0).toUpperCase() + slug.slice(1)} Specialists`;

  return (
    <main className={spaceGrotesk.className} style={{ ...styles.main, color: t.textPrimary }}>
      <BackButton target={`/micro-learning?mode=${mode}`} />
      <h1 style={{ ...styles.title, color: t.textPrimary, textShadow: `0 0 25px ${t.glow}` }}>{displayTitle}</h1>

      {loading ? (
        <div style={{ ...styles.loading, color: t.textMuted }}>Loading playlists...</div>
      ) : playlists.length === 0 ? (
        <div style={{ ...styles.empty, color: t.textMuted }}>
          No playlists found for this {isAcademic ? "subject" : "category"}.
        </div>
      ) : (
        <div style={styles.grid} className="ml-category-playlist-grid">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href={`/micro-learning/playlist/${pl.id}${isAcademic ? "?mode=academic" : ""}`}
              style={styles.linkReset}
            >
              <div className="glass-card group" style={styles.card}>
                <div style={styles.thumbnailWrapper}>
                  <img
                    src={
                      pl.snippet.thumbnails?.high?.url ||
                      pl.snippet.thumbnails?.medium?.url
                    }
                    alt={pl.snippet.title}
                    style={styles.thumbnail}
                  />
                  {/* Gradient overlay on thumbnail */}
                  <div style={{
                    ...styles.thumbnailOverlay,
                    background: isLight 
                      ? "linear-gradient(to top, rgba(255,255,255,0.8), transparent, transparent)"
                      : "linear-gradient(to top, #181022, transparent, transparent)"
                  }} />
                  {/* Video count badge */}
                  {pl.contentDetails?.itemCount != null && (
                    <div style={{
                      ...styles.videoBadge,
                      backgroundColor: isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.6)",
                      color: isLight ? "#242038" : "#fff",
                      borderColor: t.cardBorder,
                    }}>
                      {String(pl.contentDetails.itemCount).padStart(2, "0")} Videos
                    </div>
                  )}
                </div>
                <div style={styles.cardContent}>
                  <h3 style={{ ...styles.cardTitle, color: t.textPrimary }}>{pl.snippet.title}</h3>
                  <p style={{ ...styles.channelName, color: t.primary }}>{pl.snippet.channelTitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .ml-category-playlist-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .ml-category-playlist-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    backgroundColor: "transparent",
    padding:
      "clamp(80px, 10vh, 140px) clamp(16px, 5vw, 80px) clamp(40px, 8vh, 80px)",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },

  title: {
    fontSize: "clamp(2rem, 6vw, 3.5rem)",
    fontWeight: 800,
    textAlign: "center",
    marginBottom: "clamp(32px, 6vh, 60px)",
    lineHeight: 1.2,
    textTransform: "capitalize",
    position: "relative",
    zIndex: 10,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridAutoRows: "1fr",
    gap: "clamp(16px, 2vw, 28px)",
    width: "100%",
    maxWidth: "1600px",
    margin: "0 auto",
    justifyContent: "center",
    position: "relative",
    zIndex: 10,
  },

  linkReset: {
    textDecoration: "none",
    color: "inherit",
    display: "block",
    height: "100%",
  },

  card: {
    borderRadius: "24px",
    overflow: "hidden",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "420px",
  },

  thumbnailWrapper: {
    width: "100%",
    aspectRatio: "16 / 9",
    overflow: "hidden",
    position: "relative",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
  },

  thumbnailOverlay: {
    position: "absolute",
    inset: 0,
    opacity: 0.6,
    pointerEvents: "none",
  },

  videoBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backdropFilter: "blur(12px)",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    border: "1px solid rgba(255,255,255,0.1)",
  },

  cardContent: {
    padding: "clamp(14px, 2vw, 20px)",
    paddingTop: "clamp(20px, 3vw, 32px)",
    flex: 1,
  },

  cardTitle: {
    fontSize: "clamp(1.05rem, 2.5vw, 1.25rem)",
    fontWeight: 600,
    lineHeight: 1.35,
    margin: "0 0 8px 0",
    transition: "color 0.3s ease",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  channelName: {
    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
    margin: 0,
    opacity: 0.9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },

  loading: {
    textAlign: "center",
    fontSize: "1.3rem",
    padding: "80px 20px",
    position: "relative",
    zIndex: 10,
  },

  empty: {
    textAlign: "center",
    fontSize: "1.2rem",
    padding: "80px 20px",
    position: "relative",
    zIndex: 10,
  },
};
