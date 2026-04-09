'use client'
import React, { useState } from 'react';
import { Brain } from 'lucide-react';

export default function DiagnosticTest({ questions = [], onComplete }) {
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const theme = {
    accent: '#a855f7',
    error: '#f43f5e',
    success: '#10b981',
    card: '#111111', 
    border: '#262626',
    bg: '#050505',
    textMuted: '#94a3b8'
  };

  const handleOptionSelect = (qIdx, optionKey) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optionKey }));
  };

  const calculateResults = () => {
    const score = questions.reduce((acc, q, idx) => {
      // Ensure we compare based on the key (A, B, C, etc.)
      return acc + (answers[idx] === q.answer ? 1 : 0);
    }, 0);
    
    setIsSubmitted(true);
    if (onComplete) onComplete(score);
  };

  // Guard clause for empty questions
  if (!questions || questions.length === 0) return null;

  return (
    <div style={{ 
      backgroundColor: theme.card, 
      padding: '40px', 
      borderRadius: '28px', 
      border: `1px solid ${theme.border}`,
      animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      marginTop: '40px'
    }}>
      <div style={{ marginBottom: '35px', textAlign: 'left' }}>
        <h3 style={{ 
          color: theme.accent, 
          fontSize: '1.5rem', 
          fontWeight: '900', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          margin: 0 
        }}>
          <Brain size={24} /> Cognitive Validation
        </h3>
        <p style={{ color: theme.textMuted, fontSize: '1rem', marginTop: '10px', lineHeight: '1.6' }}>
          Your articulation accuracy was low. We need to verify if the 
          <strong style={{ color: '#fff' }}> conceptual nodes</strong> are correctly mapped in your memory.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '40px' }}>
        {questions.map((q, idx) => (
          <div key={idx} style={{ paddingBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <span style={{ 
                color: theme.accent, fontWeight: '900', fontSize: '0.9rem', 
                minWidth: '25px', height: '25px', borderRadius: '50%', 
                border: `1px solid ${theme.accent}`, display: 'flex', 
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {idx + 1}
              </span>
              <p style={{ color: '#fff', fontWeight: '600', fontSize: '1.1rem', margin: 0 }}>
                {q.question}
              </p>
            </div>

            <div style={{ display: 'grid', gap:  '12px', paddingLeft: '40px' }}>
              {Object.entries(q.options || {}).map(([key, val]) => {
                const isSelected = answers[idx] === key;
                const isCorrect = isSubmitted && key === q.answer;
                const isWrong = isSubmitted && isSelected && key !== q.answer;

                let bgColor = theme.bg;
                let borderColor = '#333';
                let textColor = '#fff';

                if (isSelected && !isSubmitted) {
                  bgColor = `${theme.accent}15`;
                  borderColor = theme.accent;
                }
                if (isCorrect) {
                  bgColor = `${theme.success}22`;
                  borderColor = theme.success;
                  textColor = theme.success;
                }
                if (isWrong) {
                  bgColor = `${theme.error}22`;
                  borderColor = theme.error;
                  textColor = theme.error;
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleOptionSelect(idx, key)}
                    disabled={isSubmitted}
                    style={{
                      textAlign: 'left',
                      padding: '18px 22px',
                      borderRadius: '14px',
                      cursor: isSubmitted ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '1rem',
                      border: `1px solid ${borderColor}`,
                      backgroundColor: bgColor,
                      color: textColor,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '15px'
                    }}
                  >
                    <span style={{ 
                      fontWeight: '900', 
                      fontSize: '0.9rem', 
                      color: isSelected || isCorrect || isWrong ? 'inherit' : theme.accent,
                      minWidth: '20px',
                      marginTop: '2px'
                    }}>
                      {key.toUpperCase()}.
                    </span> 
                    <span style={{ lineHeight: '1.4' }}>{val}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!isSubmitted ? (
        <button
          onClick={calculateResults}
          disabled={Object.keys(answers).length < questions.length}
          style={{
            width: '100%',
            marginTop: '40px',
            padding: '22px',
            borderRadius: '18px',
            backgroundColor: theme.accent,
            color: '#fff',
            fontWeight: '900',
            border: 'none',
            cursor: Object.keys(answers).length < questions.length ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            opacity: Object.keys(answers).length < questions.length ? 0.4 : 1,
            boxShadow: Object.keys(answers).length < questions.length ? 'none' : `0 15px 35px ${theme.accent}44`,
            transition: 'all 0.3s ease'
          }}
        >
          Verify Neural Alignment
        </button>
      ) : (
        <div style={{ 
          marginTop: '40px', 
          padding: '25px', 
          textAlign: 'center', 
          backgroundColor: '#000', 
          borderRadius: '16px', 
          border: `1px dashed ${theme.border}`,
          animation: 'fadeIn 0.8s ease' 
        }}>
          <p style={{ color: theme.success, fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>
            DIAGNOSTIC DATA SYNTHESIZED
          </p>
          <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '8px', margin: '8px 0 0 0' }}>
            Review the results above. Your conceptual mapping is now reflected in the final verdict.
          </p>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}