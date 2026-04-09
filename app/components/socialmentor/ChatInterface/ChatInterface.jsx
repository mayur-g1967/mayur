"use client";

import { cn } from "@/lib/utils";
import { Mic, Send, Sparkles, Volume2, Square } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { getAuthToken } from "@/lib/auth-client";

export function ChatInterface({ onTalkingStateChange, sessionId, initialMessages, onNewChat, avatarType = "male", t }) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [maleVoices, setMaleVoices] = useState([]);
    const [femaleVoices, setFemaleVoices] = useState([]);
    const [selectedMaleVoice, setSelectedMaleVoice] = useState("");
    const [selectedFemaleVoice, setSelectedFemaleVoice] = useState("");
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const ttsTimeoutRef = useRef(null);
    const audioRef = useRef(null);
    const audioQueueRef = useRef([]);
    const sessionStartTimeRef = useRef(null);
    const recognitionRef = useRef(null);
    const isMicEnabledRef = useRef(false);

    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            // Restore from history
            setMessages(initialMessages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
            setCurrentSessionId(sessionId);
            sessionStartTimeRef.current = Date.now();
        } else {
            // New Session
            setMessages([
                {
                    id: "1",
                    role: "ai",
                    text: "Hello! I'm your Social Mentor. I can help you practice tricky social situations.",
                    timestamp: new Date(),
                },
            ]);
            setCurrentSessionId(sessionId || Date.now().toString());
            sessionStartTimeRef.current = Date.now();
        }

        return () => {
            if (typeof window !== "undefined" && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (ttsTimeoutRef.current) {
                clearTimeout(ttsTimeoutRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            onTalkingStateChange?.(false);
        };
    }, [sessionId, initialMessages]);

    const saveToDB = async (sid, msgs) => {
        try {
            const token = getAuthToken();
            console.log(`[ChatInterface] Saving to DB. SessionId: ${sid}, Messages: ${msgs.length}, Token: ${token ? "Yes" : "No"}`);

            const res = await fetch('/api/mentor/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId: sid, messages: msgs })
            });

            const data = await res.json();
            console.log('[ChatInterface] Save result status:', res.status, data);

            if (!res.ok) {
                console.error('Failed to save to DB:', data.error || res.statusText);
            }
        } catch (e) {
            console.error('[ChatInterface] Failed to save history - Network/Auth error:', e);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Speech Recognition & Voice Loading
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Load voices for the dropdown
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                // Filter for English male voices
                const filteredMale = voices.filter(v => {
                    const name = v.name.toLowerCase();
                    const isEnglish = v.lang.startsWith('en');
                    const hasMaleIndicator = name.includes('male') || name.includes('david') || name.includes('mark') ||
                        name.includes('james') || name.includes('guy') || name.includes('christopher') ||
                        name.includes('george') || name.includes('oliver') || name.includes('harry') ||
                        name.includes('stefan') || name.includes('danny') || name.includes('marcus') ||
                        name.includes('ravi') || name.includes('prabhat');
                    const hasFemaleIndicator = name.includes('female') || name.includes('zira') || name.includes('heera') ||
                        name.includes('aria') || name.includes('jenny') || name.includes('sara') ||
                        name.includes('helena') || name.includes('catherine') || name.includes('linda') ||
                        name.includes('susan') || name.includes('hazel') || name.includes('libby');
                    return isEnglish && hasMaleIndicator && !hasFemaleIndicator;
                });
                setMaleVoices(filteredMale);

                // Filter for English female voices
                const filteredFemale = voices.filter(v => {
                    const name = v.name.toLowerCase();
                    const isEnglish = v.lang.startsWith('en');
                    const hasFemaleIndicator = name.includes('female') || name.includes('zira') || name.includes('heera') ||
                        name.includes('aria') || name.includes('jenny') || name.includes('sara') ||
                        name.includes('helena') || name.includes('catherine') || name.includes('linda') ||
                        name.includes('susan') || name.includes('hazel') || name.includes('libby');
                    const hasMaleIndicator = name.includes('male') && !name.includes('female');
                    return isEnglish && hasFemaleIndicator && !hasMaleIndicator;
                });
                setFemaleVoices(filteredFemale);

                // Auto-select defaults
                if (!selectedMaleVoice && filteredMale.length > 0) {
                    const best =
                        filteredMale.find(v => v.name.toLowerCase().includes('uk') && v.name.toLowerCase().includes('male')) ||
                        filteredMale.find(v => v.name.toLowerCase().includes('uk') && v.name.toLowerCase().includes('george')) ||
                        filteredMale.find(v => v.name.includes('Christopher')) ||
                        filteredMale[0];
                    setSelectedMaleVoice(best.name);
                }
                if (!selectedFemaleVoice && filteredFemale.length > 0) {
                    const best =
                        filteredFemale.find(v => v.name.includes('Aria') && v.name.includes('Neural')) ||
                        filteredFemale.find(v => v.name.includes('Jenny') && v.name.includes('Neural')) ||
                        filteredFemale.find(v => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female')) ||
                        filteredFemale.find(v => v.name.includes('Zira')) ||
                        filteredFemale[0];
                    setSelectedFemaleVoice(best.name);
                }
            };

            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }

            if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
                console.warn("Speech Recognition not supported");
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => {
                // If it was supposed to be listening but stopped (timeout/silence), restart it
                if (isMicEnabledRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Mic restart failed:", e);
                        setIsListening(false);
                    }
                } else {
                    setIsListening(false);
                }
            };
            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === 'not-allowed') {
                    isMicEnabledRef.current = false;
                    setIsListening(false);
                }
            };
            recognition.onnomatch = () => { };
            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setInput((prev) => (prev ? prev + " " + finalTranscript : finalTranscript));
                }
            };

            recognitionRef.current = recognition;

            return () => {
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
            };
        }
    }, []);

    const toggleListening = () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;
        if (isListening) {
            isMicEnabledRef.current = false;
            recognition.stop();
        } else {
            isMicEnabledRef.current = true;
            try {
                recognition.start();
            } catch (e) {
                console.error("Failed to start recognition:", e);
                setIsListening(false);
                isMicEnabledRef.current = false;
            }
        }
    };

    // Safely stop ALL talking
    const stopTalking = () => {
        if (typeof window !== "undefined" && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (ttsTimeoutRef.current) {
            clearTimeout(ttsTimeoutRef.current);
            ttsTimeoutRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        audioQueueRef.current = [];
        onTalkingStateChange?.(false);
    };

    const playAudioQueue = async () => {
        if (audioQueueRef.current.length === 0) {
            stopTalking();
            return;
        }

        const base64Audio = audioQueueRef.current.shift();
        const audio = new Audio("data:audio/mp3;base64," + base64Audio);
        audioRef.current = audio;

        audio.onplay = () => onTalkingStateChange?.(true);
        audio.onended = () => {
            if (audioQueueRef.current.length > 0) {
                playAudioQueue();
            } else {
                stopTalking();
            }
        };
        audio.onerror = () => stopTalking();

        try {
            await audio.play();
        } catch (error) {
            console.error("Audio playback failed:", error);
            stopTalking();
        }
    };

    const handleSpeakMessage = async (text) => {
        // Only stop if we're not already transitioning 
        // to a new audio fetch for the female avatar
        if (avatarType !== "female") {
            if (typeof window !== "undefined" && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            stopTalking();
        } else {
            // For female, we want to keep the "isTalking" state true if possible
            if (typeof window !== "undefined" && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            // Just clear previous audio without resetting the isTalking state yet
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current = null;
            }
            audioQueueRef.current = [];
        }

        if (!text) {
            stopTalking();
            return;
        }

        if (avatarType === "female") {
            // Check if user has selected a system voice for female
            if (typeof window !== "undefined" && 'speechSynthesis' in window && selectedFemaleVoice) {
                const voices = window.speechSynthesis.getVoices();
                const v = voices.find(v => v.name === selectedFemaleVoice);
                if (v) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.voice = v;
                    utterance.pitch = 1.0;
                    utterance.rate = 1.05;

                    const wordCount = text.split(/\s+/).length;
                    const estimatedMs = Math.ceil((wordCount / 130) * 60 * 1000) + 3000;

                    utterance.onstart = () => {
                        onTalkingStateChange?.(true);
                        ttsTimeoutRef.current = setTimeout(() => stopTalking(), estimatedMs);
                    };
                    utterance.onend = () => stopTalking();
                    window.speechSynthesis.speak(utterance);
                    return;
                }
            }

            // Fallback to API if no free voice selected or found
            try {
                console.log("[TTS] Requesting audio for text length:", text.length);
                onTalkingStateChange?.(true);

                const res = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, lang: 'en' })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.details || "TTS API failed");
                }

                const data = await res.json();
                console.log("[TTS] Received chunks:", data.chunks?.length);

                if (data.chunks && data.chunks.length > 0) {
                    audioQueueRef.current = data.chunks.map(c => c.base64);
                    playAudioQueue();
                } else {
                    console.warn("[TTS] No audio chunks returned");
                    stopTalking();
                }
            } catch (error) {
                console.error("[TTS] Google TTS error:", error);
                stopTalking();
            }
        } else {
            // Male Avatar uses standard browser TTS
            if (typeof window !== "undefined" && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                const wordCount = text.split(/\s+/).length;
                const estimatedMs = Math.ceil((wordCount / 130) * 60 * 1000) + 3000;

                // Better Male Voice Selection logic
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    // 1. Try to use the user-selected voice from the UI
                    let bestMaleVoice = voices.find(v => v.name === selectedMaleVoice);

                    // 2. Fallback to auto-detection if no selection or selection not found
                    if (!bestMaleVoice) {
                        bestMaleVoice =
                            voices.find(v => v.name.toLowerCase().includes('uk') && v.name.toLowerCase().includes('male')) ||
                            voices.find(v => v.name.toLowerCase().includes('uk') && v.name.toLowerCase().includes('george')) ||
                            voices.find(v => v.name.includes('Christopher') && v.name.includes('Neural')) ||
                            voices.find(v => v.name.includes('Christopher')) ||
                            voices.find(v => (v.name.includes('Neural') || v.name.includes('Natural')) && (v.name.includes('Guy') || v.name.includes('Christopher') || v.name.includes('Gary'))) ||
                            voices.find(v => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('male')) ||
                            voices.find(v => v.name.includes('Microsoft James') || v.name.includes('Microsoft Mark') || v.name.includes('Microsoft Ravi')) ||
                            voices.find(v => v.name.toLowerCase().includes('male')) ||
                            voices.find(v => v.name.includes('David'));
                    }

                    if (bestMaleVoice) {
                        utterance.voice = bestMaleVoice;
                        // David is harsh at default, so we lower the pitch slightly to soften it
                        if (bestMaleVoice.name.includes('David')) {
                            utterance.pitch = 0.9;
                            utterance.rate = 1.0;
                        } else {
                            utterance.pitch = 1.0;
                            utterance.rate = 1.05; // Slightly faster for natural feel
                        }
                    }
                }

                utterance.onstart = () => {
                    onTalkingStateChange?.(true);
                    ttsTimeoutRef.current = setTimeout(() => {
                        stopTalking();
                    }, estimatedMs);
                };

                utterance.onend = () => stopTalking();
                utterance.onerror = () => stopTalking();

                window.speechSynthesis.speak(utterance);
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        // Cancel any ongoing speech before sending a new message
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        stopTalking();

        const userMsg = {
            id: Date.now().toString(),
            role: "user",
            text: input,
            timestamp: new Date(),
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        const aiMsgId = (Date.now() + 1).toString();
        const aiMsg = {
            id: aiMsgId,
            role: "ai",
            text: "",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        try {
            abortControllerRef.current = new AbortController();

            const token = getAuthToken();
            const response = await fetch("/api/mentor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ messages: newMessages }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            // Handle streaming
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";

            onTalkingStateChange?.(true); // Start moving while streaming

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulatedText += parsed.content;
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === aiMsgId
                                            ? { ...msg, text: accumulatedText }
                                            : msg
                                    )
                                );
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            setIsLoading(false);

            // Save the complete session to DB
            const finalMessages = [...newMessages, { id: aiMsgId, role: "ai", text: accumulatedText, timestamp: new Date() }];
            saveToDB(currentSessionId, finalMessages);

            // Trigger TTS
            if (accumulatedText) {
                handleSpeakMessage(accumulatedText);
            } else {
                onTalkingStateChange?.(false);
            }

        } catch (error) {
            setIsLoading(false);
            stopTalking(); // Always reset avatar on error

            if (error.name === 'AbortError') return;

            console.error("Error:", error);
            const errorMsg = {
                id: (Date.now() + 2).toString(),
                role: "ai",
                text: `⚠️ ${error.message}`,
                timestamp: new Date(),
            };
            setMessages((prev) => {
                const filtered = prev.filter(msg => msg.id !== aiMsgId);
                return [...filtered, errorMsg];
            });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div
                className="p-4 border-b backdrop-blur-2xl flex items-center justify-between z-10 transition-colors"
                style={{ backgroundColor: t.glassBg, borderColor: t.separator }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: t.btnPrimaryBg }}>
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-syne font-bold text-lg leading-tight" style={{ color: t.textPrimary }}>Social Mentor</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>
                                {isLoading ? "🤔 Thinking..." : "✓ Synchronized"}
                            </p>
                            <div className="flex items-center gap-0">
                                {(avatarType === "male" ? maleVoices : femaleVoices).length > 0 && (
                                    <>
                                        <select
                                            value={avatarType === "male" ? selectedMaleVoice : selectedFemaleVoice}
                                            onChange={(e) => avatarType === "male" ? setSelectedMaleVoice(e.target.value) : setSelectedFemaleVoice(e.target.value)}
                                            suppressHydrationWarning
                                            className="text-[9px] font-bold uppercase bg-transparent border-none focus:ring-0 cursor-pointer p-0 h-auto -mr-1"
                                            style={{ color: t.primary }}
                                        >
                                            {(avatarType === "male" ? maleVoices : femaleVoices).map(v => (
                                                <option key={v.name} value={v.name} className="bg-white dark:bg-slate-900 text-black dark:text-white">
                                                    {v.name.replace('Microsoft', '').replace('Google', '').trim()}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleSpeakMessage("Hello, I am your social mentor.")}
                                            suppressHydrationWarning
                                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                            title="Test Voice"
                                            style={{ color: t.primary }}
                                        >
                                            <Volume2 className="w-3 h-3" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onNewChat}
                    suppressHydrationWarning
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95"
                    style={{ backgroundColor: t.btnPrimaryBg, color: '#fff' }}
                >
                    + New
                </button>
            </div>

            {/* Messages */}
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex w-full",
                            msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "flex max-w-[90%] sm:max-w-[85%] flex-col gap-1 p-4 rounded-[20px] text-sm sm:text-base shadow-xl group relative border transition-all duration-300 backdrop-blur-2xl",
                                msg.role === "user"
                                    ? "rounded-tr-none"
                                    : "rounded-tl-none border-white/20"
                            )}
                            style={msg.role === "user" ? {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderColor: 'rgba(255, 255, 255, 0.12)',
                                color: t.textPrimary,
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
                            } : {
                                backgroundColor: 'rgba(147, 76, 240, 0.15)',
                                color: t.textPrimary,
                                borderColor: 'rgba(147, 76, 240, 0.25)',
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
                            }}
                        >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            <div className="flex items-center justify-between mt-2">
                                {msg.role === "ai" && !isLoading && msg.text && (
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSpeakMessage(msg.text); }}
                                            suppressHydrationWarning
                                            className="text-[10px] hover:text-white hover:bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-1 bg-white/10"
                                            title="Listen to message again"
                                            style={{ color: t.textPrimary }}
                                        >
                                            <Volume2 className="w-3 h-3" /> <span className="hidden sm:inline">Listen</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); stopTalking(); }}
                                            suppressHydrationWarning
                                            className="text-[10px] hover:text-red-300 hover:bg-red-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 bg-white/10"
                                            title="Stop Speaking"
                                            style={{ color: t.textPrimary }}
                                        >
                                            <Square className="w-3 h-3 fill-current" /> <span className="hidden sm:inline">Stop</span>
                                        </button>
                                    </div>
                                )}
                                {msg.text && (
                                    <span className={cn(
                                        "text-[10px] opacity-40 ml-auto",
                                        msg.role === "user" && "mt-1"
                                    )} style={{ color: t.textPrimary }}>
                                        {msg.timestamp.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="p-4 rounded-2xl rounded-tl-none shadow-lg border backdrop-blur-2xl" style={{ backgroundColor: 'rgba(147, 76, 240, 0.1)', borderColor: 'rgba(147, 76, 240, 0.2)' }}>
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t backdrop-blur-2xl" style={{ backgroundColor: t.glassBg, borderColor: t.separator }}>
                <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                    <button
                        onClick={toggleListening}
                        disabled={isLoading}
                        suppressHydrationWarning
                        className={cn(
                            "p-3.5 rounded-2xl transition-all duration-300 shadow-lg",
                            isListening
                                ? "bg-red-500 text-white animate-pulse"
                                : "hover:bg-black/5 dark:hover:bg-white/5",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                        style={!isListening ? { backgroundColor: t.btnSecondaryBg, color: t.textPrimary, border: `1px solid ${t.cardBorder}` } : {}}
                        title="Toggle Voice Input"
                    >
                        <Mic className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isLoading}
                            suppressHydrationWarning
                            placeholder={isLoading ? "Neural processing..." : "Share your thoughts..."}
                            className="w-full border focus:ring-2 focus:ring-offset-2 rounded-2xl p-3.5 text-sm sm:text-base placeholder:text-gray-400 transition-all shadow-inner backdrop-blur-2xl"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                color: t.textPrimary,
                                "--tw-ring-color": t.primary + '55'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        suppressHydrationWarning
                        className="p-3.5 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: t.primary, color: '#fff' }}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
