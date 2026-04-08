// location : app/inquizzo/QuizDomainSelection/page.jsx
// Question text uses Raleway via inline style={{ fontFamily: "'Raleway', sans-serif" }}
'use client';

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowLeft, ChevronRight, Play, Zap, Target, Mic, MicOff, Volume2,
  CheckCircle, XCircle, RotateCcw, Search, BookOpen, Brain, Code, Sigma,
  Scroll, Landmark, Briefcase, User, Cpu, Palette, Gamepad2, FlaskConical, Atom, Clock
} from "lucide-react";
import Header from '@/app/components/shared/header/Header.jsx';
import AnimeIcon from '@/app/components/inquizzo/AnimeIcon';
import NoiseMesh from '@/app/components/inquizzo/NoiseMesh';
import CursorAura from '@/app/components/inquizzo/CursorAura';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import { QUIZ_STRUCTURE } from "@/lib/quizData";
import { jsPDF } from "jspdf";
import { toast, Toaster } from "sonner";

// ─── ICON MAPS ───────────────────────────────────────────────────────────────
const DOMAIN_ICON_MAP = {
  science: FlaskConical, programming: Code, mathematics: Sigma, history: Landmark,
  humanities: Scroll, business: Briefcase, "personal-dev": User, psychology: Brain,
  technology: Cpu, arts: Palette, games: Gamepad2,
};
const DOMAIN_ANIM = {
  science: "pulse", programming: "spin", mathematics: "wiggle", history: "bounce",
  humanities: "slide", business: "jump", "personal-dev": "pulse", psychology: "wiggle",
  technology: "spin", arts: "bounce", games: "jump",
};
const CATEGORY_ICON_MAP = {
  physics: Atom, chemistry: FlaskConical, fundamentals: Code, "web-dev": Play,
  algebra: Sigma, calculus: Sigma, history: Landmark, geography: BookOpen,
  management: Briefcase, marketing: Zap, communication: Volume2, eq: User,
  cognitive: Brain, social: Target, ai: Cpu, cybersecurity: Zap,
  writing: Palette, visual: Palette, indoor: Gamepad2, outdoor: Play,
};

const CARD_HOVER_VARIANTS = {
  initial: { opacity: 1, y: 0, scale: 1 },
  hover: { y: -8, scale: 1.02, boxShadow: "0 24px 48px rgba(0,0,0,0.5)", transition: { duration: 0.25, ease: "easeOut" } },
};

