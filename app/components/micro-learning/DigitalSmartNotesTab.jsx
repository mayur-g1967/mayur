'use client'

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export default function DigitalSmartNotesTab({
  player,
  videoId,
  theme,
  videoTitle   // ← Now received from parent (page.jsx)
}) {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // ─── Theme constants derived from props ───
  const isLight = theme?.isLight || false;
  const t = {
    primary: theme?.accent || '#934CF0',
    gradientEnd: '#4338CA',
    bgDark: isLight ? 'rgba(144, 103, 198, 0.05)' : '#181022',
    headerBg: isLight ? 'rgba(144, 103, 198, 0.08)' : 'rgba(24, 16, 34, 0.4)',
    cardGlass: isLight ? 'rgba(144, 103, 198, 0.04)' : 'rgba(147, 76, 240, 0.05)',
    cardGlassAlt: isLight ? 'rgba(144, 103, 198, 0.06)' : 'rgba(255, 255, 255, 0.03)',
    borderGlass: isLight ? 'rgba(144, 103, 198, 0.15)' : 'rgba(255, 255, 255, 0.1)',
    textMuted: isLight ? '#655A7C' : 'rgba(255, 255, 255, 0.4)',
    textBody: isLight ? '#242038' : 'rgba(255, 255, 255, 0.9)',
    blue: '#60a5fa',
    blueHover: '#93c5fd',
    red: '#f87171',
    redHover: '#fca5a5',
    inputBg: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0,0,0,0.2)',
  };

  // ─── Load notes from localStorage ───
  useEffect(() => {
    if (!videoId) return;
    const stored = localStorage.getItem(`video-notes-${videoId}`);
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch (e) {
        console.error('Note parse error:', e);
      }
    } else {
      setNotes([]);
    }
  }, [videoId]);

  // ─── Save notes on change ───
  useEffect(() => {
    if (!videoId) return;
    localStorage.setItem(`video-notes-${videoId}`, JSON.stringify(notes));
  }, [notes, videoId]);

  // ─── Ctrl+N hotkey ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowInput(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Get player time as "MM:SS" ───
  const getCurrentFormattedTime = () => {
    if (!player || !player.getCurrentTime) return '00:00';
    const raw = player.getCurrentTime();
    const mins = Math.floor(raw / 60);
    const secs = Math.floor(raw % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ─── Add new or update existing note ───
  const handleAddOrUpdateNote = () => {
    if (editingId !== null) {
      setNotes(prev =>
        prev.map(n =>
          n.id === editingId ? { ...n, text: editingText } : n
        )
      );
      setEditingId(null);
      setEditingText('');
    } else {
      if (!noteText.trim()) return;
      const timeStr = getCurrentFormattedTime();
      const rawSeconds = player?.getCurrentTime?.() || 0;

      setNotes(prev => [
        ...prev,
        {
          id: Date.now(),
          time: timeStr,
          seconds: rawSeconds,
          text: noteText,
        },
      ]);
      setNoteText('');
      setShowInput(false);
    }
  };

  const handleStartEdit = (note) => {
    setEditingId(note.id);
    setEditingText(note.text);
  };

  const handleDelete = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleSeek = (seconds) => {
    if (player && player.seekTo) {
      player.seekTo(seconds, true);
    }
  };

  // ─── Export to PDF ───
  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = videoTitle || `Video: ${videoId}`;

    doc.setFontSize(16);
    doc.text(title, 10, 15);
    doc.setFontSize(10);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 10, 25);

    let yPos = 40;

    notes.forEach((note, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`[${note.time}]`, 10, yPos);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);

      const lines = doc.splitTextToSize(note.text, 180);
      doc.text(lines, 30, yPos);
      yPos += lines.length * 6 + 10;
    });

    doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.pdf`);
  };

  // ─── Export to Word (DOCX) ───
  const exportToDOCX = async () => {
    const title = videoTitle || `Video: ${videoId}`;

    const children = [
      new Paragraph({
        children: [
          new TextRun({ text: title, bold: true, size: 32 }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Exported: ${new Date().toLocaleString()}`,
            color: '808080',
            size: 18,
          }),
        ],
        spacing: { after: 300 },
      }),
    ];

    notes.forEach((note) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${note.time}]  `, bold: true, size: 22 }),
            new TextRun({ text: note.text, size: 22 }),
          ],
          spacing: { after: 200 },
        })
      );
    });

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.docx`);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      color: t.textBody,
    }}>
      {/* ── Header ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${t.borderGlass}`,
        background: t.headerBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: t.primary, fontSize: '1.1rem' }}>📝</span>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '600', margin: 0, letterSpacing: '-0.01em' }}>
            Smart Notes
          </h2>
        </div>
        <button
          onClick={() => {
            if (editingId !== null) {
              setEditingId(null);
              setEditingText('');
            }
            setShowInput(!showInput);
          }}
          style={{
            background: `linear-gradient(135deg, ${t.primary}, ${t.gradientEnd})`,
            color: '#fff',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '999px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(147, 76, 240, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 0 25px rgba(147, 76, 240, 0.4)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(147, 76, 240, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
          <span>New Note</span>
        </button>
      </div>

      {/* ── Input Area ── */}
      {showInput && (
        <div style={{ padding: '16px 24px' }}>
          <div style={{
            background: t.cardGlassAlt,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: `1px solid ${t.borderGlass}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.05)',
          }}>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Type your note here... (timestamp added automatically)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddOrUpdateNote();
                }
              }}
              style={{
                width: '100%',
                minHeight: '120px',
                background: t.inputBg,
                border: isLight ? `1px solid ${t.borderGlass}` : 'none',
                outline: 'none',
                color: t.textBody,
                fontSize: '1rem',
                lineHeight: '1.6',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => {
                  setShowInput(false);
                  setNoteText('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = t.textBody}
                onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdateNote}
                style={{
                  background: `linear-gradient(135deg, ${t.primary}, ${t.gradientEnd})`,
                  color: '#fff',
                  border: 'none',
                  padding: '8px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxShadow: '0 2px 10px rgba(147, 76, 240, 0.25)',
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notes List ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        minHeight: 0,
        padding: '16px 24px 100px 24px', // Extra bottom padding for "Add Note" bar
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overscrollBehaviorY: 'contain',
      }} className="smart-notes-scroll">
        {notes.length === 0 ? (
          <p style={{
            textAlign: 'center',
            color: t.textMuted,
            marginTop: '40px',
            fontSize: '0.95rem',
          }}>
            No notes yet. Click "New Note" to get started.
          </p>
        ) : (
          notes.map((note, index) => (
            <div
              key={note.id}
              className="note-card-el"
              style={{
                background: t.cardGlassAlt,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: `1px solid ${t.borderGlass}`,
                borderRadius: '16px',
                padding: '20px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: `noteEntrance 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${index * 100}ms forwards`,
                opacity: 0,
              }}
            >
              {editingId === note.id ? (
                /* ── Edit Mode ── */
                <div>
                  <textarea
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddOrUpdateNote();
                      }
                    }}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${t.borderGlass}`,
                      borderRadius: '12px',
                      padding: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingText('');
                      }}
                      style={{
                        padding: '6px 14px',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = t.textBody}
                      onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddOrUpdateNote}
                      style={{
                        padding: '6px 14px',
                        background: `linear-gradient(135deg, ${t.primary}, ${t.gradientEnd})`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Display Mode ── */
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div
                      onClick={() => handleSeek(note.seconds)}
                      style={{
                        background: t.primary,
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(147, 76, 240, 0.2)',
                        transition: 'filter 0.2s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                      onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                    >
                      {note.time}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: t.textBody,
                        lineHeight: '1.6',
                        fontSize: '0.95rem',
                        margin: 0,
                      }}>
                        {note.text}
                      </p>
                    </div>
                  </div>
                  <div
                    className="note-actions"
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '16px',
                      marginTop: '16px',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <button
                      onClick={() => handleStartEdit(note)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: t.blue,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = t.blueHover}
                      onMouseLeave={e => e.currentTarget.style.color = t.blue}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: t.red,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = t.redHover}
                      onMouseLeave={e => e.currentTarget.style.color = t.red}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Export Footer ── */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        padding: '20px 24px',
        borderTop: `1px solid ${t.borderGlass}`,
        background: t.headerBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        gap: '16px',
      }}>
        <button
          onClick={exportToPDF}
          disabled={notes.length === 0}
          className="export-btn"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            borderRadius: '12px',
            border: `1px solid rgba(147, 76, 240, 0.3)`,
            background: 'transparent',
            color: t.primary,
            cursor: notes.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s',
            opacity: notes.length === 0 ? 0.4 : 1,
          }}
          onMouseEnter={e => {
            if (notes.length > 0) e.currentTarget.style.background = 'rgba(147, 76, 240, 0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          📄 Export PDF
        </button>
        <button
          onClick={exportToDOCX}
          disabled={notes.length === 0}
          className="export-btn"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            borderRadius: '12px',
            border: `1px solid rgba(147, 76, 240, 0.3)`,
            background: 'transparent',
            color: t.primary,
            cursor: notes.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s',
            opacity: notes.length === 0 ? 0.4 : 1,
          }}
          onMouseEnter={e => {
            if (notes.length > 0) e.currentTarget.style.background = 'rgba(147, 76, 240, 0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          📄 Export Word
        </button>
      </div>

      {/* ── Scoped CSS ── */}
      <style>{`
        @keyframes noteEntrance {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .smart-notes-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .smart-notes-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .smart-notes-scroll::-webkit-scrollbar-thumb {
          background: rgba(147, 76, 240, 0.2);
          border-radius: 10px;
        }
        .smart-notes-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(147, 76, 240, 0.2) transparent;
        }
        .note-card-el:hover {
          transform: scale(1.02);
          border-color: #934CF0 !important;
          box-shadow: 0 0 20px rgba(147, 76, 240, 0.2);
        }
        .note-card-el:hover .note-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}