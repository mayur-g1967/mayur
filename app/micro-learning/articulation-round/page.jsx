'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import BackButton from '@/app/components/micro-learning/BackButton';
import { 
  AlertTriangle, 
  X, 
  Mic, 
  Square, 
  Sparkles, 
  Loader2 
} from 'lucide-react';

export default function ArticulationRound() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [text, setText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = resolvedTheme === 'light';

  // Get transcript from localStorage (set by quiz page)
  const transcript = typeof window !== 'undefined'
    ? localStorage.getItem('quizTranscript') || ''
    : '';

  // Mark the active session as being in the "articulation" stage
  useEffect(() => {
    const markArticulationStage = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !sessionId) return;
        await fetch('/api/micro-learning/active-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            sessionId,
            gameType: 'voice',
            title: videoTitle,
            quizState: {
              stage: 'articulation',
              videoTitle
            }
          })
        });
      } catch { /* silent */ }
    };
    markArticulationStage();
  }, []);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setText((prev) => prev + ' ' + event.results[i][0].transcript);
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        setInterimText(currentInterim);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/m4a' });
        await sendToWhisper(audioBlob);
      };

      mediaRecorderRef.current.start();

      if (recognitionRef.current) {
        setInterimText('');
        recognitionRef.current.start();
      }

      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied. Please enable permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) recognitionRef.current.stop();

      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setInterimText('');
    }
  };

  const sendToWhisper = async (blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.m4a');

      const res = await fetch('/api/micro-learning/whisper', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.text) {
        setText(data.text);
      }
    } catch (err) {
      setError("Transcription service unreachable. Using local draft.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (text.length < 20) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/micro-learning/analyze-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          userExplanation: text
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Store analysis + user text for the results page (REQUIRED for /articulation-results page to show data)
        localStorage.setItem('articulationResult', JSON.stringify({
          analysis: data.analysis,
          userText: text
        }));

        // Retrieve or generate sessionId
        const sessionId = localStorage.getItem('ml_sessionId') || `ml_art_${Date.now()}`;
        const token = localStorage.getItem('token');
        setIsSaving(true);

        // ─── PERSIST TO BACKEND ───
        try {
          await fetch('/api/micro-learning/attempt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              moduleId: 'microLearning',
              gameType: 'voice',
              sessionId,
              question: 'Neural Articulation Round',
              userAnswer: text,
              correctAnswer: 'Synthesized explanation based on transcript',
              isCorrect: data.analysis.accuracy >= 60,
              score: Math.round(data.analysis.accuracy),
              difficulty: 'hard',
              timeTaken: 60 // Fixed estimate for articulation
            })
          });
          console.log('✅ Articulation results persisted to backend');
        } catch (persistErr) {
          console.error('❌ Persistence error:', persistErr);
        } finally {
          setIsSaving(false);
        }

        // ─── CLEAR ACTIVE SESSION ON COMPLETION ───
        try {
          if (token) {
            await fetch('/api/micro-learning/active-session', {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
        } catch (err) {
          console.error('Failed to clear active session:', err);
        }

        // Redirect to results page
        router.push('/micro-learning/articulation-results');
      } else {
        throw new Error(data.error || "Cognitive Audit failed.");
      }
    } catch (err) {
      console.error("Final Analysis Error:", err);
      setError(err.message.includes('Connection')
        ? "Network Unstable: The Neural Audit server is unreachable. Please try again."
        : "Neural Audit Timeout: Check your connection and retry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!mounted) return null;

  const displayText = text + (interimText ? (text ? ' ' : '') + interimText : '');
  const charCount = displayText.length;
  const isSubmitEnabled = charCount >= 20 && !isAnalyzing && !isRecording;

  // Status text & LED state
  let statusText = 'READY FOR INPUT';
  let ledColor = isLight ? '#059669' : '#10b981';
  let ledClass = 'pulse-green';
  if (isRecording) {
    statusText = 'LIVE RECORDING...';
    ledColor = '#f43f5e';
    ledClass = 'pulse-red';
  } else if (isTranscribing) {
    statusText = 'FINALIZING TEXT...';
    ledColor = isLight ? '#7C3AED' : '#934CF0';
    ledClass = '';
  }

  return (
    <div
      className="ml-articulation-root"
      style={{
        backgroundColor: 'transparent',
        color: isLight ? '#242038' : '#fff',
        width: '100%',
        maxWidth: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: '16px',
      }}
    >
      <BackButton target="back" />
      {/* Main content */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 16px 32px 16px',
          flex: 1,
          minHeight: 0,
          animation: 'fadeSlideIn 1s ease-out forwards',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            marginBottom: '10px',
            lineHeight: 1.1,
          }}>
            Neural <span style={{ color: isLight ? '#9067C6' : '#934CF0' }}>Articulation</span>
          </h1>
          <p style={{
            color: isLight ? '#64748b' : '#94A3B8',
            fontSize: '1.15rem',
            fontWeight: '500',
          }}>
            Explain the concept in your own words.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            width: '100%',
            marginBottom: '24px',
            background: isLight ? 'rgba(244, 63, 94, 0.05)' : 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#f43f5e',
            animation: 'shakeIn 0.4s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={18} />
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f43f5e',
                cursor: 'pointer',
                fontSize: '1.2rem',
                opacity: 0.7,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Main Card */}
        <div 
          className="glass-card"
          style={{
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(147, 76, 240, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${isLight ? 'rgba(144, 103, 198, 0.15)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '40px',
            padding: 'clamp(20px, 3vw, 40px)',
            boxShadow: isLight ? '0 25px 50px -12px rgba(144, 103, 198, 0.1)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            minHeight: 0,
          }}
        >
          {/* Status Bar + Mic Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
          }}>
            {/* Status Pill */}
            <div style={{
              background: isLight ? 'rgba(144, 103, 198, 0.05)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${isLight ? 'rgba(144, 103, 198, 0.1)' : 'rgba(255, 255, 255, 0.05)'}`,
              backdropFilter: 'blur(10px)',
              borderRadius: '999px',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div
                className={ledClass}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: ledColor,
                  transition: 'background-color 0.3s',
                }}
              />
              <span style={{
                color: isLight ? '#64748b' : '#94A3B8',
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}>
                {statusText}
              </span>
            </div>

            {/* Mic Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                background: isRecording
                  ? '#f43f5e'
                  : `linear-gradient(135deg, ${isLight ? '#9067C6' : '#934CF0'}, ${isLight ? '#4338CA' : '#4338CA'})`,
                color: '#fff',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isLight ? '0 4px 12px rgba(144, 103, 198, 0.2)' : 'none',
              }}
            >
              <span>{isRecording ? <Square size={18} fill="#fff" /> : <Mic size={18} />}</span>
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>
          </div>

          {/* Textarea */}
          <div style={{ position: 'relative', marginBottom: '24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <textarea
              value={displayText}
              onChange={(e) => setText(e.target.value)}
              disabled={isAnalyzing}
              placeholder="Your explanation will appear here as you speak..."
              className="articulation-textarea"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '150px',
                background: isLight ? 'rgba(255, 255, 255, 0.8)' : '#050505',
                border: `1px solid ${isRecording ? 'rgba(244, 63, 94, 0.5)' : error ? 'rgba(244, 63, 94, 0.3)' : (isLight ? 'rgba(144, 103, 198, 0.2)' : 'rgba(147, 76, 240, 0.2)')}`,
                borderRadius: '24px',
                padding: '32px',
                color: isLight ? '#242038' : '#fff',
                fontSize: '1.15rem',
                lineHeight: '1.7',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease',
                boxShadow: isRecording
                   ? '0 0 25px rgba(244, 63, 94, 0.2)'
                   : 'none',
              }}
              onFocus={e => {
                if (!isRecording) {
                  e.currentTarget.style.borderColor = isLight ? '#9067C6' : '#934CF0';
                  e.currentTarget.style.boxShadow = isLight ? '0 0 20px rgba(144, 103, 198, 0.1)' : '0 0 20px rgba(147, 76, 240, 0.15)';
                }
              }}
              onBlur={e => {
                if (!isRecording) {
                  e.currentTarget.style.borderColor = isLight ? 'rgba(144, 103, 198, 0.2)' : 'rgba(147, 76, 240, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            />
            {/* Character count */}
            <div style={{
              position: 'absolute',
              bottom: '24px',
              right: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: isLight ? '#64748b' : '#52525b',
              fontWeight: '500',
            }}>
              <span style={{ color: charCount >= 20 ? (isLight ? '#9067C6' : '#934CF0') : (isLight ? '#64748b' : '#52525b') }}>{charCount}</span>
              <span>/ 20 min characters</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleFinalSubmit}
            disabled={!isSubmitEnabled}
            style={{
              width: '100%',
              padding: '24px',
              borderRadius: '16px',
              background: isSubmitEnabled
                ? (error ? '#f43f5e' : `linear-gradient(135deg, ${isLight ? '#9067C6' : '#934CF0'}, ${isLight ? '#4338CA' : '#4338CA'})`)
                : `linear-gradient(135deg, ${isLight ? '#9067C6' : '#934CF0'}, ${isLight ? '#4338CA' : '#4338CA'})`,
              color: '#fff',
              fontWeight: '800',
              border: 'none',
              cursor: isSubmitEnabled ? 'pointer' : 'not-allowed',
              fontSize: '1.15rem',
              opacity: isSubmitEnabled ? 1 : 0.3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: isSubmitEnabled && isLight ? '0 10px 20px rgba(144, 103, 198, 0.2)' : 'none',
            }}
            onMouseEnter={e => {
              if (isSubmitEnabled) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = isLight ? '0 10px 40px rgba(144, 103, 198, 0.3)' : '0 0 30px rgba(147, 76, 240, 0.4)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isSubmitEnabled && isLight ? '0 10px 20px rgba(144, 103, 198, 0.2)' : 'none';
            }}
            onMouseDown={e => {
              if (isSubmitEnabled) e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={e => {
              if (isSubmitEnabled) e.currentTarget.style.transform = 'scale(1.02)';
            }}
          >
            <span>
              {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : isSaving ? <Loader2 size={18} className="animate-spin" /> : error ? 'Retry Audit' : 'Analyze My Explanation'}
            </span>
            {!isAnalyzing && !isSaving && <Sparkles size={18} />}
          </button>
        </div>
      </main>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shakeIn {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes pulse-red {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }
        @keyframes pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 ${isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(16, 185, 129, 0.4)'}; }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .pulse-red {
          animation: pulse-red 2s infinite;
        }
        .pulse-green {
          animation: pulse-green 2s infinite;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .articulation-textarea::-webkit-scrollbar {
          width: 6px;
        }
        .articulation-textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        .articulation-textarea::-webkit-scrollbar-thumb {
          background: ${isLight ? 'rgba(144, 103, 198, 0.2)' : 'rgba(147, 76, 240, 0.3)'};
          border-radius: 10px;
        }
        .articulation-textarea::-webkit-scrollbar-thumb:hover {
          background: ${isLight ? 'rgba(144, 103, 198, 0.4)' : 'rgba(147, 76, 240, 0.5)'};
        }
        .articulation-textarea {
          scrollbar-width: thin;
          scrollbar-color: ${isLight ? 'rgba(144, 103, 198, 0.2)' : 'rgba(147, 76, 240, 0.3)'} transparent;
        }

        /* Layout responsiveness */
        .ml-articulation-root {
          flex-direction: column;
        }

        @media (min-width: 768px) {
          .ml-articulation-root {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}