const QuizDomainSelection = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [currentView, setCurrentView] = useState("domains");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [particles, setParticles] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [lastGainedScore, setLastGainedScore] = useState(0);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const seenQuestionsRef = useRef([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [lastIsCorrect, setLastIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isManualStop, setIsManualStop] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);

  const SESSION_LENGTH = 10;
  const STORAGE_KEY = 'inquizzo_active_session';
  const sessionIdRef = useRef(null);
  const [sessionQCount, setSessionQCount] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [showSessionEnd, setShowSessionEnd] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const questionStartTimeRef = useRef(Date.now());
  const isRestoringSessionRef = useRef(false);
  const hasRestoredRef = useRef(false);  // guard against StrictMode double-fire
  const allQuestionsRef = useRef([]);  // stores all fetched {question, answer} objects
  const isTransitioningRef = useRef(false);
  const recognitionRef = useRef(null);
  const currentQuestionRef = useRef({ question: "", answer: "" });
  const voicesRef = useRef([]);
  const transcriptRef = useRef("");
  const isManualStopRef = useRef(false);

  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // ── Helpers ────────────────────────────────────────────────
  const getSeenQuestionsKey = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) { try { const u = JSON.parse(userStr); return `quiz_seen_${u.id || u.email || "default"}`; } catch { return "quiz_seen_default"; } }
    return "quiz_seen_default";
  };

  useEffect(() => {
    const key = getSeenQuestionsKey();
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      seenQuestionsRef.current = Array.isArray(stored) ? stored : [];
    } catch { seenQuestionsRef.current = []; }
  }, []);

  const saveSeenQuestion = (question) => {
    if (!question) return;
    const key = getSeenQuestionsKey();
    const seen = seenQuestionsRef.current;
    if (!seen.includes(question)) {
      seen.push(question);
      if (seen.length > 500) seen.splice(0, seen.length - 500);
      seenQuestionsRef.current = [...seen];
      localStorage.setItem(key, JSON.stringify(seen));
    }
  };

  // Premium Theme Tokens (Synced with RandomQuiz)
  const t = isLight ? {
    pageBg: '#E8E0F0',
    primary: '#9067C6',
    primaryLight: '#8D86C9',
    accent: '#D6CA98',
    mint: '#CEF9F2',
    steel: '#AFC1D6',
    glassBg: 'rgba(171, 146, 191, 0.12)',
    glassBorder: 'rgba(101, 90, 124, 0.22)',
    glassHoverBg: 'rgba(144, 103, 198, 0.1)',
    cardBg: 'rgba(175, 193, 214, 0.2)',
    cardBorder: 'rgba(101, 90, 124, 0.2)',
    cardInnerBg: 'rgba(206, 249, 242, 0.3)',
    textPrimary: '#242038',
    textSecondary: '#655A7C',
    textMuted: '#655A7C',
    textSubtle: '#8D86C9',
    btnPrimaryBg: '#9067C6',
    btnPrimaryHover: '#7B56B3',
    btnSecondaryBg: 'rgba(171, 146, 191, 0.18)',
    btnSecondaryBorder: 'rgba(101, 90, 124, 0.3)',
    btnSecondaryText: '#242038',
    micGradientFrom: '#9067C6',
    micGradientTo: '#655A7C',
    micGlow: 'rgba(171, 146, 191, 0.3)',
    badgeBg: 'rgba(144, 103, 198, 0.15)',
    badgeBorder: 'rgba(101, 90, 124, 0.25)',
    badgeText: '#655A7C',
    orb1: 'rgba(171, 146, 191, 0.4)',
    orb2: 'rgba(175, 193, 214, 0.45)',
    orb3: 'rgba(206, 249, 242, 0.5)',
    orb4: 'rgba(214, 202, 152, 0.3)',
    orb5: 'rgba(171, 146, 191, 0.2)',
    statBg: 'rgba(206, 249, 242, 0.35)',
    statLabel: '#655A7C',
    statValue: '#242038',
    statAccent: '#9067C6',
    diffBg: 'rgba(175, 193, 214, 0.3)',
    diffBorder: 'rgba(101, 90, 124, 0.2)',
    diffInactive: '#655A7C',
    separator: 'rgba(101, 90, 124, 0.15)',
    overlayBg: 'rgba(232, 224, 240, 0.96)',
    overlayCardBg: 'rgba(175, 193, 214, 0.25)',
    overlayBorder: 'rgba(101, 90, 124, 0.2)',
    overlayStatBg: 'rgba(206, 249, 242, 0.3)',
    transcriptBg: 'rgba(206, 249, 242, 0.3)',
    transcriptBorder: 'rgba(101, 90, 124, 0.15)',
    transcriptText: '#242038',
    exportBg: 'rgba(101, 90, 124, 0.05)',
    exportBorder: 'rgba(101, 90, 124, 0.15)',
    exportText: '#242038',
    micShadow: 'rgba(144, 103, 198, 0.25)',
    cardInnerBg: 'rgba(101, 90, 124, 0.05)',
    searchBg: 'rgba(101, 90, 124, 0.08)',
    searchText: '#242038',
    searchPlaceholder: '#655A7C',
  } : {
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
    separator: 'rgba(255, 255, 255, 0.05)',
    overlayBg: 'rgba(24, 16, 34, 0.9)',
    overlayCardBg: 'rgba(147, 76, 240, 0.05)',
    overlayBorder: 'rgba(255, 255, 255, 0.1)',
    overlayStatBg: 'rgba(24, 16, 34, 0.3)',
    transcriptBg: 'rgba(24, 16, 34, 0.3)',
    transcriptBorder: 'rgba(255, 255, 255, 0.1)',
    transcriptText: '#ffffff',
    exportText: '#ffffff',
    micShadow: 'rgba(147, 76, 240, 0.3)',
    cardInnerBg: 'rgba(24, 16, 34, 0.3)',
    searchBg: 'rgba(24, 16, 34, 0.5)',
    searchText: '#ffffff',
    searchPlaceholder: '#94A3B8',
  };

  const getAuthToken = () => localStorage.getItem("token") || localStorage.getItem("authToken");

  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2-minute limit

    const config = {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
      signal: controller.signal
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (response.status === 401) throw new Error("Authentication failed");
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try { const d = await response.json(); if (d?.message) errorMsg = d.message; } catch { }
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const updateURL = (domain, category, subCategory, topic) => {
    const p = ["inquizzo", "Quiz"];
    if (domain) p.push(encodeURIComponent(domain));
    if (category) p.push(encodeURIComponent(category));
    if (subCategory) p.push(encodeURIComponent(subCategory));
    if (topic) p.push(encodeURIComponent(topic));
    window.history.pushState({}, "", "/" + p.join("/"));
  };

  const parseCurrentURL = () => {
    if (typeof window === "undefined") return;
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "Quiz") {
      const domain = decodeURIComponent(parts[1]);
      const category = parts[2] ? decodeURIComponent(parts[2]) : null;
      const subCategory = parts[3] ? decodeURIComponent(parts[3]) : null;
      const topic = parts[4] ? decodeURIComponent(parts[4]) : null;
      if (QUIZ_STRUCTURE[domain]) {
        setSelectedDomain(domain);
        if (category && QUIZ_STRUCTURE[domain].categories[category]) {
          setSelectedCategory(category); setCurrentView("subCategories");
          if (subCategory && QUIZ_STRUCTURE[domain].categories[category].subCategories[subCategory]) {
            setSelectedSubCategory(subCategory); setCurrentView("topics");
            if (topic && QUIZ_STRUCTURE[domain].categories[category].subCategories[subCategory].topics[topic]) {
              setSelectedTopic(topic); setCurrentView("quiz"); fetchQuestion(domain, category, subCategory, topic);
            }
          }
        } else if (category) setCurrentView("categories");
      }
    }
  };

  useEffect(() => {
    parseCurrentURL();
    setParticles([...Array(20)].map(() => ({ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, delay: `${Math.random() * 5}s` })));
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setIsBrowserSupported(false);
    // Check for existing session to resume
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        if (session && session.quiz_id && session.quiz_id !== 'random' && Array.isArray(session.questions) && session.questions.length > 0 && session.current_index > 0 && session.current_index < SESSION_LENGTH) {
          if (!hasRestoredRef.current) {
            hasRestoredRef.current = true;
            const pct = Math.round((session.current_index / SESSION_LENGTH) * 100);
            toast(
              `You have an incomplete quiz (${pct}% completed). Would you like to resume or start a new session?`,
              {
                duration: 15000,
                action: {
                  label: 'Resume',
                  onClick: () => restoreSession(session),
                },
                cancel: {
                  label: 'New Session',
                  onClick: () => {
                    localStorage.removeItem(STORAGE_KEY);
                  },
                },
              }
            );
          }
        }
      }
    } catch (e) {
      console.warn('Failed to check saved session:', e);
    }
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, []);

  // ── Session Persistence Helpers ────────────────────────────
  const getQuizId = () => [selectedDomain, selectedCategory, selectedSubCategory, selectedTopic].filter(Boolean).join(':');

  const saveSession = (overrides = {}) => {
    try {
      const sessionData = {
        quiz_id: overrides.quiz_id || getQuizId(),
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
        // Domain selection context for restoration
        domain: selectedDomain,
        category: selectedCategory,
        subCategory: selectedSubCategory,
        topic: selectedTopic,
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

    // Restore domain selection context
    if (session.domain) setSelectedDomain(session.domain);
    if (session.category) setSelectedCategory(session.category);
    if (session.subCategory) setSelectedSubCategory(session.subCategory);
    if (session.topic) setSelectedTopic(session.topic);
    setCurrentView('quiz');

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

  useEffect(() => {
    if (currentView === "quiz" && timerActive && timer > 0 && !showResult) {
      const interval = setInterval(() => { setTimer((prev) => { if (prev <= 1) { handleTimeout(); return 0; } return prev - 1; }); }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentView, timerActive, timer, showResult]);

  useEffect(() => {
    const loadVoices = () => { const v = window.speechSynthesis.getVoices(); if (v.length > 0) voicesRef.current = v; };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const resetToHome = async () => {
    await deleteActiveSession();
    isTransitioningRef.current = true;
    stopListening(true);
    setCurrentView("domains"); setSelectedDomain(null); setSelectedCategory(null);
    setSelectedSubCategory(null); setSelectedTopic(null); setScore(0);
    setQuestionsAnswered(0); setCurrentQuestion(""); setTranscript("");
    setFeedback(""); setShowResult(false); setTimer(30); setTimerActive(false); setError(""); setIsTimeout(false);
    sessionIdRef.current = null;
    setSessionQCount(0); setSessionScore(0); setShowSessionEnd(false); setChatHistory([]);
    updateURL(null, null, null, null);
  };

  const handleDomainSelect = (k) => { setSelectedDomain(k); setCurrentView("categories"); updateURL(k, null, null, null); };
  const handleCategorySelect = (k) => { setSelectedCategory(k); setCurrentView("subCategories"); updateURL(selectedDomain, k, null, null); };
  const handleSubCategorySelect = (k) => { setSelectedSubCategory(k); setCurrentView("topics"); updateURL(selectedDomain, selectedCategory, k, null); };
  const handleTopicSelect = async (k) => { setSelectedTopic(k); setCurrentView("quiz"); updateURL(selectedDomain, selectedCategory, selectedSubCategory, k); await fetchQuestion(selectedDomain, selectedCategory, selectedSubCategory, k); };

  const fetchQuestion = async (domain, category, subCategory, topic, diffOverride = null) => {
    setIsLoading(true); setError("");
    const validLevels = ["easy", "medium", "hard"];
    const actualDifficulty = typeof diffOverride === "string" && validLevels.includes(diffOverride) ? diffOverride : selectedDifficulty;
    if (!sessionIdRef.current) sessionIdRef.current = crypto.randomUUID();
    try {
      const data = await makeAuthenticatedRequest("/api/inquizzo/ask", {
        method: "POST",
        body: JSON.stringify({
          topic,
          subject: domain,
          category,
          subCategory,
          seenQuestions: seenQuestionsRef.current.slice(-50),
          difficulty: actualDifficulty
        })
      });

      // Simple retry loop (max 3)
      let currentData = data;
      let retryCount = 0;
      while (seenQuestionsRef.current.includes(currentData?.question) && retryCount < 3) {
        console.warn(`🔄 AI gave a duplicate question (Attempt ${retryCount + 1}). Retrying...`);
        retryCount++;
        currentData = await makeAuthenticatedRequest("/api/inquizzo/ask", {
          method: "POST",
          body: JSON.stringify({
            topic,
            subject: domain,
            category,
            subCategory,
            seenQuestions: seenQuestionsRef.current.slice(-50),
            difficulty: actualDifficulty
          })
        });
      }

      if (currentData && currentData.question) {
        setCurrentQuestion(currentData.question); setCorrectAnswer(currentData.answer);
        currentQuestionRef.current = { question: currentData.question, answer: currentData.answer };
        saveSeenQuestion(currentData.question);
        // Track question for session persistence
        allQuestionsRef.current = [...allQuestionsRef.current, { question: currentData.question, answer: currentData.answer }];
        setTimer(30); setTimerActive(false); setTranscript(""); setFeedback(""); setShowResult(false); setIsTimeout(false);
        questionStartTimeRef.current = Date.now();
        // Auto-save session after fetching a new question
        saveSession({ questions: allQuestionsRef.current });
      }
    } catch (err) {
      console.warn("API failed or timed out. Initiating fallback...", err);
      try {
        const response = await fetch(`/fallback_${actualDifficulty}.json`);
        if (!response.ok) throw new Error("Failed to load fallback JSON");
        const fallbackQuestions = await response.json();

        // 1. Try to filter by domain/topic strictly, and exclude seen
        let unseen = fallbackQuestions.filter(q =>
          !seenQuestionsRef.current.includes(q.question) &&
          q.domain.toLowerCase() === domain.toLowerCase()
        );

        // 2. If no domain match, just get random unseen of this difficulty
        if (unseen.length === 0) {
          unseen = fallbackQuestions.filter(q => !seenQuestionsRef.current.includes(q.question));
        }

        const pool = unseen.length > 0 ? unseen : fallbackQuestions;
        const randomQ = pool[Math.floor(Math.random() * pool.length)];

        setError("Connection issue. Using offline question bank.");
        setCurrentQuestion(randomQ.question);
        setCorrectAnswer(randomQ.answer);
        currentQuestionRef.current = { question: randomQ.question, answer: randomQ.answer };

        saveSeenQuestion(randomQ.question);
        setTimer(30); setTimerActive(false); setTranscript(""); setFeedback(""); setShowResult(false);
        questionStartTimeRef.current = Date.now();
      } catch (fallbackErr) {
        console.error("Fallback failed:", fallbackErr);
        setError("Critical Error: Unable to load any questions.");
        setCurrentQuestion("What represents the fundamental unit of life?");
        setCorrectAnswer("The Cell");
        currentQuestionRef.current = { question: "What represents the fundamental unit of life?", answer: "The Cell" };
      }
    }
    finally { setIsLoading(false); }
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Speech Recognition not supported. Please use Chrome."); setIsBrowserSupported(false); return; }
    if (!isListening) {
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch { } }
      isTransitioningRef.current = false;
      setTranscript(""); transcriptRef.current = ""; setError(""); setTimer(30); setTimerActive(true);
      setIsManualStop(false);
      let intentionalStop = false; let silenceTimer;
      const startSilenceTimer = (timeoutMs = 31000) => {
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          isManualStopRef.current = false;
          recognition.stop();
        }, timeoutMs);
      };
      const recognition = new SR();
      recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US"; recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        if (recognitionRef.current !== recognition) return;
        setIsListening(true);
        startSilenceTimer(31000); // Initial durability
      };
      recognition.onresult = (event) => {
        if (recognitionRef.current !== recognition) return;
        startSilenceTimer(3000); // 3s delay after speech detection
        let finalT = ""; let interimT = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) finalT += event.results[i][0].transcript; else interimT += event.results[i][0].transcript; }
        if (finalT) { const t = (transcriptRef.current + " " + finalT).trim(); transcriptRef.current = t; setTranscript(t); }
        else if (interimT) setTranscript((transcriptRef.current + " " + interimT).trim());
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
          submitAnswer(transcriptRef.current);
        } else if (!isTransitioningRef.current && timerActive && timer > 0) {
          // AUTO-RESTART
          try {
            recognition.start();
          } catch (e) {
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
        if (event.error === "no-speech" || event.error === "aborted") return;
        intentionalStop = true; setIsListening(false); recognitionRef.current = null; setError(`Mic Error: ${event.error}. Try refreshing.`);
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
      } catch { }
      recognitionRef.current = null;
    }
  };

  const saveAttempt = async ({ question, userAnswer, correctAnswer, isCorrect, score, timeTaken }) => {
    try {
      const token = getAuthToken();
      if (!token || !sessionIdRef.current) return;
      await fetch("/api/inquizzo/attempt", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ moduleId: "inQuizzo", gameType: "voice", sessionId: sessionIdRef.current, question, userAnswer, correctAnswer, isCorrect, score, difficulty: selectedDifficulty, timeTaken }) });

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
          domain: selectedDomain,
          category: selectedCategory,
          subCategory: selectedSubCategory,
          topic: selectedTopic,
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

        // Restore Domain/Category structure
        setSelectedDomain(s.config?.domain);
        setSelectedCategory(s.config?.category);
        setSelectedSubCategory(s.config?.subCategory);
        setSelectedTopic(s.config?.topic);
        setSelectedDifficulty(s.config?.difficulty || "medium");
        setChatHistory(s.chatHistory || []);

        if (s.questionsAnswered >= SESSION_LENGTH) {
          setShowSessionEnd(true);
          setCurrentView("quiz");
          return true;
        }

        if (s.config?.topic) {
          setCurrentView("quiz");
          fetchQuestion(s.config.domain, s.config.category, s.config.subCategory, s.config.topic, s.config.difficulty);
          return true;
        }
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

  const submitAnswer = async (textOverride = null, isTimeoutCall = false) => {
    const finalAnswer = textOverride || transcript;
    if (!finalAnswer.trim()) { setError("Please provide an answer."); return; }
    const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    setIsAnswering(true); setTimerActive(false); setIsManualStop(false);
    try {
      const data = await makeAuthenticatedRequest("/api/inquizzo/evaluate", { method: "POST", body: JSON.stringify({ question: currentQuestionRef.current.question, userAnswer: finalAnswer, correctAnswer: currentQuestionRef.current.answer, timeTaken }) });
      setFeedback(data.result.explanation || data.result.feedback); setLastGainedScore(data.result.score || 0); setShowResult(true);
      const gained = data.result.score || 0;
      setLastIsCorrect(!!data.result.isCorrect);
      setIsTimeout(isTimeoutCall);
      if (data.result.isCorrect) {
        setScore((p) => p + gained);
        setSessionScore((p) => p + gained);
        setCorrectCount((p) => p + 1);
      }
      await saveAttempt({ question: currentQuestionRef.current.question, userAnswer: finalAnswer, correctAnswer: data.result.correctAnswer || currentQuestionRef.current.answer, isCorrect: data.result.isCorrect || false, score: gained, timeTaken });
      const newCount = sessionQCount + 1; setSessionQCount(newCount); setQuestionsAnswered((p) => p + 1);
      const resultData = { question: currentQuestionRef.current.question, userAnswer: finalAnswer, correctAnswer: data.result.correctAnswer, isCorrect: data.result.isCorrect, feedback: data.result.explanation || data.result.feedback, score: gained };
      setChatHistory((p) => [...p, resultData]);

      // Auto-save session after answering
      saveSession({
        current_index: newCount,
        answers_map: [...chatHistory, resultData],
        score: score + (gained > 0 ? gained : 0),
        correct_count: correctCount + (data.result.isCorrect ? 1 : 0),
        questions_answered: questionsAnswered + 1,
        session_score: sessionScore + (gained > 0 ? gained : 0),
      });

      if (newCount >= SESSION_LENGTH) {
        setShowSessionEnd(true);
        clearSession();
        stopListening(true); // CRITICAL: Stop mic immediately when session ends
        await deleteActiveSession();
      }
    } catch { setError("Failed to check answer. Please try again."); }
    finally { setIsAnswering(false); }
  };

  const handleTimeout = async () => {
    stopListening(true); // Ensure mic is killed immediately
    setTranscript("Time's up!");
    setIsTimeout(true);
    setLastIsCorrect(false);
    setFeedback("Time's up! The correct answer is: " + currentQuestionRef.current.answer);
    setShowResult(true);
    setTimerActive(false);
    const newCount = sessionQCount + 1;
    setSessionQCount(newCount);
    setQuestionsAnswered((p) => p + 1);
    setIsManualStop(false);

    // Auto-save session after timeout
    const timeoutResult = { question: currentQuestionRef.current.question, userAnswer: '(Timeout)', correctAnswer: currentQuestionRef.current.answer, isCorrect: false, score: 0 };
    saveSession({
      current_index: newCount,
      answers_map: [...chatHistory, timeoutResult],
      questions_answered: questionsAnswered + 1,
    });

    if (newCount >= SESSION_LENGTH) {
      setShowSessionEnd(true);
      clearSession();
      stopListening(true); // CRITICAL: Stop mic on timeout session end
      deleteActiveSession();
    }
    saveAttempt({
      question: currentQuestionRef.current.question,
      userAnswer: "(Timeout)",
      correctAnswer: currentQuestionRef.current.answer,
      isCorrect: false,
      score: 0,
      timeTaken: 30
    });
  };
  const nextQuestion = (diffOverride = null) => {
    isTransitioningRef.current = true;
    const v = ["easy", "medium", "hard"];
    const a = typeof diffOverride === "string" && v.includes(diffOverride) ? diffOverride : null;
    // Kill mic before fetching new question
    stopListening(true);
    setTimer(30); setTimerActive(false); setTranscript(""); setFeedback(""); setShowResult(false); setIsTimeout(false); setIsManualStop(false);
    fetchQuestion(selectedDomain, selectedCategory, selectedSubCategory, selectedTopic, a);
  };
  const startNewSession = () => {
    clearSession();
    allQuestionsRef.current = [];
    sessionIdRef.current = crypto.randomUUID(); setSessionQCount(0); setSessionScore(0); setShowSessionEnd(false); setScore(0); setCorrectCount(0); setChatHistory([]); setQuestionsAnswered(0);
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch { } recognitionRef.current = null; setIsListening(false); }
    nextQuestion();
    setIsManualStop(false);
  };

  const downloadCSV = () => {
    let csv = "Question,Your Answer,Correct Answer,Result,Score\n";
    chatHistory.forEach((e) => {
      csv += `"${e.question}","${e.userAnswer}","${e.correctAnswer}","${e.isCorrect ? "Correct" : "Incorrect"}",${e.score}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `quiz_results_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
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

  const downloadHistory = () => {
    const date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
    let content = `Username: ${localStorage.getItem("username") || "Unknown"}\nScore: ${score}\nTime: ${date}\n\n`;
    chatHistory.forEach((e, i) => { content += `Q${i + 1}:\nQuestion: ${e.question}\nYour Answer: ${e.userAnswer}\nCorrect Answer: ${e.correctAnswer}\n`; content += e.isCorrect === true ? `Result: ✅ Correct\n\n` : e.isCorrect === false ? `Result: ❌ Incorrect\nExplanation: ${e.feedback}\n\n` : `Result: ⚠️ Skipped\nNote: ${e.feedback}\n\n`; });
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `quiz_results_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
  };

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
        utterance.voice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Neural"))) ||
          voices.find((v) => v.lang.startsWith("en")) || voices[0];
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // ─── RENDER HELPERS ────────────────────────────────────────────────────────
  const isCorrectResult = feedback && (feedback.toLowerCase().includes("correct") || feedback.includes("✅"));

  const SelectionCard = ({ onClick, idx, height = "240px", borderColor = t.cardBorder, children }) => (
    <motion.div
      key={idx} initial={{ opacity: 0, y: 20 }} animate="initial" transition={{ delay: idx * 0.05 }}
      onClick={onClick} data-cursor="card" whileHover="hover" variants={CARD_HOVER_VARIANTS}
      className="group relative rounded-3xl overflow-hidden cursor-none"
      style={{
        minHeight: height,
        height: 'auto',
        border: `1px solid ${borderColor}`,
        background: isLight ? `linear-gradient(135deg, ${t.glassBg}, ${t.cardBg})` : `linear-gradient(135deg, rgba(147, 76, 240, 0.05), rgba(24, 16, 34, 0.3))`,
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className={cn("absolute top-0 inset-x-0 h-[2px] opacity-20 group-hover:opacity-70 transition-opacity duration-300 bg-gradient-to-r", isLight ? "from-[#9067C6] to-[#8D86C9]" : "from-[#934cf0] to-[#4338ca]")} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(500px at 50% 0%, ${isLight ? t.orb1 : t.micGlow}, transparent)` }} />
      {children}
    </motion.div>
  );

  const renderStaticBackButton = () => {
    if (currentView === "quiz") return null;

    let onClick = () => router.push('/inquizzo');
    let label = "Back to Dashboard";

    if (currentView === "categories") {
      onClick = () => { setCurrentView("domains"); setSelectedDomain(null); updateURL(null, null, null, null); };
      label = "Back to Domains";
    } else if (currentView === "subCategories") {
      onClick = () => { setCurrentView("categories"); setSelectedCategory(null); updateURL(selectedDomain, null, null, null); };
      label = "Back to Categories";
    } else if (currentView === "topics") {
      onClick = () => { setCurrentView("subCategories"); setSelectedSubCategory(null); updateURL(selectedDomain, selectedCategory, null, null); };
      label = "Back to Sub-Categories";
    }

    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-8 animate-fadeIn">
        <button
          onClick={onClick}
          className="flex items-center gap-2 text-sm transition-colors group"
          style={{ color: t.textMuted }}
        >
          <AnimeIcon Icon={ArrowLeft} className="w-4 h-4" animation="slide" selfHover={true} />
          {label}
        </button>
      </div>
    );
  };

  // ─── RENDER: DOMAIN SELECTION ──────────────────────────────────────────────
  const renderDomainSelection = () => (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 animate-fadeIn mt-4 md:mt-8 text-left">
      <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between md:gap-6 mb-8 md:mb-12">
        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: t.glassBg, border: `1px solid ${t.glassBorder}` }}>
            <AnimeIcon Icon={Zap} className="w-3 h-3" style={{ color: t.primary }} animation="jump" selfHover={true} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isLight ? t.textSecondary : 'white' }}>Discovery</span>
          </motion.div>
          <h2 className="font-syne text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight" style={{ color: t.textPrimary }}>Choose Your <span className="iq-gradient-text" style={{ backgroundImage: `linear-gradient(to right, ${t.primary}, ${t.primaryLight})` }}>Domain</span></h2>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-full" style={{ background: t.searchBg, border: `1px solid ${t.glassBorder}`, backdropFilter: 'blur(20px)' }}>
          <Search className="w-4 h-4 ml-2" style={{ color: t.searchPlaceholder }} />
          <input className="bg-transparent border-none outline-none text-sm w-40" style={{ color: t.searchText }} placeholder="Search domains..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8 text-left">
        {Object.entries(QUIZ_STRUCTURE).filter(([key]) => key.toLowerCase().includes(searchQuery.toLowerCase())).map(([key, domain], idx) => {
          const IconComp = DOMAIN_ICON_MAP[key.toLowerCase()] || Brain;
          const anim = DOMAIN_ANIM[key.toLowerCase()] || "pulse";
          return (
            <SelectionCard key={key} idx={idx} onClick={() => handleDomainSelect(key)} gradient={domain.gradient}>
              <div className="relative z-10 p-5 md:p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-6" style={{ background: t.cardInnerBg, borderColor: t.glassBorder }}>
                    <AnimeIcon Icon={IconComp} className="w-6 h-6" style={{ color: t.primary }} animation={anim} hoverParent={true} />
                  </div>
                  <h3 className="font-syne text-2xl font-bold transition-colors capitalize group-hover:text-pink-500" style={{ color: t.textPrimary }}>{key}</h3>
                  <p className="text-sm mt-2 line-clamp-2" style={{ color: t.textMuted }}>Master the foundational principles with adaptive voice testing sessions.</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: t.textMuted }}>Explore Categories</span>
                  <div className="w-8 h-8 rounded-full border flex items-center justify-center group-hover:translate-x-1 transition-transform" style={{ background: t.cardInnerBg, borderColor: t.glassBorder }}>
                    <AnimeIcon Icon={ChevronRight} className="w-4 h-4" style={{ color: t.textPrimary }} animation="slide" hoverParent={true} />
                  </div>
                </div>
              </div>
            </SelectionCard>
          );
        })}
      </div>
    </div>
  );

  // ─── RENDER: CATEGORY SELECTION ────────────────────────────────────────────
  const renderCategorySelection = () => {
    const domain = QUIZ_STRUCTURE[selectedDomain];
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 animate-fadeIn mt-4 md:mt-8 text-left">
        <div className="mb-12">
          <h2 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: t.textPrimary }}>{domain.name} <span className="iq-gradient-text" style={{ backgroundImage: `linear-gradient(to right, ${t.primary}, ${t.primaryLight})` }}>Pathways</span></h2>
          <p className="text-lg max-w-2xl mt-2" style={{ color: t.textMuted }}>Select a specialty to begin your neural synchronization.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
          {Object.entries(domain.categories).map(([key, category], idx) => {
            const IconComp = CATEGORY_ICON_MAP[key.toLowerCase()] || Brain;
            return (
              <SelectionCard key={key} idx={idx} onClick={() => handleCategorySelect(key)}>
                <div className="relative z-10 p-6 md:p-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 overflow-hidden" style={{ background: t.cardInnerBg, borderColor: t.glassBorder }}>
                      <AnimeIcon Icon={IconComp} className="w-7 h-7" style={{ color: t.primary }} animation={DOMAIN_ANIM[key.toLowerCase()] || "pulse"} hoverParent={true} />
                    </div>
                    <h3 className="font-syne text-2xl font-bold transition-colors group-hover:text-pink-500" style={{ color: t.textPrimary }}>{category.name}</h3>
                    <p className="text-sm mt-2 line-clamp-2" style={{ color: t.textMuted }}>{category.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="border uppercase text-[10px] tracking-widest font-bold" style={{ background: `${t.primary}1A`, color: isLight ? t.primary : 'white', borderColor: `${t.primary}33` }}>{Object.keys(category.subCategories).length} Collections</Badge>
                    <div className="w-8 h-8 rounded-full border flex items-center justify-center group-hover:translate-x-1 transition-transform" style={{ background: t.cardInnerBg, borderColor: t.glassBorder }}>
                      <AnimeIcon Icon={ChevronRight} className="w-4 h-4" style={{ color: t.textPrimary }} animation="slide" hoverParent={true} />
                    </div>
                  </div>
                </div>
              </SelectionCard>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── RENDER: SUBCATEGORY SELECTION ─────────────────────────────────────────
  const renderSubCategorySelection = () => {
    const category = QUIZ_STRUCTURE[selectedDomain].categories[selectedCategory];
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 animate-fadeIn mt-4 md:mt-8 text-left">
        <div className="mb-12">
          <h2 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: t.textPrimary }}>{category.name} <span className="iq-gradient-text" style={{ backgroundImage: `linear-gradient(to right, ${t.primary}, ${t.primaryLight})` }}>Collections</span></h2>
          <p className="text-lg mt-2" style={{ color: t.textMuted }}>Select a specific knowledge track.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
          {Object.entries(category.subCategories).map(([key, subCat], idx) => (
            <SelectionCard key={key} idx={idx} onClick={() => handleSubCategorySelect(key)}>
              <div className="relative z-10 p-6 md:p-10 flex flex-col h-full justify-between">
                <h3 className="font-syne text-2xl font-bold transition-colors group-hover:text-pink-500" style={{ color: t.textPrimary }}>{subCat.name}</h3>
                <div className="mt-8 flex items-center justify-between">
                  <Badge variant="secondary" className="border uppercase text-[10px] tracking-widest font-bold" style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', color: t.textMuted, borderColor: t.glassBorder }}>{Object.keys(subCat.topics).length} Practice Topics</Badge>
                  <div className="w-8 h-8 rounded-full border flex items-center justify-center group-hover:translate-x-1 transition-transform" style={{ background: t.cardInnerBg, borderColor: t.glassBorder }}>
                    <AnimeIcon Icon={ChevronRight} className="w-4 h-4" style={{ color: t.textPrimary }} animation="slide" hoverParent={true} />
                  </div>
                </div>
              </div>
            </SelectionCard>
          ))}
        </div>
      </div>
    );
  };

  // ─── RENDER: TOPIC SELECTION ───────────────────────────────────────────────
  const renderTopicSelection = () => {
    const subCat = QUIZ_STRUCTURE[selectedDomain].categories[selectedCategory].subCategories[selectedSubCategory];
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 animate-fadeIn mt-4 md:mt-8 text-left">
        <div className="mb-12">
          <h2 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: t.textPrimary }}>{subCat.name} <span className="iq-gradient-text" style={{ backgroundImage: `linear-gradient(to right, ${t.primary}, ${t.primaryLight})` }}>Topics</span></h2>
          <p className="text-lg mt-2" style={{ color: t.textMuted }}>Ready to begin your mastery challenge.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-8">
          {Object.entries(subCat.topics).map(([key, topic], idx) => (
            <SelectionCard key={key} idx={idx} height="auto" borderColor={isLight ? t.glassBorder : "rgba(147, 76, 240, 0.2)"} onClick={() => handleTopicSelect(key)}>
              <div className="relative z-10 p-6">
                <div className="w-12 h-12 rounded-xl border flex items-center justify-center mb-4 transition-colors group-hover:bg-pink-500/10" style={{ background: t.cardInnerBg, borderColor: t.glassBorder }}>
                  <AnimeIcon Icon={Play} className="w-5 h-5" style={{ color: t.primary }} animation="jump" hoverParent={true} />
                </div>
                <h3 className="font-syne text-lg font-bold leading-tight transition-colors group-hover:text-pink-500" style={{ color: t.textPrimary }}>{key}</h3>
                <p className="text-[10px] mt-4 uppercase tracking-[0.2em] font-bold" style={{ color: t.textMuted }}>Launch Topic</p>
              </div>
            </SelectionCard>
          ))}
        </div>
      </div>
    );
  };

  // ─── RENDER: QUIZ INTERFACE ────────────────────────────────────────────────
  const renderQuizInterface = () => {
    if (showSessionEnd) return null; // Early return to prevent quiz showing behind overlay
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 animate-fadeIn text-left">
        {/* ── Minimal Sub-Header ─────────────────────── */}
        <div className="relative z-10 flex items-center justify-between pt-2 md:pt-4 w-full mb-4 md:mb-6">
          <div className="flex-1">
            <button
              onClick={() => { setCurrentView("topics"); setFeedback(""); setShowResult(false); updateURL(selectedDomain, selectedCategory, selectedSubCategory, null); }}
              className="flex items-center gap-2 group transition-colors"
              style={{ color: t.textMuted }}
              data-cursor="button"
            >
              <AnimeIcon Icon={ArrowLeft} className="w-5 h-5" animation="slide" selfHover={true} />
              <span className="font-medium text-sm">Back</span>
            </button>
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-center" style={{ color: t.textPrimary }}>
            {selectedTopic ? QUIZ_STRUCTURE[selectedDomain].categories[selectedCategory].subCategories[selectedSubCategory].topics[selectedTopic].name : "Practice Session"}
          </h1>
          <div className="flex-1" />
        </div>

        {/* ── Main Content: 12-col grid ─────────────── */}
        <main className="relative z-10 flex-grow flex flex-col items-center py-1 md:py-2">
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
                <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: t.badgeBg, border: `1px solid ${t.badgeBorder}` }}>
                  <AnimeIcon Icon={Zap} className="w-3 h-3" style={{ color: t.badgeText }} animation="jump" selfHover={true} />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: t.badgeText }}>
                    Question {questionsAnswered + 1}/{SESSION_LENGTH}
                  </span>
                </div>

                {!isLoading && currentQuestion && (
                  <button
                    data-cursor="button" onClick={speakQuestion}
                    className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group/btn"
                    style={{ background: t.cardInnerBg, border: `1px solid ${t.glassBorder}` }}
                  >
                    <Volume2 className="w-5 h-5 transition-colors" style={{ color: t.textMuted }} />
                  </button>
                )}

                <div className="max-w-2xl w-full">
                  <h2
                    className="font-syne font-semibold leading-tight mt-12 md:mt-10 transition-all duration-300"
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

                  {error && (
                    <div className="mt-8 mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex flex-col items-center gap-4">
                      <XCircle className="w-10 h-10 mb-2" />
                      <p className="font-medium text-sm">{error}</p>
                      <button onClick={() => fetchQuestion(selectedDomain, selectedCategory, selectedSubCategory, selectedTopic)} className="px-4 py-1.5 rounded-full border border-red-500/30 text-xs font-bold uppercase hover:bg-red-500/10 transition-all">Retry</button>
                    </div>
                  )}

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
                            onClick={() => submitAnswer(transcript)}
                            className="px-6 py-2 rounded-full bg-purple-600 text-sm font-bold uppercase hover:bg-purple-700 transition-all text-white shadow-lg shadow-purple-900/20"
                          >
                            Evaluate Now
                          </button>
                        </div>
                        <p className="text-xs opacity-50 italic">Paused. Continue speaking or submit for check.</p>
                      </div>
                    ) : (
                      <p className="text-[10px] md:text-sm font-medium tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
                        {isListening ? "Listening... speak your answer" :
                          (transcript.trim() && !showResult) ? "Voice answer ready" : "Tap to answer via voice"}
                      </p>
                    )}

                    {isListening && transcript && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-4 rounded-xl backdrop-blur-md text-base italic max-w-lg mx-auto leading-relaxed" style={{ background: t.transcriptBg, border: `1px solid ${t.transcriptBorder}`, color: t.transcriptText }}>
                        &ldquo;{transcript}&rdquo;
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ── Navigation Controls ── */}
              <div className="flex items-center gap-3 md:gap-4 max-w-md mx-auto w-full">
                <button
                  data-cursor="button"
                  onClick={() => nextQuestion()}
                  disabled={isLoading}
                  className="flex-1 py-3 md:py-4 rounded-xl font-bold transition-all active:scale-[0.98] text-sm md:text-base whitespace-nowrap"
                  style={{ background: t.btnSecondaryBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.btnSecondaryBorder}`, color: t.btnSecondaryText }}
                >
                  Skip Question
                </button>
                <button
                  data-cursor="button"
                  onClick={() => {
                    if (showResult) nextQuestion();
                    else if (isListening) stopListening();
                    else if (!isListening && transcript.trim() && isManualStop) submitAnswer(transcript);
                    else if (!isAnswering) startListening();
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

              {/* Feedback */}
              {showResult && feedback && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("p-5 md:p-8 rounded-xl md:rounded-2xl border shadow-2xl text-left relative overflow-hidden", isTimeout ? "border-amber-500/30 bg-amber-500/5" : lastIsCorrect ? (isLight ? "border-green-500/30 bg-green-50/50" : "border-green-500/30 bg-green-500/5") : (isLight ? "border-red-500/30 bg-red-50/50" : "border-red-500/30 bg-red-500/5"))}>
                  <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16" style={{ background: isTimeout ? 'rgba(245,158,11,0.1)' : lastIsCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center", isTimeout ? "bg-amber-500/20 text-amber-500" : lastIsCorrect ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500")} data-cursor="card">
                          {isTimeout
                            ? <AnimeIcon Icon={Clock} className="w-6 h-6 md:w-7 md:h-7" animation="wiggle" hoverParent={true} />
                            : lastIsCorrect
                              ? <AnimeIcon Icon={CheckCircle} className="w-6 h-6 md:w-7 md:h-7" animation="jump" hoverParent={true} />
                              : <AnimeIcon Icon={XCircle} className="w-6 h-6 md:w-7 md:h-7" animation="wiggle" hoverParent={true} />
                          }
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Answer</p>
                          <h4 className={cn("font-syne text-lg md:text-2xl font-bold", isTimeout ? "text-amber-500" : lastIsCorrect ? "text-green-500" : "text-red-500")}>
                            {isTimeout ? "Time's Up!" : lastIsCorrect ? "Right" : "Wrong"}
                          </h4>
                        </div>
                      </div>
                      {lastGainedScore > 0 && <Badge className="text-white px-4 py-1.5 rounded-full font-bold shadow-lg text-sm" style={{ backgroundColor: t.primary, border: 'none' }}>+{lastGainedScore} XP</Badge>}
                    </div>
                    {/* Real Answer (if wrong) */}
                    {!lastIsCorrect && (
                      <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-green-600 dark:text-green-400">Correct Answer</p>
                        <p className="text-sm md:text-base font-bold text-green-700 dark:text-green-300">{correctAnswer}</p>
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>Explanation</p>
                      <p className="text-sm md:text-lg leading-relaxed whitespace-pre-wrap" style={{ color: t.textPrimary, opacity: 0.9 }}>{feedback}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ════ RIGHT: Control Sidebar (4 cols) ════ */}
            <aside className="xl:col-span-4 flex flex-col gap-3 md:sticky md:top-28">
              {/* Quiz Controls */}
              <div className="rounded-xl p-4 flex flex-col gap-3 transition-colors duration-500" style={{ background: t.glassBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.glassBorder}` }}>
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2 text-sm md:text-base" style={{ color: t.textPrimary }}>
                    <AnimeIcon Icon={Zap} className="w-5 h-5" style={{ color: t.primary }} animation="jump" selfHover={true} /> Quiz Controls
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: t.textMuted }}>Difficulty</label>
                      <div className="flex p-1 rounded-lg" style={{ background: t.diffBg, border: `1px solid ${t.diffBorder}` }}>
                        {["easy", "medium", "hard"].map((level) => (
                          <button key={level} data-cursor="button" onClick={() => { setSelectedDifficulty(level); if (!isLoading) nextQuestion(level); }} className="flex-1 py-1.5 text-[10px] md:text-xs font-bold transition-all rounded-md capitalize" style={selectedDifficulty === level ? { backgroundColor: t.primary, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : { color: t.diffInactive }}>{level}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <hr style={{ borderColor: t.separator }} />
                {/* Export actions */}
                <div className="flex flex-col gap-2">
                  <button data-cursor="button" onClick={downloadPDF} className="flex items-center justify-between w-full p-2.5 rounded-lg group transition-all" style={{ background: t.exportBg, border: `1px solid ${t.exportBorder}` }}>
                    <div className="flex items-center gap-2 md:gap-3">
                      <AnimeIcon Icon={ArrowLeft} className="w-4 h-4 rotate-[270deg]" style={{ color: t.textMuted }} animation="slide" selfHover={true} />
                      <span className="text-xs md:text-sm font-medium" style={{ color: t.exportText }}>Export Results PDF</span>
                    </div>
                  </button>
                  <button data-cursor="button" onClick={downloadCSV} className="flex items-center justify-between w-full p-2.5 rounded-lg group transition-all" style={{ background: t.exportBg, border: `1px solid ${t.exportBorder}` }}>
                    <div className="flex items-center gap-2 md:gap-3">
                      <AnimeIcon Icon={ArrowLeft} className="w-4 h-4 rotate-[270deg]" style={{ color: t.textMuted }} animation="slide" selfHover={true} />
                      <span className="text-sm font-medium" style={{ color: t.exportText }}>Download CSV</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── Session Statistics Card ── */}
              <div className="rounded-xl p-4 transition-colors duration-500" style={{ background: t.glassBg, backdropFilter: 'blur(12px)', border: `1px solid ${t.glassBorder}` }}>
                <h4 className="font-bold mb-3 text-xs md:text-sm" style={{ color: t.textPrimary }}>Your Session</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: t.statBg }}>
                    <p className="text-[10px] font-bold uppercase" style={{ color: t.statLabel }}>Timer</p>
                    <p className={cn("text-lg md:text-xl font-bold tabular-nums font-display", timer <= 10 && isListening && "text-red-500")} style={!(timer <= 10 && isListening) ? { color: t.statValue } : undefined}>{isListening ? `0:${timer < 10 ? `0${timer}` : timer}` : "--:--"}</p>
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
                    <p className="text-lg md:text-xl font-bold font-display" style={{ color: t.statAccent }}>{questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 0}%</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  if (!mounted) return null;

  // ─── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div
      className={cn("relative min-h-screen font-dm cursor-none flex flex-col transition-colors duration-500 overflow-x-hidden", !isLight && "iq-mesh-bg")}
      style={isLight ? { backgroundColor: t.pageBg } : undefined}
    >
      {!isLight && <NoiseMesh />}
      <CursorAura />
      <Toaster richColors position="top-center" />

      {/* Decorative Orbs */}
      {isLight ? (
        <>
          <div className="absolute -top-24 -left-24 w-[500px] h-[500px] blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: '#AB92BF', opacity: 0.55 }} />
          <div className="absolute -bottom-16 -right-16 w-[450px] h-[450px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#AFC1D6', opacity: 0.6 }} />
          <div className="absolute top-[25%] right-[5%] w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#CEF9F2', opacity: 0.7 }} />
          <div className="absolute top-[55%] left-[8%] w-[350px] h-[350px] blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: '#D6CA98', opacity: 0.45 }} />
          <div className="absolute top-[10%] left-[45%] w-[300px] h-[300px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#655A7C', opacity: 0.35 }} />
        </>
      ) : (
        <>
          <div className="absolute -top-20 -left-20 w-[400px] h-[400px] blur-[80px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: t.orb1 }} />
          <div className="absolute bottom-10 right-10 w-[300px] h-[300px] blur-[80px] rounded-full pointer-events-none" style={{ backgroundColor: t.orb2 }} />
          <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] blur-[80px] rounded-full pointer-events-none" style={{ backgroundColor: t.orb3 }} />
        </>
      )}

      <Header DateValue="practice" onDateChange={() => { }} tempDate={new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} showDateFilter={false} />

      {/* Breadcrumb */}
      {(selectedDomain || selectedCategory || selectedSubCategory || selectedTopic) && currentView !== "quiz" && (
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-16">
          <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: t.textMuted }}>
            <span data-cursor="button" className="cursor-none transition-colors hover:text-pink-500" onClick={resetToHome}>InQuizzo</span>
            <ChevronRight className="w-3 h-3 opacity-30" />
            {selectedDomain && (
              <>
                <span data-cursor="button" className="cursor-none transition-colors hover:text-pink-500" style={{ color: !selectedCategory ? t.textPrimary : t.textMuted }} onClick={() => { setCurrentView("categories"); setSelectedCategory(null); setSelectedSubCategory(null); setSelectedTopic(null); updateURL(selectedDomain, null, null, null); }}>{selectedDomain}</span>
                {selectedCategory && (
                  <>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <span data-cursor="button" className="cursor-none transition-colors hover:text-pink-500" style={{ color: !selectedSubCategory ? t.textPrimary : t.textMuted }} onClick={() => { setCurrentView("subCategories"); setSelectedSubCategory(null); setSelectedTopic(null); updateURL(selectedDomain, selectedCategory, null, null); }}>{selectedCategory}</span>
                    {selectedSubCategory && (
                      <>
                        <ChevronRight className="w-3 h-3 opacity-30" />
                        <span data-cursor="button" className="cursor-none transition-colors hover:text-pink-500" style={{ color: !selectedTopic ? t.textPrimary : t.textMuted }} onClick={() => { setCurrentView("topics"); setSelectedTopic(null); updateURL(selectedDomain, selectedCategory, selectedSubCategory, null); }}>{selectedSubCategory}</span>
                        {selectedTopic && (
                          <>
                            <ChevronRight className="w-3 h-3 opacity-30" />
                            <span style={{ color: t.primary }}>{selectedTopic}</span>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <main className="relative z-10 flex flex-col items-center px-4 py-4 md:py-8 grow">
        {renderStaticBackButton()}
        {currentView === "domains" && renderDomainSelection()}
        {currentView === "categories" && renderCategorySelection()}
        {currentView === "subCategories" && renderSubCategorySelection()}
        {currentView === "topics" && renderTopicSelection()}
        {currentView === "quiz" && renderQuizInterface()}

        {currentView === "quiz" && !isBrowserSupported && (
          <div className="text-center mt-8">
            <div className="glass-card p-6 rounded-2xl border border-yellow-500/30 bg-yellow-900/10 max-w-md mx-auto">
              <p className="text-yellow-300 text-lg">⚠️ Speech Recognition requires Chrome, Edge, or Safari</p>
            </div>
          </div>
        )}
      </main>

      {/* Session End Overlay */}
      {showSessionEnd && (
        <div className="fixed inset-0 z-[100] backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden" style={{ background: t.overlayBg }}>
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] blur-[120px] opacity-20 rounded-full" style={{ background: `linear-gradient(to right, ${t.primary}, ${t.primaryLight})` }} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-xl relative">
            <div className="relative glass-card rounded-[40px] p-5 md:p-8 overflow-hidden text-center shadow-2xl" style={{ background: t.overlayCardBg, border: `1px solid ${t.overlayBorder}`, backdropFilter: 'blur(24px)' }}>
              <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: isLight ? `linear-gradient(to right, ${t.primary}, ${t.primaryLight})` : `linear-gradient(to right, #934cf0, #4338ca)` }} />
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 overflow-hidden" style={{ boxShadow: '0 0 30px rgba(255, 193, 7, 0.7), 0 0 60px rgba(255, 193, 7, 0.5), 0 0 100px rgba(255, 193, 7, 0.35), 0 0 150px rgba(255, 193, 7, 0.2), 0 0 200px rgba(147, 76, 240, 0.25)' }}>
                <img src="/Session complete badge.png" alt="Session Complete Badge" style={{ width: '160%', height: '113%', objectFit: 'cover', transform: 'scale(1.2)' }} />
              </div>
              <h3 className="font-syne text-xl sm:text-2xl md:text-4xl font-extrabold mb-2 md:mb-3 uppercase" style={{ color: t.textPrimary }}>SESSION COMPLETE</h3>
              <p className="text-xs md:text-base mb-4 md:mb-6 uppercase tracking-widest" style={{ color: t.textMuted }}>Completed {SESSION_LENGTH} questions</p>
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="p-3 md:p-5 rounded-xl md:rounded-2xl border" style={{ background: t.overlayStatBg, borderColor: t.overlayBorder }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: t.statLabel }}>Final Score</p>
                  <p className="font-display text-xl sm:text-2xl md:text-4xl font-bold" style={{ color: t.textPrimary }}>{sessionScore}</p>
                </div>
                <div className="p-3 md:p-5 rounded-xl md:rounded-2xl border" style={{ background: t.overlayStatBg, borderColor: t.overlayBorder }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: t.statLabel }}>Total XP</p>
                  <p className="font-display text-xl sm:text-2xl md:text-4xl font-bold" style={{ color: t.primary }}>{score}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 md:gap-4">
                <button onClick={startNewSession} className="h-11 md:h-14 rounded-xl md:rounded-2xl text-white font-bold text-sm md:text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ backgroundColor: t.primary, boxShadow: `0 10px 30px ${t.micShadow}`, border: 'none' }}>START NEW SESSION</button>
                <button onClick={() => { setCurrentView("topics"); setShowSessionEnd(false); setFeedback(""); }} className="h-11 md:h-14 rounded-xl md:rounded-2xl border font-bold text-sm md:text-base transition-all" style={{ background: t.btnSecondaryBg, borderColor: t.btnSecondaryBorder, color: t.btnSecondaryText }}>BACK TO DASHBOARD</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default QuizDomainSelection;
