'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import BackButton from '@/app/components/micro-learning/BackButton';
import { 
  Brain, 
  Lock, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Target, 
  BarChart2, 
  AlertTriangle,
  XCircle,
  FastForward,
  Loader2
} from 'lucide-react';

function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get('videoId');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [mcqs, setMcqs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skipped, setSkipped] = useState(new Set());
  const [maxReached, setMaxReached] = useState(0);
  const [sessionId] = useState(() => `ml_q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = resolvedTheme === 'light';

  // Theme constants
  const t = {
    bg: 'transparent',
    accent: isLight ? '#9067C6' : '#934CF0',
    accentEnd: isLight ? '#4338CA' : '#4338CA',
    glass: isLight ? 'rgba(144, 103, 198, 0.05)' : 'rgba(147, 76, 240, 0.05)',
    border: isLight ? 'rgba(144, 103, 198, 0.15)' : 'rgba(255, 255, 255, 0.1)',
    success: '#10b981',
    error: '#f43f5e',
    warning: '#eab308',
    textPrimary: isLight ? '#242038' : '#ffffff',
    textMuted: isLight ? '#655A7C' : '#94a3b8',
  };

  useEffect(() => {
    async function initSession() {
      // 1. Check for URL session ID (Resume from dashboard)
      const urlSessionId = searchParams.get('sessionId');
      if (urlSessionId) {
        // We could explicitly set it, but we'll try to load the latest microLearning session
        // Assuming there's only one active microLearning session per user
      }

      // 2. Try to load existing active session
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch('/api/micro-learning/active-session', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data?.session) {
            const s = data.session;
            // Restore state
            if (s.questions && s.questions.length > 0) {
              setMcqs(s.questions);
              if (s.quizState) {
                setSelectedAnswers(s.quizState.selectedAnswers || {});
                setSkipped(new Set(s.quizState.skipped || []));
                setCurrentIndex(s.quizState.currentIndex || 0);
                setMaxReached(s.quizState.maxReached || 0);
              }
              // If we already finished the quiz part of this session, fast forward or show results
              if (s.questionsAnswered >= s.questions.length) {
                setSubmitted(true);
              }
              setLoading(false);
              return; // Successfully restored, don't fetch new
            }
          }
        }
      } catch (err) {
        console.error('Failed to load active session:', err);
      }

      // 3. If no active session, fetch a new quiz
      if (!videoId) {
        setError('No videoId found in URL or Active Session');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/micro-learning/mcq?videoId=${videoId}`);
        const data = await res.json();

        if (data.success && data.mcqs?.length > 0) {
          setMcqs(data.mcqs);
          // Initial save of the new session
          saveActiveSession(data.mcqs, {}, [], 0, 0);
        } else {
          setError(data.message || 'No quiz data available');
        }
      } catch (err) {
        console.error('Quiz fetch error:', err);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [videoId, searchParams]);

  // Helper to sync state to backend
  const saveActiveSession = async (
    currentMcqs = mcqs,
    answers = selectedAnswers,
    skipSet = skipped,
    idx = currentIndex,
    maxAcc = maxReached
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const answeredCount = Object.keys(answers).length + skipSet.size;
      // Carry over title/videoId from localStorage if stored by video page
      const videoTitle = localStorage.getItem('ml_videoTitle') || 'Micro-Learning Quiz';

      await fetch('/api/micro-learning/active-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          gameType: 'mcq',
          title: videoTitle,
          questions: currentMcqs,
          questionsAnswered: answeredCount,
          quizState: {
            stage: 'quiz',
            selectedAnswers: answers,
            skipped: Array.from(skipSet),
            currentIndex: idx,
            maxReached: maxAcc,
            videoId: videoId,
            videoTitle
          }
        })
      });
    } catch (err) {
      console.error('Failed to save active session:', err);
    }
  };

  const handleOptionSelect = (questionIndex, option) => {
    if (submitted) return;
    setSelectedAnswers(prev => {
      const nextAnswers = { ...prev, [questionIndex]: option };

      setSkipped(prevSkipped => {
        const nextSkipped = new Set(prevSkipped);
        nextSkipped.delete(questionIndex);

        // Save immediately with next state
        saveActiveSession(mcqs, nextAnswers, nextSkipped, currentIndex, maxReached);

        return nextSkipped;
      });

      return nextAnswers;
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      setCurrentIndex(nextIdx);
      saveActiveSession(mcqs, selectedAnswers, skipped, nextIdx, maxReached);
    }
  };

  const handleNext = () => {
    let nextSkipped = new Set(skipped);
    if (!selectedAnswers.hasOwnProperty(currentIndex)) {
      nextSkipped = new Set(skipped).add(currentIndex);
      setSkipped(nextSkipped);
    }
    if (currentIndex < mcqs.length - 1) {
      const nextIdx = currentIndex + 1;
      const nextMax = Math.max(maxReached, nextIdx);
      setCurrentIndex(nextIdx);
      setMaxReached(nextMax);
      saveActiveSession(mcqs, selectedAnswers, nextSkipped, nextIdx, nextMax);
    }
  };

  const handleSubmit = async () => {
    // Mark any unanswered as skipped
    const finalSkipped = new Set(skipped);
    mcqs.forEach((_, idx) => {
      if (!selectedAnswers.hasOwnProperty(idx)) {
        finalSkipped.add(idx);
      }
    });
    setSkipped(finalSkipped);
    setSubmitted(true);
    setIsSaving(true);

    // Calculate correct count for XP
    const correctCount = mcqs.filter(
      (q, i) => selectedAnswers[i] === q.answer
    ).length;

    // Save to localStorage for articulation-results page
    localStorage.setItem('mainMcqPoints', correctCount.toString());

    // ─── PERSIST TO BACKEND ───
    try {
      const startTime = Date.now();
      const promises = mcqs.map((q, i) => {
        const userAnswer = selectedAnswers[i] || 'Skipped';
        const isCorrect = userAnswer === q.answer;

        return fetch('/api/micro-learning/attempt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            moduleId: 'microLearning',
            gameType: 'mcq',
            sessionId,
            question: q.question,
            userAnswer,
            correctAnswer: q.answer,
            isCorrect,
            score: isCorrect ? 10 : 2, // 10 XP for correct, 2 for attempt
            difficulty: 'medium',
            timeTaken: Math.round((Date.now() - startTime) / 1000 / mcqs.length) // Rough estimate per Q
          })
        });
      });

      await Promise.all(promises);
      console.log('✅ Micro-learning results persisted to backend');

      // ─── CLEAR ACTIVE SESSION ON COMPLETION ───
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch('/api/micro-learning/active-session', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      } catch (err) {
        console.error('Failed to clear active session:', err);
      }
    } catch (err) {
      console.error('❌ Failed to persist results:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  // ─── Loading State ───
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        color: t.textPrimary,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 20px', color: t.accent }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Initializing Neural Assessment...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        color: t.textPrimary,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <p style={{ marginBottom: '20px', color: t.error, fontWeight: '700', fontSize: '1.2rem' }}>{error}</p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '14px 28px', borderRadius: '16px',
              background: `linear-gradient(135deg, ${t.accent}, ${t.accentEnd})`,
              color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer',
              boxShadow: isLight ? '0 10px 25px rgba(144, 103, 198, 0.2)' : '0 10px 25px rgba(67, 56, 202, 0.3)',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQ = mcqs[currentIndex];
  const answeredOrSkipped = Object.keys(selectedAnswers).length + skipped.size;
  const progress = mcqs.length > 0 ? (answeredOrSkipped / mcqs.length) * 100 : 0;

  // Results calculations
  const correctCount = mcqs.filter((q, i) => selectedAnswers[i] === q.answer).length;
  const attemptedCount = Object.keys(selectedAnswers).length;
  const accuracy = mcqs.length > 0 ? Math.round((correctCount / mcqs.length) * 100) : 0;
  const skippedCount = skipped.size;

  // ─── Results View ───
  if (submitted) {
    return (
      <div style={{
        backgroundColor: 'transparent',
        minHeight: '100vh',
        color: t.textPrimary,
        padding: '40px',
        position: 'relative',
        minHeight: '100vh',
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          {/* Results Header */}
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '32px',
            letterSpacing: '-0.02em',
          }} className="gradient-text">
            Neural Performance Stats
          </h2>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            marginBottom: '48px',
          }}>
            {[
              { label: 'Correct', value: `${correctCount}/${mcqs.length}`, color: t.success, icon: CheckCircle },
              { label: 'Attempted', value: `${attemptedCount}/${mcqs.length}`, color: t.accent, icon: Target },
              { label: 'Accuracy', value: `${accuracy}%`, color: isLight ? '#2563eb' : '#60a5fa', icon: BarChart2 },
              { label: 'Skipped', value: skippedCount, color: t.warning, icon: AlertTriangle },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="glass-card"
                style={{
                  background: isLight ? 'rgba(255, 255, 255, 0.6)' : t.glass,
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${t.border}`,
                  borderTop: `4px solid ${stat.color}`,
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center',
                  animation: `cardEntrance 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${i * 150}ms forwards`,
                  opacity: 0,
                }}
              >
                  <div style={{ color: stat.color, marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                    <stat.icon size={24} />
                  </div>
                  <p style={{
                    color: t.textMuted,
                    fontSize: '10px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    marginBottom: '8px',
                  }}>{stat.label}</p>
                <p style={{
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  color: t.textPrimary,
                  margin: 0,
                }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* XP Bar */}
          <div className="glass-card" style={{
            background: isLight ? 'rgba(255, 255, 255, 0.6)' : t.glass,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${t.border}`,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: t.textMuted }}>XP Earned</span>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '900',
              color: t.accent,
            }}>+{correctCount} XP</span>
          </div>

          {/* Detailed Review */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Detailed Review</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
            {mcqs.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const isCorrect = userAnswer === q.answer;
              const isSkippedQ = skipped.has(idx);
              let statusLabel, statusColor, statusBg, StatusIcon;
              if (isSkippedQ) {
                statusLabel = 'SKIPPED'; statusColor = t.warning; StatusIcon = AlertTriangle; statusBg = isLight ? 'rgba(234, 179, 8, 0.05)' : 'rgba(234, 179, 8, 0.1)';
              } else if (isCorrect) {
                 statusLabel = 'CORRECT'; statusColor = t.success; StatusIcon = CheckCircle; statusBg = isLight ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.1)';
              } else {
                statusLabel = 'INCORRECT'; statusColor = t.error; StatusIcon = XCircle; statusBg = isLight ? 'rgba(244, 63, 94, 0.05)' : 'rgba(244, 63, 94, 0.1)';
              }

              return (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    background: isLight ? 'rgba(255, 255, 255, 0.6)' : t.glass,
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${t.border}`,
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    animation: `cardEntrance 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${idx * 100}ms forwards`,
                    opacity: 0,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px', lineHeight: '1.4' }}>
                      Q{idx + 1}: {q.question}
                    </p>

                    {isSkippedQ ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <p style={{ color: t.warning, margin: '0 0 4px 0', fontWeight: '700' }}>⚠ SKIPPED</p>
                        <p style={{ color: t.success, margin: 0, fontWeight: '600' }}>
                          Correct Answer: <span style={{ color: t.textPrimary }}>{q.answer}</span>
                        </p>
                      </div>
                    ) : isCorrect ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <p style={{ color: t.success, margin: '0 0 4px 0', fontWeight: '700' }}>✓ CORRECT</p>
                        <p style={{ color: t.textMuted, margin: 0 }}>{q.explanation}</p>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem' }}>
                        <p style={{ color: t.error, margin: '0 0 4px 0', fontWeight: '700' }}>✗ INCORRECT</p>
                        <p style={{ color: t.error, margin: '0 0 4px 0' }}>
                          Your Answer: <span style={{ color: isLight ? '#ef4444' : '#fca5a5' }}>{userAnswer}</span>
                        </p>
                        <p style={{ color: t.success, margin: '0 0 4px 0', fontWeight: '600' }}>
                          Correct Answer: <span style={{ color: t.textPrimary }}>{q.answer}</span>
                        </p>
                        {q.explanation && <p style={{ color: t.textMuted, margin: 0, marginTop: '8px' }}>{q.explanation}</p>}
                      </div>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: '900',
                    background: statusBg,
                    color: statusColor,
                    border: `1px solid ${statusColor}44`,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    <StatusIcon size={14} style={{ marginRight: '6px' }} />
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Proceed Button */}
          <button
            onClick={() => {
              const transcript = localStorage.getItem(`transcript_${videoId}`) || '';
              localStorage.setItem('quizTranscript', transcript);
              localStorage.setItem('ml_sessionId', sessionId);
              router.push('/micro-learning/articulation-round');
            }}
            style={{
              width: '100%',
              padding: '20px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${t.accent}, ${t.accentEnd})`,
              color: '#fff',
              border: 'none',
              fontWeight: '900',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: isLight ? '0 10px 40px rgba(144, 103, 198, 0.3)' : '0 10px 40px rgba(67, 56, 202, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              letterSpacing: '0.05em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = isLight ? '0 15px 50px rgba(144, 103, 198, 0.5)' : '0 15px 50px rgba(67, 56, 202, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isLight ? '0 10px 40px rgba(144, 103, 198, 0.3)' : '0 10px 40px rgba(67, 56, 202, 0.3)';
            }}
          >
            Proceed to Neural Articulation Round <ArrowRight size={20} style={{ marginLeft: '10px' }} />
          </button>
        </div>

        <style>{`
          @keyframes cardEntrance {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  // ─── Quiz View ───
  return (
    <div
      className="ml-quiz-root"
      style={{
        display: 'flex',
        flexDirection: 'row',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        backgroundColor: t.bg,
        color: t.textPrimary,
        position: 'relative',
      }}
    >
      <BackButton target={`/micro-learning/video/${videoId}`} />
      {/* ── Sidebar ── */}
      <aside
        className="ml-quiz-sidebar quiz-sidebar-scroll"
        style={{
          width: '280px',
          margin: '16px',
          marginRight: 0,
          background: isLight ? 'rgba(255, 255, 255, 0.4)' : t.glass,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${t.border}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Sidebar Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <Brain size={20} color="#fff" strokeWidth={2.5} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', letterSpacing: '-0.01em', margin: 0 }}>
            Progress Board
          </h2>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
            <p style={{
              fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em',
              color: isLight ? '#9067C6' : '#a5b4fc', textTransform: 'uppercase', margin: 0,
            }}>Assessment Neural Path</p>
            <span style={{ fontSize: '12px', fontWeight: '700', color: t.accent }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{
            width: '100%', height: '6px',
            background: isLight ? 'rgba(144, 103, 198, 0.1)' : 'rgba(0,0,0,0.3)', borderRadius: '999px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              background: t.accent,
              boxShadow: `0 0 10px ${t.accent}`,
              width: `${progress}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Segment Nav */}
        <nav
          className="custom-scrollbar-area"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingRight: '8px',
          }}
        >
          {mcqs.map((_, idx) => {
            const isActive = idx === currentIndex;
            const isAnswered = selectedAnswers.hasOwnProperty(idx);
            const isSkippedItem = skipped.has(idx);
            const isAccessible = idx <= maxReached;

            return (
              <div
                key={idx}
                onClick={() => { if (isAccessible) setCurrentIndex(idx); }}
                className={isAccessible ? 'segment-item' : ''}
                style={{
                  background: isActive
                    ? (isLight ? 'rgba(144, 103, 198, 0.1)' : 'rgba(147, 76, 240, 0.1)')
                    : isLight ? 'rgba(255, 255, 255, 0.4)' : t.glass,
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isActive ? t.accent : t.border}`,
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: isAccessible ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  opacity: !isAccessible ? 0.4 : (!isActive && !isAnswered ? 0.7 : 1),
                }}
              >
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isActive || isAnswered ? t.textPrimary : t.textMuted,
                }}>
                  Segment {String(idx + 1).padStart(2, '0')}
                </span>
                {isAnswered ? (
                  <Check size={14} color={t.success} strokeWidth={3} />
                ) : isSkippedItem ? (
                  <FastForward size={14} color={t.warning} strokeWidth={2.5} />
                ) : isActive ? (
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: t.accent, animation: 'pulse 2s infinite',
                  }} />
                ) : (
                  <Lock size={14} color={t.textMuted} strokeWidth={2} />
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main
        style={{
          flex: 1,
          padding: '24px',
          paddingTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}
        className="quiz-main-scroll custom-scrollbar-area"
      >
        <div style={{ width: '100%', maxWidth: '900px', paddingTop: '40px', paddingBottom: '80px' }}>
          {/* Question Header */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                padding: '4px 12px',
                background: isLight ? 'rgba(144, 103, 198, 0.1)' : t.glass,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isLight ? 'rgba(144, 103, 198, 0.3)' : 'rgba(147, 76, 240, 0.3)'}`,
                borderRadius: '16px',
                fontSize: '10px',
                fontWeight: '700',
                color: t.accent,
              }}>CORE LOGIC</span>
              <span style={{
                fontSize: '10px',
                color: t.textMuted,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}>
                Question {String(currentIndex + 1).padStart(2, '0')} of {String(mcqs.length).padStart(2, '0')}
              </span>
            </div>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              lineHeight: '1.3',
              letterSpacing: '-0.02em',
              margin: 0,
              color: t.textPrimary,
            }}>
              {currentQ?.question}
            </h1>
          </div>

          {/* Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '16px',
            marginBottom: '64px',
          }}>
            {currentQ?.options?.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === option;
              const labels = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={optIdx}
                  onClick={() => handleOptionSelect(currentIndex, option)}
                  className="option-btn glass-card"
                  style={{
                    background: isSelected
                      ? (isLight ? 'rgba(144, 103, 198, 0.1)' : 'rgba(147, 76, 240, 0.15)')
                      : isLight ? 'rgba(255, 255, 255, 0.6)' : t.glass,
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${isSelected ? t.accent : t.border}`,
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: t.textPrimary,
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected
                      ? `0 0 30px ${isLight ? 'rgba(144, 103, 198, 0.2)' : 'rgba(147, 76, 240, 0.4)'}`
                      : 'none',
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: isSelected ? t.accent : (isLight ? 'rgba(144, 103, 198, 0.1)' : t.glass),
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${t.border}`,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    color: isSelected ? '#fff' : t.textPrimary,
                  }}>
                    {labels[optIdx]}
                  </div>
                  <span style={{
                    fontSize: '1.05rem',
                    fontWeight: '500',
                    color: isSelected ? t.textPrimary : t.textMuted,
                    lineHeight: '1.5',
                  }}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}>
            {currentIndex > 0 ? (
              <button
                onClick={handlePrevious}
                style={{
                  padding: '16px 32px',
                  background: isLight ? 'rgba(144, 103, 198, 0.1)' : t.glass,
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isLight ? 'rgba(144, 103, 198, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                  borderRadius: '16px',
                  color: t.textPrimary,
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem',
                }}
              >
                <ArrowLeft size={18} /> Previous
              </button>
            ) : <div />}

            {currentIndex === mcqs.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                style={{
                  padding: '16px 40px',
                  background: `linear-gradient(135deg, ${t.accent}, ${t.accentEnd})`,
                  borderRadius: '16px',
                  color: '#fff',
                  fontWeight: '900',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: isLight ? '0 10px 25px rgba(144, 103, 198, 0.3)' : '0 10px 25px rgba(67, 56, 202, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                Submit Assessment
              </button>
            ) : (
              <button
                onClick={handleNext}
                style={{
                  padding: '16px 40px',
                  background: `linear-gradient(135deg, ${t.accent}, ${t.accentEnd})`,
                  borderRadius: '16px',
                  color: '#fff',
                  fontWeight: '900',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: isLight ? '0 10px 25px rgba(144, 103, 198, 0.3)' : '0 10px 25px rgba(67, 56, 202, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Next Segment <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Scoped CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Layout responsiveness */
        .ml-quiz-root {
          flex-direction: column;
        }

        @media (min-width: 1024px) {
          .ml-quiz-root {
            flex-direction: row;
          }
          .ml-quiz-sidebar {
            width: 280px;
            height: calc(100vh - 32px);
            margin: 16px;
            margin-right: 0;
            border-right: none;
            border-radius: 16px 0 0 16px;
          }
          .quiz-main-scroll {
            padding: 32px;
          }
        }

        @media (max-width: 1023px) {
          .ml-quiz-sidebar {
            width: 100%;
            height: auto;
            margin: 16px;
            margin-bottom: 0;
            border-right: 1px solid ${t.border};
            border-bottom: none;
            border-radius: 16px;
          }
        }

        .custom-scrollbar-area::-webkit-scrollbar {
          width: 4px;
        }
        .ml-quiz-sidebar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-area::-webkit-scrollbar-thumb {
          background: ${isLight ? 'rgba(144, 103, 198, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
          border-radius: 10px;
        }
        .option-btn:hover {
          box-shadow: 0 0 20px ${isLight ? 'rgba(144, 103, 198, 0.2)' : 'rgba(147, 76, 240, 0.2)'};
          border-color: ${t.accent} !important;
        }
        .option-btn:hover div:first-child {
          background: ${t.accent} !important;
          color: #fff !important;
        }
        .segment-item:hover {
          background: ${isLight ? 'rgba(144, 103, 198, 0.08)' : 'rgba(147, 76, 240, 0.08)'} !important;
        }
      `}</style>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        color: '#fff',
      }}>
        <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Loading Assessment...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}