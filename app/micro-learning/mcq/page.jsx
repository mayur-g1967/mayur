'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { 
  Target, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Loader2
} from 'lucide-react'

export default function MCQRound() {
  const [videoText, setVideoText] = useState('')
  const [mcqs, setMcqs] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [userAnswers, setUserAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLight = resolvedTheme === 'light'

  const theme = {
    bg: 'transparent',
    card: isLight ? 'rgba(255, 255, 255, 0.6)' : '#111111',
    accent: isLight ? '#9067C6' : '#a855f7',
    text: isLight ? '#242038' : '#ffffff',
    textMuted: isLight ? '#655A7C' : '#9ca3af',
    border: isLight ? 'rgba(144, 103, 198, 0.15)' : '#262626',
    success: '#22c55e',
    error: '#ef4444'
  }

  const totalQuestions = mcqs.length;
  const progressPercent = totalQuestions > 0 ? (Object.keys(userAnswers).length / totalQuestions) * 100 : 0;

  const generateMCQ = async () => {
    if (!videoText.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/micro-learning/generateDiagnosticMCQ', {
        method: 'POST',
        body: JSON.stringify({ videoSegmentText: videoText })
      });
      const data = await response.json();
      if (data.success) setMcqs(data.mcqs);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleFinalSubmit = async () => {
    // 1. Calculate Results
    const attemptedCount = Object.keys(userAnswers).length;
    let correctCount = 0;
    mcqs.forEach((mcq, index) => {
      if (userAnswers[index] === mcq.answer) correctCount++;
    });

    // 2. OUTPUT TO CONSOLE TAB ONLY
    console.clear();
    console.log("%c 📊 QUIZ PERFORMANCE REPORT ", `background: ${theme.accent}; color: white; font-weight: bold; padding: 4px; border-radius: 4px;`);
    console.log(`Total Questions: ${totalQuestions}`);
    console.log(`Questions Attempted: ${attemptedCount}`);
    console.log(`Correct Answers: ${correctCount}`);
    console.log(`Accuracy: ${Math.round((correctCount / totalQuestions) * 100)}%`);
    console.log("%c----------------------------", "color: #444;");

    // 3. Update UI State
    setSubmitted(true);
    setIsSaving(true);

    // 4. PERSIST TO BACKEND
    try {
      const startTime = Date.now();
      const promises = mcqs.map((q, i) => {
        const userAnswerKey = userAnswers[i];
        const userAnswer = userAnswerKey ? q.options[userAnswerKey] : 'Skipped';
        const isCorrect = userAnswerKey === q.answer; // In this component, answer is the key (A, B, C, D)

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
            correctAnswer: q.options[q.answer], // Map key to text
            isCorrect,
            score: isCorrect ? 10 : 2,
            difficulty: 'medium',
            timeTaken: Math.round((Date.now() - startTime) / 1000 / mcqs.length)
          })
        });
      });

      await Promise.all(promises);
      console.log('✅ Micro-learning MCQ results persisted to backend');
    } catch (err) {
      console.error('❌ Failed to persist results:', err);
    } finally {
      setIsSaving(false);
    }
  }

  if (!mounted) return null

  return (
    <div
      className="ml-mcq-root"
      style={{
        display: 'flex',
        flexDirection: 'row',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        backgroundColor: 'transparent',
        color: theme.text,
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
      }}
    >

      {/* SIDEBAR NAVIGATION */}
      <aside
        className="ml-mcq-sidebar"
        style={{
          width: '25%',
          borderRight: `1px solid ${theme.border}`,
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: isLight ? 'rgba(144, 103, 198, 0.04)' : 'transparent',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <BookOpen size={20} color={theme.accent} />
          <h2 style={{ color: theme.accent, fontSize: '1.2rem', fontWeight: '800', margin: 0, letterSpacing: '2px' }}>LEARNING HUB</h2>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <p style={{ color: theme.textMuted, fontSize: '0.7rem', marginBottom: '8px' }}>SESSION PROGRESS</p>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{Math.round(progressPercent)}%</div>
          <div style={{ width: '100%', height: '4px', backgroundColor: isLight ? 'rgba(144, 103, 198, 0.1)' : '#222', marginTop: '10px', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: theme.accent, transition: '0.4s ease' }} />
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar-area">
          {mcqs.map((_, i) => (
            <div key={i} onClick={() => !submitted && setCurrentQuestionIndex(i)} style={{
              padding: '12px 15px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '8px', cursor: submitted ? 'default' : 'pointer',
              backgroundColor: currentQuestionIndex === i ? (isLight ? 'rgba(144, 103, 198, 0.1)' : 'rgba(168, 85, 247, 0.1)') : 'transparent',
              color: currentQuestionIndex === i ? theme.accent : (userAnswers[i] ? theme.text : theme.textMuted),
              border: `1px solid ${currentQuestionIndex === i ? theme.accent : 'transparent'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={14} /> Question {i + 1}
              </div>
              {userAnswers[i] && <CheckCircle2 size={12} color={theme.success} />}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        className="ml-mcq-main custom-scrollbar-area"
        style={{
          flex: 1,
          padding: '32px',
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '850px' }}>

          {/* STEP 1: INPUT */}
          {!mcqs.length && !loading && (
            <div style={{ animation: 'fadeIn 0.6s ease' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '15px' }} className="gradient-text">
                <Target size={40} style={{ display: 'inline', marginRight: '15px', verticalAlign: 'bottom' }} />
                Knowledge Assessment
              </h1>
              <p style={{ color: theme.textMuted, marginBottom: '35px' }}>Generate a personalized quiz from your transcript.</p>
              <textarea
                value={videoText}
                onChange={(e) => setVideoText(e.target.value)}
                placeholder="Paste content here..."
                style={{
                  width: '100%', height: '280px', backgroundColor: theme.card, color: theme.text,
                  border: `1px solid ${theme.border}`, borderRadius: '15px', padding: '25px',
                  fontSize: '1rem', outline: 'none', marginBottom: '25px', resize: 'none'
                }}
              />
              <button onClick={generateMCQ} style={{ width: '100%', padding: '18px', borderRadius: '12px', backgroundColor: theme.accent, color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: isLight ? '0 10px 20px rgba(144, 103, 198, 0.2)' : 'none' }}>
                Initialize Assessment
              </button>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div style={{ textAlign: 'center', marginTop: '20vh' }}>
              <Loader2 size={40} className="animate-spin" style={{ color: theme.accent, margin: '0 auto' }} />
            </div>
          )}

          {/* STEP 2: ACTIVE QUIZ */}
          {mcqs.length > 0 && !submitted && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '40px', lineHeight: '1.4' }}>
                {mcqs[currentQuestionIndex].question}
              </h2>

              <div style={{ display: 'grid', gap: '12px' }}>
                {Object.entries(mcqs[currentQuestionIndex].options).map(([key, value]) => {
                  const isSelected = userAnswers[currentQuestionIndex] === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setUserAnswers({ ...userAnswers, [currentQuestionIndex]: key })}
                      style={{
                        textAlign: 'left', padding: '22px 28px', borderRadius: '12px',
                        backgroundColor: isSelected ? (isLight ? 'rgba(144, 103, 198, 0.1)' : 'rgba(168, 85, 247, 0.1)') : theme.card,
                        border: `1px solid ${isSelected ? theme.accent : theme.border}`,
                        color: isSelected ? theme.accent : theme.text,
                        cursor: 'pointer', transition: '0.2s', fontSize: '1rem'
                      }}
                    >
                      <span style={{ marginRight: '15px', opacity: 0.4, fontWeight: 'bold' }}>{key}</span> {value}
                    </button>
                  )
                })}
              </div>

              <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setCurrentQuestionIndex(p => p - 1)}
                  disabled={currentQuestionIndex === 0}
                  style={{ padding: '15px 30px', borderRadius: '10px', background: 'transparent', border: `1px solid ${theme.border}`, color: theme.text, opacity: currentQuestionIndex === 0 ? 0 : 1, cursor: 'pointer' }}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                {currentQuestionIndex === mcqs.length - 1 ? (
                  <button onClick={handleFinalSubmit} disabled={!userAnswers[currentQuestionIndex]} style={{ padding: '15px 45px', borderRadius: '10px', background: theme.accent, color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: isLight ? '0 10px 20px rgba(144, 103, 198, 0.2)' : 'none' }}>
                    Complete Round 1
                  </button>
                ) : (
                  <button onClick={() => setCurrentQuestionIndex(p => p + 1)} disabled={!userAnswers[currentQuestionIndex]} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '15px 45px', borderRadius: '10px', background: theme.accent, color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', opacity: !userAnswers[currentQuestionIndex] ? 0.5 : 1, boxShadow: isLight ? '0 10px 20px rgba(144, 103, 198, 0.2)' : 'none' }}>
                    Next Question <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: RESULTS (CONSOLE LOGS FIRED) */}
          {submitted && (
            <div style={{ animation: 'fadeIn 0.6s ease' }}>
              <div style={{ backgroundColor: theme.card, padding: '50px', borderRadius: '24px', border: `1px solid ${theme.border}`, textAlign: 'center', marginBottom: '40px', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <Target size={64} color={theme.accent} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '15px' }}>
                  Stage 1 Verified {isSaving && <span style={{ fontSize: '0.9rem', color: theme.accent, display: 'block', marginTop: '8px', fontWeight: '400' }}>(Syncing to Neural Cloud...)</span>}
                </h2>
                <p style={{ color: theme.textMuted, maxWidth: '500px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
                  You have completed the initial recall assessment. Your detailed score has been logged to the system console.
                </p>
                <button style={{ padding: '18px 50px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: `0 10px 20px ${isLight ? 'rgba(144, 103, 198, 0.3)' : 'rgba(168, 85, 247, 0.3)'}` }}>
                  Continue to Stage 2: Deep Understanding
                </button>
              </div>

              <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: theme.textMuted, letterSpacing: '1px' }}>ACCURACY REVIEW</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mcqs.map((m, i) => (
                  <div key={i} style={{ padding: '20px', borderRadius: '12px', backgroundColor: theme.card, border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)' }}>
                    <p style={{ marginBottom: '10px', fontWeight: '500' }}>{m.question}</p>
                    <p style={{ fontSize: '0.9rem', color: userAnswers[i] === m.answer ? theme.success : theme.error, fontWeight: 'bold' }}>
                      {userAnswers[i] === m.answer ? `✓ Correct Answer: ${m.answer}` : `✗ Your Answer: ${userAnswers[i]} | Correct: ${m.answer}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

        /* Layout responsiveness */
        .ml-mcq-root {
          flex-direction: column;
        }

        @media (min-width: 1024px) {
          .ml-mcq-root {
            flex-direction: row;
          }
          .ml-mcq-sidebar {
            width: 25%;
          }
          .ml-mcq-main {
            padding: 60px;
          }
        }

        @media (max-width: 1023px) {
          .ml-mcq-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid ${theme.border};
          }
        }

        .custom-scrollbar-area::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-area::-webkit-scrollbar-thumb {
          background: ${isLight ? 'rgba(144, 103, 198, 0.2)' : 'rgba(168, 85, 247, 0.2)'};
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
