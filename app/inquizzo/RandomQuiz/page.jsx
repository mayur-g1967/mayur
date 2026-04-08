// location : app/inquizzo/RandomQuiz/page.jsx
'use client'

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Mic, MicOff, Volume2, CheckCircle, XCircle,
  Clock, Zap, ArrowLeft
} from "lucide-react";
import AnimeIcon from '@/app/components/inquizzo/AnimeIcon';
import { motion } from 'framer-motion';
import Header from '@/app/components/shared/header/Header.jsx';
import NoiseMesh from '@/app/components/inquizzo/NoiseMesh';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import { toast, Toaster } from "sonner";

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const Quiz = () => {
  // ── State ──────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timer, setTimer] = useState(30);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [lastGainedScore, setLastGainedScore] = useState(0);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [lastIsCorrect, setLastIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isManualStop, setIsManualStop] = useState(false);

  // Session tracking (10 questions per session)
  const SESSION_LENGTH = 10;
  const STORAGE_KEY = 'inquizzo_active_session';
  const sessionIdRef = useRef(null);
  const [sessionQCount, setSessionQCount] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [showSessionEnd, setShowSessionEnd] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const questionStartTimeRef = useRef(Date.now());
  const isRestoringSessionRef = useRef(false);
  const hasRestoredRef = useRef(false);  // guard against StrictMode double-fire
  // Refs for session persistence (used to read latest state in saveSession)
  const allQuestionsRef = useRef([]);  // stores all fetched {question, answer} objects

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  const isTransitioningRef = useRef(false);
  const recognitionRef = useRef(null);
  const currentQuestionRef = useRef({ question: "", answer: "" });
  const seenQuestionsRef = useRef([]);
  const voicesRef = useRef([]);
  const transcriptRef = useRef("");
  const isManualStopRef = useRef(false);

  // ── Init ───────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUsername(userData.name || userData.username || userData.email || "");
        setIsAuthenticated(true);
      } catch { setUsername(""); setIsAuthenticated(false); }
    } else {
      setUsername(localStorage.getItem("username") || "");
      setIsAuthenticated(false);
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setIsBrowserSupported(false);
    setMounted(true);
    // Auto-restore session if one exists (prompt is shown on dashboard)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        if (session && session.quiz_id === 'random' && Array.isArray(session.questions) && session.questions.length > 0 && session.current_index > 0 && session.current_index < SESSION_LENGTH) {
          if (!hasRestoredRef.current) {
            hasRestoredRef.current = true;
            restoreSession(session);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to check saved session:', e);
    }
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, []);

  // ── Session Persistence Helpers ────────────────────────────
  const saveSession = (overrides = {}) => {
    try {
      const sessionData = {
        quiz_id: 'random',
        session_id: sessionIdRef.current,
        questions: overrides.questions || allQuestionsRef.current,
        current_index: overrides.current_index ?? sessionQCount,
        answers_map: overrides.answers_map ?? chatHistory,
        score: overrides.score ?? score,
        accuracy: questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 0,
        start_time: overrides.start_time || Date.now(),
        difficulty: selectedDifficulty,
        correct_count: overrides.correct_count ?? correctCount,
        questions_answered: overrides.questions_answered ?? questionsAnswered,
        session_score: overrides.session_score ?? sessionScore,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  };

  const clearSession = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { console.warn('Failed to clear session:', e); }
  };

  const restoreSession = (session) => {
    isRestoringSessionRef.current = true;
    sessionIdRef.current = session.session_id || crypto.randomUUID();
    allQuestionsRef.current = session.questions;
    const idx = session.current_index || 0;
    const currentQ = session.questions[idx];

    setSessionQCount(idx);
    setSessionScore(session.session_score || 0);
    setScore(session.score || 0);
    setCorrectCount(session.correct_count || 0);
    setQuestionsAnswered(session.questions_answered || idx);
    setChatHistory(session.answers_map || []);
    setSelectedDifficulty(session.difficulty || 'medium');

    if (currentQ) {
      setCurrentQuestion(currentQ.question);
      setCorrectAnswer(currentQ.answer);
      currentQuestionRef.current = { question: currentQ.question, answer: currentQ.answer };
    }
    setIsLoading(false);
    setTimer(30);
    setTimerActive(false);
    setTranscript('');
    setFeedback('');
    setShowResult(false);
    setIsAnswering(false);
    setError('');
    questionStartTimeRef.current = Date.now();
    isRestoringSessionRef.current = false;
    toast.success(`Quiz resumed at question ${idx + 1}/${SESSION_LENGTH}`);
  };

  // ── Helpers ────────────────────────────────────────────────
  const getSeenQuestionsKey = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) { try { const u = JSON.parse(userStr); return `quiz_seen_${u.id || u.email || "default"}`; } catch { return "quiz_seen_default"; } }
    return "quiz_seen_default";
  };

  useEffect(() => {
    const key = getSeenQuestionsKey();
    try { const stored = JSON.parse(localStorage.getItem(key) || "[]"); seenQuestionsRef.current = Array.isArray(stored) ? stored : []; } catch { seenQuestionsRef.current = []; }
  }, []);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      const loadVoices = () => { voicesRef.current = speechSynthesis.getVoices(); };
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const getAuthToken = () => localStorage.getItem("token") || localStorage.getItem("authToken");

  const handleAuthError = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    setError("Authentication failed. Please login again.");
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) { handleAuthError(); throw new Error("No authentication token found"); }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2-minute timeout limit

    const config = {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
      signal: controller.signal
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (response.status === 401) { handleAuthError(); throw new Error("Authentication failed"); }
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try { const errorData = await response.json(); if (errorData?.message) errorMsg = errorData.message; } catch { }
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("API call error:", error);
      throw error;
    }
  };

  useEffect(() => {
    currentQuestionRef.current = { question: currentQuestion, answer: correctAnswer };
  }, [currentQuestion, correctAnswer, isLoading, showResult]);

  // ── Speech Recognition ─────────────────────────────────────
  const startListening = () => {
    if (typeof window === 'undefined') return;
    if (!currentQuestion) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setFeedback("Speech Recognition not supported."); setIsBrowserSupported(false); return; }

    if (!isListening) {
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch { } }
      isTransitioningRef.current = false;
      setTranscript(""); transcriptRef.current = ""; setFeedback(""); setTimer(30); setTimerActive(true);
      setIsManualStop(false);

      let intentionalStop = false;
      let silenceTimer;
      const startSilenceTimer = (timeoutMs = 31000) => {
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          isManualStopRef.current = false;
          recognition.stop();
        }, timeoutMs);
      };

      const recognition = new SpeechRecognition();
      recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US"; recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (recognitionRef.current !== recognition) return;
        setIsListening(true);
        startSilenceTimer(31000); // Initial durability: 31s
      };
      recognition.onresult = (event) => {
        if (recognitionRef.current !== recognition) return;
        startSilenceTimer(3000); // Fast evaluation: 3s after speech detection
        let finalTranscript = ""; let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interimTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) { const t = (transcriptRef.current + " " + finalTranscript).trim(); transcriptRef.current = t; setTranscript(t); }
        else if (interimTranscript) setTranscript((transcriptRef.current + " " + interimTranscript).trim());
      };
      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
        clearTimeout(silenceTimer);

        if (isManualStopRef.current) {
          setIsListening(false);
          recognitionRef.current = null;
          setIsManualStop(true);
          return;
        }

        if (transcriptRef.current.trim()) {
          setIsListening(false);
          recognitionRef.current = null;
          checkAnswer(transcriptRef.current);
        } else if (!isTransitioningRef.current && timerActive && timer > 0) {
          // AUTO-RESTART for no-speech/silence
          try {
            recognition.start();
          } catch (e) {
            console.error("Mic restart failed:", e);
            setIsListening(false);
            recognitionRef.current = null;
          }
        } else {
          setIsListening(false);
          recognitionRef.current = null;
        }
      };
      recognition.onerror = (event) => {
        if (recognitionRef.current !== recognition) return;
        clearTimeout(silenceTimer);

        // no-speech often triggers onend immediately after, so we let onend handle the restart
        if (event.error === "no-speech" || event.error === "aborted") return;

        intentionalStop = true;
        setIsListening(false);
        recognitionRef.current = null;
        setFeedback(`Mic Error: ${event.error}`);
      };
      recognition._setIntentionalStop = () => { intentionalStop = true; };
      recognitionRef.current = recognition; recognition.start();
    }
  };

  const stopListening = (useAbort = false) => {
    isManualStopRef.current = true;
    setTimerActive(false);
    setIsListening(false);
    setIsManualStop(true);

    if (recognitionRef.current) {
      if (recognitionRef.current._setIntentionalStop) recognitionRef.current._setIntentionalStop();
      try {
        if (useAbort) recognitionRef.current.abort();
        else recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      recognitionRef.current = null;
    }
  };

  // ── Evaluate Answer ────────────────────────────────────────
  const checkAnswer = async (spokenText, isTimeoutCall = false) => {
    const { question, answer } = currentQuestionRef.current;
    if (!question) { setFeedback("Error: Missing question data."); setShowResult(true); return; }

    setIsAnswering(true);
    const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    const userAnswer = spokenText.trim().toLowerCase();
    const skipPhrases = ["i don't know", "no idea", "skip", "pass", "not sure"];
    const isSkip = skipPhrases.some((p) => userAnswer.includes(p));

    if (isSkip) {
      const feedbackMsg = "You chose to skip this question.";
      const resultData = { question, correctAnswer: answer, userAnswer: spokenText, isCorrect: false, feedback: feedbackMsg, score: 0 };
      setFeedback(feedbackMsg); setLastIsCorrect(false); setIsTimeout(false);
      setChatHistory((prev) => [...prev, resultData]);
      setSessionQCount(prev => prev + 1);
      setQuestionsAnswered((prev) => prev + 1);
      setShowResult(true); setIsAnswering(false);
      // Auto-save session after skip
      const newIdx = sessionQCount + 1;
      saveSession({
        current_index: newIdx,
        answers_map: [...chatHistory, resultData],
        questions_answered: questionsAnswered + 1,
      });
      await saveAttempt({ question, userAnswer: spokenText, correctAnswer: answer, isCorrect: false, score: 0, timeTaken });
      if (newIdx >= SESSION_LENGTH) { setShowSessionEnd(true); clearSession(); }
      return;
    }

    try {
      const data = await makeAuthenticatedRequest("/api/inquizzo/evaluate", {
        method: "POST", body: JSON.stringify({ userAnswer: spokenText, question, correctAnswer: answer, timeTaken }),
      });
      const { result } = data;
      const { isCorrect, similarity, score: gainedScore, feedback: evalFeedback } = result;
      // Always use the ORIGINAL correct answer from question generation for display
      const resultData = { question, correctAnswer: answer, userAnswer: spokenText, similarity, isCorrect, feedback: evalFeedback, score: gainedScore };

      if (gainedScore > 0) { setScore((prev) => prev + gainedScore); setSessionScore((prev) => prev + gainedScore); }
      setLastIsCorrect(!!isCorrect);
      setIsTimeout(isTimeoutCall);
      if (isCorrect) setCorrectCount((prev) => prev + 1);
      setFeedback(evalFeedback); setLastGainedScore(gainedScore || 0);
      setChatHistory((prev) => [...prev, resultData]);
      setSessionQCount(prev => prev + 1);
      setQuestionsAnswered((prev) => prev + 1);
      setShowResult(true);

      // Auto-save session after answering
      const newIdx = sessionQCount + 1;
      saveSession({
        current_index: newIdx,
        answers_map: [...chatHistory, resultData],
        score: score + (gainedScore > 0 ? gainedScore : 0),
        correct_count: correctCount + (isCorrect ? 1 : 0),
        questions_answered: questionsAnswered + 1,
        session_score: sessionScore + (gainedScore > 0 ? gainedScore : 0),
      });

      await saveAttempt({ question, userAnswer: spokenText, correctAnswer: answer, isCorrect, score: gainedScore, timeTaken });
      if (newIdx >= SESSION_LENGTH) { setShowSessionEnd(true); clearSession(); }
    } catch { setFeedback("Something went wrong during evaluation."); setShowResult(true); }
    finally { setIsAnswering(false); }
  };

  // ── TTS ────────────────────────────────────────────────────
  const speakQuestion = async () => {
    if (!currentQuestion) return;
    try {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      const response = await fetch("/api/inquizzo/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentQuestion })
      });
      if (!response.ok) throw new Error("TTS proxy failed");
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.play().catch(e => console.error("Audio play failed:", e));
    } catch (err) {
      console.warn("Proxy TTS failed, using browser fallback", err);
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(currentQuestion);
        utterance.rate = 0.95;
        const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
        // Priority: Natural/Neural voices -> English -> First available
        utterance.voice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Neural"))) ||
          voices.find((v) => v.lang.startsWith("en")) || voices[0];
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // ── Quiz Management ────────────────────────────────────────
  const resetQuiz = (diffOverride = null) => {
    isTransitioningRef.current = true;
    // Robustly stop any active recognition
    stopListening(true);

    const validLevels = ["easy", "medium", "hard"];
    const actualOverride = typeof diffOverride === "string" && validLevels.includes(diffOverride) ? diffOverride : null;

    setIsListening(false);
    setTranscript("");
    transcriptRef.current = "";
    setFeedback("");
    setShowResult(false);
    setIsAnswering(false);
    setTimer(30);
    setTimerActive(false);
    setError("");
    setIsTimeout(false);
    setIsManualStop(false);

    questionStartTimeRef.current = Date.now();
    getAIQuestion(actualOverride);
  };

  const nextQuestion = (actualOverride = null) => {
    isTransitioningRef.current = true; // Set flag to indicate a transition is happening
    stopListening(true); // Robustly stop any active recognition
    setIsListening(false);
    setTranscript("");
    transcriptRef.current = "";
    setFeedback("");
    setShowResult(false);
    setIsAnswering(false);
    setTimer(30);
    setTimerActive(false);
    setError("");
    setIsTimeout(false);
    setIsManualStop(false);

    // CRITICAL: Force stop any active mic before moving to next question
    stopListening(true);

    questionStartTimeRef.current = Date.now();
    getAIQuestion(actualOverride);
  };

  const startNewSession = () => {
    clearSession();
    allQuestionsRef.current = [];
    sessionIdRef.current = crypto.randomUUID();
    setSessionQCount(0); setSessionScore(0); setShowSessionEnd(false); setScore(0);
    setCorrectCount(0);
    setChatHistory([]); setQuestionsAnswered(0); resetQuiz();
  };

  useEffect(() => {
    if (timer > 0 && timerActive && !showResult) {
      const countdown = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0 && timerActive) {
      setTimerActive(false);
      // Force immediate mic release on timeout
      stopListening(true);

      const sessionQIdx = sessionQCount;
      const finalTranscript = transcript || transcriptRef.current;

      if (finalTranscript) {
        checkAnswer(finalTranscript, true);
      } else {
        // No answer given - Timeout
        const timeTaken = 30;
        setLastGainedScore(0);
        setLastIsCorrect(false);
        setIsTimeout(true);
        setFeedback("Time's up! The correct answer is: " + correctAnswer);
        setShowResult(true);

        setQuestionsAnswered((prev) => prev + 1);
        setSessionQCount(prev => prev + 1);

        // Auto-save session after timeout
        const timeoutResult = { question: currentQuestion, userAnswer: '(Timeout)', correctAnswer, isCorrect: false, score: 0 };
        const newIdx = sessionQIdx + 1;
        saveSession({
          current_index: newIdx,
          answers_map: [...chatHistory, timeoutResult],
          questions_answered: questionsAnswered + 1,
        });

        // Record as failed attempt
        saveAttempt({
          question: currentQuestion,
          userAnswer: "(Timeout - No Answer)",
          correctAnswer: correctAnswer,
          isCorrect: false,
          score: 0,
          timeTaken
        });

        if (newIdx >= SESSION_LENGTH) {
          setShowSessionEnd(true);
          clearSession();
        }
      }
    }
  }, [timer, timerActive, showResult]);

  const saveSeenQuestion = (question) => {
    if (!question) return;
    const key = getSeenQuestionsKey();
    const seen = seenQuestionsRef.current;
    if (!seen.includes(question)) {
      seen.push(question);
      if (seen.length > 500) seen.splice(0, seen.length - 500);
      seenQuestionsRef.current = seen;
      localStorage.setItem(key, JSON.stringify(seen));
    }
  };

  const saveAttempt = async ({ question, userAnswer, correctAnswer, isCorrect, score, timeTaken }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !sessionIdRef.current) return;
      await fetch("/api/inquizzo/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ moduleId: "inQuizzo", gameType: "voice", sessionId: sessionIdRef.current, question, userAnswer, correctAnswer, isCorrect, score, difficulty: selectedDifficulty, timeTaken }),
      });

      // Also update active session state
      await saveActiveSession();
    } catch { }
  };

  const saveActiveSession = async (overrideData = {}) => {
    try {
      const token = getAuthToken();
      if (!token || !sessionIdRef.current || showSessionEnd) return;

      const sessionData = {
        sessionId: sessionIdRef.current,
        gameType: 'voice',
        config: {
          topic: 'Random Quiz',
          difficulty: selectedDifficulty
        },
        questionsAnswered,
        correctCount,
        totalScore: score,
        chatHistory: chatHistory.slice(-5), // Keep last 5 for context
        ...overrideData
      };

      await fetch("/api/inquizzo/active-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(sessionData),
      });
    } catch (err) {
      console.error("Failed to save active session:", err);
    }
  };

  const loadActiveSession = async () => {
    try {
      const token = getAuthToken();
      if (!token) return false;

      const data = await makeAuthenticatedRequest("/api/inquizzo/active-session");
      if (data?.session) {
        const s = data.session;
        sessionIdRef.current = s.sessionId;
        setQuestionsAnswered(s.questionsAnswered);
        setCorrectCount(s.correctCount);
        setScore(s.totalScore);
        setSessionScore(s.totalScore);
        setSessionQCount(s.questionsAnswered);
        setSelectedDifficulty(s.config?.difficulty || "medium");
        setChatHistory(s.chatHistory || []);

        if (s.questionsAnswered >= SESSION_LENGTH) {
          setShowSessionEnd(true);
          return true;
        }

        // Fetch a new question to continue
        getAIQuestion(s.config?.difficulty);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to load active session:", err);
      return false;
    }
  };

  const deleteActiveSession = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      await fetch("/api/inquizzo/active-session", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to delete active session:", err);
    }
  };

  const getAIQuestion = async (diffOverride = null) => {
    const token = getAuthToken();
    if (!token) { setError("Please login to access quiz questions."); setIsAuthenticated(false); return; }
    setIsLoading(true); setError("");
    const actualDifficulty = (typeof diffOverride === "string" && ["easy", "medium", "hard"].includes(diffOverride)) ? diffOverride : (selectedDifficulty || "medium");
    const topics = ["general knowledge", "science", "history", "geography", "technology", "sports", "mathematics", "coding"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    try {
      const data = await makeAuthenticatedRequest("/api/inquizzo/ask", {
        method: "POST", body: JSON.stringify({ topic: randomTopic, seenQuestions: seenQuestionsRef.current.slice(-50), difficulty: actualDifficulty }),
      });

      // Simple retry loop for duplicates (max 3)
      let currentData = data;
      let retryCount = 0;
      while (seenQuestionsRef.current.includes(currentData?.question) && retryCount < 3) {
        console.warn(`🔄 AI gave a duplicate question (Attempt ${retryCount + 1}). Retrying...`);
        retryCount++;
        currentData = await makeAuthenticatedRequest("/api/inquizzo/ask", {
          method: "POST", body: JSON.stringify({ topic: randomTopic, seenQuestions: seenQuestionsRef.current.slice(-50), difficulty: actualDifficulty }),
        });
      }

      if (currentData?.question) {
        setCurrentQuestion(currentData.question); setCorrectAnswer(currentData.answer);
        saveSeenQuestion(currentData.question);
        // Track question for session persistence
        allQuestionsRef.current = [...allQuestionsRef.current, { question: currentData.question, answer: currentData.answer }];
        setTimer(30); setTimerActive(false); setTranscript(""); setFeedback(""); setShowResult(false); setIsAnswering(false);
        questionStartTimeRef.current = Date.now();
        // Auto-save session after fetching a new question
        saveSession({ questions: allQuestionsRef.current });
      } else throw new Error("Invalid data");
    } catch (err) {
      console.warn("API failed or timed out. Initiating fallback...", err);
      try {
        const response = await fetch(`/fallback_${actualDifficulty}.json`);
        if (!response.ok) throw new Error("Failed to load fallback JSON");
        const fallbackQuestions = await response.json();

        // 1. Get unseen questions
        const unseen = fallbackQuestions.filter(q => !seenQuestionsRef.current.includes(q.question));

        // 2. Pick a random question
        const pool = unseen.length > 0 ? unseen : fallbackQuestions;
        const randomQ = pool[Math.floor(Math.random() * pool.length)];

        setError("Connection issue. Using emergency offline question bank.");
        setCurrentQuestion(randomQ.question);
        setCorrectAnswer(randomQ.answer);

        saveSeenQuestion(randomQ.question);
        setTimer(30); setTimerActive(false); setTranscript(""); setFeedback(""); setShowResult(false); setIsAnswering(false);
        questionStartTimeRef.current = Date.now();
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
        setError("Critical Error: Unable to load any questions.");
        setCurrentQuestion("What is the capital of India?");
        setCorrectAnswer("New Delhi");
      }
    }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    // Only fetch initial question if we're not restoring a session
    if (!isRestoringSessionRef.current) {
      const saved = localStorage.getItem(STORAGE_KEY);
      const hasValidSession = (() => {
        try {
          if (!saved) return false;
          const s = JSON.parse(saved);
          return s && s.quiz_id === 'random' && Array.isArray(s.questions) && s.questions.length > 0 && s.current_index > 0 && s.current_index < SESSION_LENGTH;
        } catch { return false; }
      })();
      if (!hasValidSession) {
        sessionIdRef.current = crypto.randomUUID();
        getAIQuestion();
      }
    }
  }, []);

  // ── Downloads ──────────────────────────────────────────────
  const downloadCSV = () => {
    let content = `Score: ${score}\n\n`;
    chatHistory.forEach((entry, index) => { content += `Q${index + 1}: ${entry.question}\nAnswer: ${entry.userAnswer}\nCorrect: ${entry.correctAnswer}\n\n`; });
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "quiz_results.txt";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(45, 38, 64);
    doc.text("InQuizzo Quiz Report", margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString()} | Total Score: ${score} XP`, margin, 28);

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 32, pageWidth - margin, 32);

    let y = 45;
    chatHistory.forEach((entry, index) => {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Question Number & Text
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(45, 38, 64);
      const questionText = `Q${index + 1}: ${entry.question}`;
      const splitQuestion = doc.splitTextToSize(questionText, contentWidth);
      doc.text(splitQuestion, margin, y);
      y += (splitQuestion.length * 6);

      // Your Answer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Your Answer: ${entry.userAnswer || "(No Answer)"}`, margin + 5, y);
      y += 6;

      // Correct Answer
      doc.text(`Correct Answer: ${entry.correctAnswer}`, margin + 5, y);
      y += 6;

      // Result
      const isCorrect = entry.isCorrect;
      if (isCorrect) doc.setTextColor(16, 185, 129); // Green
      else doc.setTextColor(239, 68, 68); // Red
      doc.setFont("helvetica", "bold");
      doc.text(`Result: ${isCorrect ? "Correct" : "Incorrect"}`, margin + 5, y);

      y += 15; // Spacing between questions
    });

    doc.save(`InQuizzo_Results_${new Date().getTime()}.pdf`);
  };

  // ── Derived ────────────────────────────────────────────────
  const isCorrectResult = lastIsCorrect;

  /* ════════════════════════════════════════════════════════════
     THEME CONFIG — reads from global next-themes provider
     ════════════════════════════════════════════════════════════ */
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // Palettes: #655A7C #AB92BF #AFC1D6 #CEF9F2 #D6CA98 + #242038 #9067C6 #8D86C9 #CAC4CE
  const t = isLight ? {
    // ── Light Theme (richly tinted, not plain white) ──
    pageBg: '#E8E0F0',                              // lavender-tinted page bg from #AB92BF
    primary: '#9067C6',
    primaryLight: '#8D86C9',
    accent: '#D6CA98',
    mint: '#CEF9F2',
    steel: '#AFC1D6',
    // Glass panels — tinted with palette, not white
    glassBg: 'rgba(171, 146, 191, 0.12)',            // #AB92BF tint
    glassBorder: 'rgba(101, 90, 124, 0.22)',         // #655A7C border
    glassHoverBg: 'rgba(144, 103, 198, 0.1)',        // #9067C6 hover
    // Cards — lavender-frosted glass
    cardBg: 'rgba(175, 193, 214, 0.2)',              // #AFC1D6 tinted card
    cardBorder: 'rgba(101, 90, 124, 0.2)',           // #655A7C border
    cardInnerBg: 'rgba(206, 249, 242, 0.3)',         // #CEF9F2 inner
    // Text
    textPrimary: '#242038',
    textSecondary: '#655A7C',
    textMuted: '#655A7C',                            // cyber grape, not too light
    textSubtle: '#8D86C9',
    // Buttons
    btnPrimaryBg: '#9067C6',
    btnPrimaryHover: '#7B56B3',
    btnSecondaryBg: 'rgba(171, 146, 191, 0.18)',     // #AB92BF visible tint
    btnSecondaryBorder: 'rgba(101, 90, 124, 0.3)',   // #655A7C border
    btnSecondaryText: '#242038',
    // Mic
    micGradientFrom: '#9067C6',
    micGradientTo: '#655A7C',
    micShadow: 'rgba(144, 103, 198, 0.35)',
    micGlow: 'rgba(171, 146, 191, 0.3)',
    // Badge
    badgeBg: 'rgba(144, 103, 198, 0.15)',
    badgeBorder: 'rgba(101, 90, 124, 0.25)',
    badgeText: '#655A7C',
    // Orbs — much more visible
    orb1: 'rgba(171, 146, 191, 0.4)',                // #AB92BF strong
    orb2: 'rgba(175, 193, 214, 0.45)',               // #AFC1D6 strong
    orb3: 'rgba(206, 249, 242, 0.5)',                // #CEF9F2 vibrant
    // Stats — prominent mint backgrounds
    statBg: 'rgba(206, 249, 242, 0.35)',             // #CEF9F2 noticeable
    statLabel: '#655A7C',
    statValue: '#242038',
    statAccent: '#9067C6',
    // Difficulty — visible palette bg
    diffBg: 'rgba(175, 193, 214, 0.3)',              // #AFC1D6 bg
    diffBorder: 'rgba(101, 90, 124, 0.2)',           // #655A7C border
    diffInactive: '#655A7C',
    // Export — tinted rows
    exportBg: 'rgba(175, 193, 214, 0.15)',           // #AFC1D6 visible
    exportBorder: 'rgba(101, 90, 124, 0.15)',        // #655A7C border
    exportText: '#242038',
    // Transcript
    transcriptBg: 'rgba(175, 193, 214, 0.2)',        // #AFC1D6 tinted
    transcriptBorder: 'rgba(101, 90, 124, 0.2)',     // #655A7C border
    transcriptText: '#242038',
    // Separator
    separator: 'rgba(101, 90, 124, 0.15)',           // #655A7C visible
    // Session end
    overlayBg: 'rgba(232, 224, 240, 0.96)',          // lavender overlay
    overlayCardBg: 'rgba(175, 193, 214, 0.25)',      // #AFC1D6 tinted card
    overlayBorder: 'rgba(101, 90, 124, 0.2)',
    overlayStatBg: 'rgba(206, 249, 242, 0.3)',       // #CEF9F2 visible
  } : {
    // ── Dark Theme (original) ──
    pageBg: null,
    primary: '#934cf0',
    primaryLight: '#934cf0',
    accent: '#934cf0',
    mint: '#934cf0',
    steel: '#934cf0',
    glassBg: 'rgba(147, 76, 240, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassHoverBg: 'rgba(255, 255, 255, 0.05)',
    cardBg: 'rgba(147, 76, 240, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    cardInnerBg: 'rgba(24, 16, 34, 0.3)',
    textPrimary: '#ffffff',
    textSecondary: '#ffffff',
    textMuted: '#94A3B8',
    textSubtle: '#94A3B8',
    btnPrimaryBg: '#934cf0',
    btnPrimaryHover: 'rgba(147, 76, 240, 0.9)',
    btnSecondaryBg: 'rgba(147, 76, 240, 0.05)',
    btnSecondaryBorder: 'rgba(255, 255, 255, 0.1)',
    btnSecondaryText: '#CBD5E1',
    micGradientFrom: '#934cf0',
    micGradientTo: '#4338ca',
    micShadow: 'rgba(147, 76, 240, 0.4)',
    micGlow: 'rgba(147, 76, 240, 0.2)',
    badgeBg: 'rgba(147, 76, 240, 0.2)',
    badgeBorder: 'rgba(147, 76, 240, 0.3)',
    badgeText: '#934cf0',
    orb1: 'rgba(147, 76, 240, 0.4)',
    orb2: 'rgba(79, 70, 229, 0.4)',
    orb3: 'rgba(88, 28, 135, 0.2)',
    statBg: 'rgba(24, 16, 34, 0.3)',
    statLabel: '#64748B',
    statValue: '#ffffff',
    statAccent: '#934cf0',
    diffBg: 'rgba(24, 16, 34, 0.5)',
    diffBorder: 'rgba(255, 255, 255, 0.05)',
    diffInactive: '#64748B',
    exportBg: 'rgba(147, 76, 240, 0.03)',
    exportBorder: 'rgba(255, 255, 255, 0.06)',
    exportText: '#E2E8F0',
    transcriptBg: 'rgba(24, 16, 34, 0.6)',
    transcriptBorder: 'rgba(147, 76, 240, 0.2)',
    transcriptText: '#ffffff',
    separator: 'rgba(255, 255, 255, 0.05)',
    overlayBg: 'rgba(24, 16, 34, 0.9)',
    overlayCardBg: 'rgba(147, 76, 240, 0.05)',
    overlayBorder: 'rgba(255, 255, 255, 0.1)',
    overlayStatBg: 'rgba(24, 16, 34, 0.3)',
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  if (!mounted) return null;

  return (
    <div
      className={cn("relative min-h-screen font-dm cursor-none flex flex-col transition-colors duration-500", !isLight && "iq-mesh-bg")}
      style={isLight ? { backgroundColor: t.pageBg } : undefined}
    >
      {!isLight && <NoiseMesh />}

      {/* ── Ambient orbs ── */}
      {isLight ? (
        <>
          {/* Light mode: solid blur orbs using each palette color — same technique as dark mode */}
          <div className="absolute -top-24 -left-24 w-[500px] h-[500px] blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: '#AB92BF', opacity: 0.55 }} />
          <div className="absolute -bottom-16 -right-16 w-[450px] h-[450px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#AFC1D6', opacity: 0.6 }} />
          <div className="absolute top-[25%] right-[5%] w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#CEF9F2', opacity: 0.7 }} />
          <div className="absolute top-[55%] left-[8%] w-[350px] h-[350px] blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: '#D6CA98', opacity: 0.45 }} />
          <div className="absolute top-[10%] left-[45%] w-[300px] h-[300px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#655A7C', opacity: 0.35 }} />
        </>
      ) : (
        <div className="fixed inset-0 pointer-events-none overflow-hidden text-center z-0">
          {/* Dark mode: original orbs */}
          <div className="absolute -top-20 -left-20 w-[400px] h-[400px] blur-[80px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: t.orb1 }} />
          <div className="absolute bottom-10 right-10 w-[300px] h-[300px] blur-[80px] rounded-full pointer-events-none" style={{ backgroundColor: t.orb2 }} />
          <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] blur-[80px] rounded-full pointer-events-none" style={{ backgroundColor: t.orb3 }} />
        </div>
      )}

      <Header
        DateValue="practice"
        onDateChange={() => { }}
        tempDate={new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        showDateFilter={false}
      />

      {/* ── Minimal Sub-Header ─────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-8 pt-2 md:pt-4 max-w-7xl mx-auto w-full">
        <div className="flex-1">
          <button
            onClick={() => window.location.href = '/inquizzo'}
            className="flex items-center gap-2 group transition-colors"
            style={{ color: t.textMuted }}
            data-cursor="button"
          >
            <AnimeIcon Icon={ArrowLeft} className="w-5 h-5" animation="slide" selfHover={true} />
            <span className="font-medium text-sm">Back</span>
          </button>
        </div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-center" style={{ color: isLight ? t.textPrimary : 'rgba(255,255,255,0.9)' }}>Random Quiz</h1>
        <div className="flex-1" /> {/* Spacer for symmetry */}
      </div>

      {/* ── Main Content: 12-col grid ─────────────── */}
      <main className="relative z-10 flex-grow flex flex-col items-center px-4 py-1 md:py-2">
        <div className="max-w-7xl w-full grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 items-start">

          {/* ════ LEFT: Question Area (8 cols) ════ */}
          <div className="xl:col-span-8 flex flex-col gap-6 md:gap-8">

            {/* ── Question Card ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 min-h-[200px] md:min-h-[280px] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden transition-colors duration-500"
              style={{ background: t.cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.cardBorder}` }}
            >
              {/* Question badge */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: t.badgeBg, border: `1px solid ${t.badgeBorder}` }}>
                <AnimeIcon Icon={Zap} className="w-3 h-3" style={{ color: t.badgeText }} animation="jump" selfHover={true} />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: t.badgeText }}>
                  Question {questionsAnswered + 1}/{SESSION_LENGTH}
                </span>
              </div>

              {/* Speaker button */}
              {!isLoading && currentQuestion && (
                <button
                  data-cursor="button"
                  onClick={speakQuestion}
                  className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group/btn"
                  style={{ background: isLight ? 'rgba(101,90,124,0.06)' : 'rgba(255,255,255,0.05)', border: `1px solid ${t.glassBorder}` }}
                  title="Listen to question"
                >
                  <Volume2 className="w-5 h-5 transition-colors" style={{ color: t.textMuted }} />
                </button>
              )}

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex flex-col items-center gap-3 w-full">
                  <XCircle className="w-10 h-10" />
                  <p className="font-medium text-sm">{error}</p>
                  <button onClick={() => getAIQuestion()} className="px-4 py-1.5 rounded-full border border-red-500/30 text-xs font-bold uppercase hover:bg-red-500/10">Retry</button>
                </div>
              )}

              {/* Question text */}
              <h2
                className="font-syne font-semibold leading-tight max-w-2xl mt-12 md:mt-10 transition-all duration-300"
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  color: t.textPrimary,
                  fontSize: !currentQuestion ? '1.5rem' :
                    currentQuestion.length > 200 ? '1.25rem' :
                      currentQuestion.length > 120 ? '1.5rem' :
                        currentQuestion.length > 80 ? '1.875rem' :
                          '2.25rem'
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: t.primary, borderTopColor: 'transparent' }} />
                    <span style={{ color: t.textMuted }}>Generating challenge...</span>
                  </div>
                ) : currentQuestion || "Ready to start?"}
              </h2>

              {/* Voice / Listen Button */}
              <div className="mt-4 md:mt-6 flex flex-col items-center gap-3 md:gap-4">
                <div className="relative">
                  {/* Pulsing ripple rings */}
                  {isListening && (
                    <>
                      <div className="ripple-effect" />
                      <div className="ripple-effect ripple-2" />
                      <div className="ripple-effect ripple-3" />
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -inset-6 rounded-full blur-2xl"
                        style={{ backgroundColor: t.micGlow }}
                      />
                    </>
                  )}
                  <button
                    data-cursor="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={isAnswering || isLoading || !currentQuestion}
                    className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-90 transition-transform duration-300 group"
                    style={isListening
                      ? { backgroundColor: '#EF4444', boxShadow: '0 0 30px rgba(239,68,68,0.4)' }
                      : { background: `linear-gradient(135deg, ${t.micGradientFrom}, ${t.micGradientTo})`, boxShadow: `0 0 30px ${t.micShadow}` }
                    }
                  >
                    {isListening
                      ? <MicOff className="w-7 h-7 md:w-9 md:h-9 text-white group-active:scale-90 transition-transform" />
                      : <Mic className="w-7 h-7 md:w-9 md:h-9 text-white group-active:scale-90 transition-transform" />
                    }
                  </button>
                </div>

                {isAnswering ? (
                  <div className="flex items-center gap-2 font-bold text-sm animate-pulse" style={{ color: t.primary }}>
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: t.primary, borderTopColor: 'transparent' }} />
                    EVALUATING...
                  </div>
                ) : !isListening && transcript.trim() && isManualStop ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        data-cursor="button"
                        onClick={() => startListening()}
                        className="px-6 py-2 rounded-full border border-purple-500/30 text-sm font-bold uppercase hover:bg-purple-500/10 transition-all text-purple-400"
                      >
                        Resume Answer
                      </button>
                      <button
                        data-cursor="button"
                        onClick={() => checkAnswer(transcript)}
                        className="px-6 py-2 rounded-full bg-purple-600 text-sm font-bold uppercase hover:bg-purple-700 transition-all text-white shadow-lg shadow-purple-900/20"
                      >
                        Evaluate Now
                      </button>
                    </div>
                    <p className="text-xs opacity-50 italic">Paused. You can continue speaking or submit for check.</p>
                  </div>
                ) : (
                  <p className="text-[10px] md:text-sm font-medium tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
                    {isListening ? "Listening... speak your answer" :
                      (transcript.trim() && !showResult) ? "Voice answer ready" : "Tap to answer via voice"}
                  </p>
                )}

                {/* Live transcript */}
                {isListening && transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-4 rounded-xl backdrop-blur-md text-sm md:text-base italic max-w-lg mx-auto leading-relaxed"
                    style={{ background: t.transcriptBg, border: `1px solid ${t.transcriptBorder}`, color: t.transcriptText }}
                  >
                    &ldquo;{transcript}&rdquo;
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* ── Navigation Controls ── */}
            <div className="flex items-center gap-3 md:gap-4 max-w-md mx-auto w-full">
              <button
                data-cursor="button"
                onClick={() => resetQuiz()}
                disabled={isLoading}
                className="flex-1 py-3 md:py-4 rounded-xl font-bold transition-all active:scale-[0.98] text-sm md:text-base whitespace-nowrap"
                style={{ background: t.btnSecondaryBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.btnSecondaryBorder}`, color: t.btnSecondaryText }}
              >
                Skip Question
              </button>
              <button
                data-cursor="button"
                onClick={() => {
                  if (showResult) {
                    resetQuiz();
                  } else if (isListening) {
                    stopListening();
                  } else if (!isListening && transcript.trim() && isManualStop) {
                    checkAnswer(transcript);
                  } else if (!isAnswering) {
                    startListening();
                  }
                }}
                className="flex-[2] py-3 md:py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.98] text-sm md:text-base whitespace-nowrap"
                style={{
                  backgroundColor: isListening ? '#EF4444' : (!isListening && transcript.trim() && isManualStop) ? '#10B981' : t.btnPrimaryBg,
                  boxShadow: isListening ? '0 10px 25px rgba(239, 68, 68, 0.3)' : `0 10px 25px ${t.micShadow}`
                }}
              >
                {showResult ? "Next Question"
                  : isListening ? "Stop Answering"
                    : (!isListening && transcript.trim() && isManualStop) ? "Evaluate Answer"
                      : "Start Answering"}
              </button>
            </div>

            {/* ── Feedback Result ── */}
            {showResult && feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-5 md:p-8 rounded-xl md:rounded-2xl border shadow-2xl text-left relative overflow-hidden",
                  isTimeout ? "border-amber-500/30 bg-amber-500/5" : isCorrectResult ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                )}
              >
                <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16" style={{ backgroundColor: isLight ? 'rgba(101,90,124,0.05)' : 'rgba(255,255,255,0.05)' }} />
                <div className="relative z-10">
                  {/* Answer status */}
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center", isTimeout ? "bg-amber-500/20 text-amber-500" : isCorrectResult ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500")} data-cursor="card">
                        {isTimeout
                          ? <AnimeIcon Icon={Clock} className="w-6 h-6 md:w-7 md:h-7" animation="wiggle" hoverParent={true} />
                          : isCorrectResult
                            ? <AnimeIcon Icon={CheckCircle} className="w-6 h-6 md:w-7 md:h-7" animation="jump" hoverParent={true} />
                            : <AnimeIcon Icon={XCircle} className="w-6 h-6 md:w-7 md:h-7" animation="wiggle" hoverParent={true} />
                        }
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Answer</p>
                        <h4 className={cn("font-syne text-lg md:text-2xl font-bold", isTimeout ? "text-amber-500" : isCorrectResult ? "text-green-500" : "text-red-500")}>
                          {isTimeout ? "Time's Up!" : isCorrectResult ? "Right" : "Wrong"}
                        </h4>
                      </div>
                    </div>
                    {lastGainedScore > 0 && (
                      <Badge className="text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full font-bold shadow-lg text-xs md:text-sm" style={{ backgroundColor: t.primary }}>+{lastGainedScore} XP</Badge>
                    )}
                  </div>

                  {/* Real Answer (if wrong) */}
                  {!isCorrectResult && (
                    <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1 text-green-600 dark:text-green-400">Correct Answer</p>
                      <p className="text-sm md:text-base font-bold text-green-700 dark:text-green-300">{correctAnswer}</p>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>Explanation</p>
                    <p className="text-sm md:text-lg leading-relaxed whitespace-pre-wrap" style={{ color: isLight ? 'rgba(45,38,64,0.8)' : 'rgba(255,255,255,0.8)' }}>{feedback}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ════ RIGHT: Control Sidebar (4 cols) ════ */}
          <aside className="xl:col-span-4 flex flex-col gap-3 md:sticky md:top-28">

            {/* ── Quiz Controls Card ── */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3 transition-colors duration-500"
              style={{ background: t.glassBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.glassBorder}` }}
            >
              <div>
                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm md:text-base" style={{ color: t.textPrimary }}>
                  <AnimeIcon Icon={Zap} className="w-5 h-5" style={{ color: t.primary }} animation="jump" selfHover={true} />
                  Quiz Controls
                </h3>
                <div className="space-y-3">
                  {/* Difficulty selector */}
                  <div>
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: t.textMuted }}>Difficulty</label>
                    <div className="flex p-1 rounded-lg" style={{ background: t.diffBg, border: `1px solid ${t.diffBorder}` }}>
                      {["easy", "medium", "hard"].map((level) => (
                        <button
                          key={level}
                          data-cursor="button"
                          onClick={() => { setSelectedDifficulty(level); if (!isLoading) resetQuiz(level); }}
                          className="flex-1 py-1.5 text-[10px] md:text-xs font-bold transition-all rounded-md capitalize"
                          style={selectedDifficulty === level
                            ? { backgroundColor: t.primary, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
                            : { color: t.diffInactive }
                          }
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>


                </div>
              </div>

              <hr style={{ borderColor: t.separator }} />

              {/* Export actions */}
              <div className="flex flex-col gap-2">
                <button
                  data-cursor="button"
                  onClick={downloadPDF}
                  className="flex items-center justify-between w-full p-2.5 rounded-lg group transition-all"
                  style={{ background: t.exportBg, border: `1px solid ${t.exportBorder}` }}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <AnimeIcon Icon={ArrowLeft} className="w-4 h-4 rotate-[270deg] transition-colors" style={{ color: t.textMuted }} animation="slide" selfHover={true} />
                    <span className="text-xs md:text-sm font-medium" style={{ color: t.exportText }}>Export Results PDF</span>
                  </div>
                </button>
                <button
                  data-cursor="button"
                  onClick={downloadCSV}
                  className="flex items-center justify-between w-full p-2.5 rounded-lg group transition-all"
                  style={{ background: t.exportBg, border: `1px solid ${t.exportBorder}` }}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <AnimeIcon Icon={ArrowLeft} className="w-4 h-4 rotate-[270deg] transition-colors" style={{ color: t.textMuted }} animation="slide" selfHover={true} />
                    <span className="text-xs md:text-sm font-medium" style={{ color: t.exportText }}>Download CSV</span>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Session Statistics Card ── */}
            <div
              className="rounded-xl p-4 transition-colors duration-500"
              style={{ background: isLight ? 'linear-gradient(135deg, rgba(206,249,242,0.15), rgba(255,255,255,0.8))' : 'linear-gradient(135deg, rgba(147,76,240,0.08), transparent)', backdropFilter: 'blur(12px)', border: `1px solid ${t.glassBorder}` }}
            >
              <h4 className="font-bold mb-3 text-xs md:text-sm" style={{ color: t.textSecondary }}>Your Session</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: t.statBg }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: t.statLabel }}>Timer</p>
                  <p className={cn("text-lg md:text-xl font-bold tabular-nums font-display", timer <= 10 && isListening && "text-red-500")} style={!(timer <= 10 && isListening) ? { color: t.statValue } : undefined}>
                    {isListening ? `0:${timer < 10 ? `0${timer}` : timer}` : "--:--"}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: t.statBg }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: t.statLabel }}>Score</p>
                  <p className="text-lg md:text-xl font-bold font-display" style={{ color: t.statAccent }}>{score}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: t.statBg }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: t.statLabel }}>Answered</p>
                  <p className="text-lg md:text-xl font-bold font-display" style={{ color: t.statValue }}>{questionsAnswered}/{SESSION_LENGTH}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: t.statBg }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color: t.statLabel }}>Accuracy</p>
                  <p className="text-lg md:text-xl font-bold font-display" style={{ color: t.statAccent }}>
                    {questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Session End Overlay ────────────────────── */}
      {showSessionEnd && (
        <div className="fixed inset-0 z-[100] backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden" style={{ backgroundColor: t.overlayBg }}>
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] blur-[120px] rounded-full" style={{ backgroundColor: isLight ? 'rgba(171,146,191,0.15)' : 'rgba(147,76,240,0.2)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-xl relative px-4">
            <div
              className="relative rounded-2xl md:rounded-3xl p-5 md:p-8 overflow-hidden text-center shadow-2xl"
              style={{ background: t.overlayCardBg, backdropFilter: 'blur(24px)', border: `1px solid ${t.overlayBorder}` }}
            >
              <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: isLight ? `linear-gradient(to right, ${t.primary}, ${t.primaryLight})` : `linear-gradient(to right, #934cf0, #4338ca)` }} />
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 overflow-hidden" style={{ boxShadow: '0 0 30px rgba(255, 193, 7, 0.7), 0 0 60px rgba(255, 193, 7, 0.5), 0 0 100px rgba(255, 193, 7, 0.35), 0 0 150px rgba(255, 193, 7, 0.2), 0 0 200px rgba(147, 76, 240, 0.25)' }}>
                <img src="/Session complete badge.png" alt="Session Complete Badge" style={{ width: '160%', height: '113%', objectFit: 'cover', transform: 'scale(1.2)' }} />
              </div>
              <h3 className="font-syne text-xl sm:text-2xl md:text-4xl font-extrabold mb-2 md:mb-3" style={{ color: t.textPrimary }}>SESSION COMPLETE</h3>
              <p className="text-xs md:text-base mb-4 md:mb-6 uppercase tracking-widest" style={{ color: t.textMuted }}>Completed {SESSION_LENGTH} questions</p>
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="p-3 md:p-5 rounded-xl md:rounded-2xl" style={{ backgroundColor: t.overlayStatBg, border: `1px solid ${t.overlayBorder}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.statLabel }}>Final Score</p>
                  <p className="font-display text-xl sm:text-2xl md:text-4xl font-bold" style={{ color: t.textPrimary }}>{sessionScore}</p>
                </div>
                <div className="p-3 md:p-5 rounded-xl md:rounded-2xl" style={{ backgroundColor: t.overlayStatBg, border: `1px solid ${t.overlayBorder}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.statLabel }}>Total XP</p>
                  <p className="font-display text-xl sm:text-2xl md:text-4xl font-bold" style={{ color: t.primary }}>{score}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 md:gap-4">
                <button
                  data-cursor="button"
                  onClick={startNewSession}
                  className="h-11 md:h-14 rounded-xl md:rounded-2xl text-white font-bold text-sm md:text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{ backgroundColor: t.primary, boxShadow: `0 10px 25px ${t.micShadow}` }}
                >
                  START NEW SESSION
                </button>
                <button
                  data-cursor="button"
                  onClick={() => window.location.href = '/inquizzo'}
                  className="h-11 md:h-14 rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all"
                  style={{ background: t.btnSecondaryBg, border: `1px solid ${t.btnSecondaryBorder}`, color: t.textPrimary }}
                >
                  BACK TO DASHBOARD
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <Toaster richColors position="top-center" />
    </div>
  );
};

export default Quiz;
