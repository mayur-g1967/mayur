import { useState, useEffect, useRef } from "react";
import { Mic, Video, Square, Play, CheckCircle, Loader2, Eye, Activity, Zap, TrendingUp, Timer } from "lucide-react";
// Porcupine removed to use native SpeechRecognition commands
import { startMediaPipeStream } from "./MediaPipeAnalyzer";
import { AudioAnalyzer } from "./AudioAnalyzer";
import { getAuthToken } from "@/lib/auth-client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const SCENARIO_WEIGHTS = {
    "Job Interview": { eyeContact: 4.0, posture: 3.0, emotion: 1.5, vocal: 0.8, pacing: 0.7 },
    "Presentation": { eyeContact: 2.0, posture: 1.5, emotion: 1.5, vocal: 3.0, pacing: 2.0 },
    "Negotiation": { eyeContact: 3.0, posture: 1.0, emotion: 3.0, vocal: 2.0, pacing: 1.0 },
    "Crisis Management": { eyeContact: 2.0, posture: 1.0, emotion: 3.5, vocal: 2.5, pacing: 1.0 },
    "Networking": { eyeContact: 3.5, posture: 1.5, emotion: 2.0, vocal: 1.5, pacing: 1.5 },
    "Salary Discussion": { eyeContact: 3.0, posture: 2.0, emotion: 2.5, vocal: 1.5, pacing: 1.0 },
    "Hostile Q&A": { eyeContact: 3.0, posture: 1.5, emotion: 2.5, vocal: 2.0, pacing: 1.0 },
    "Impromptu Pitch": { eyeContact: 2.5, posture: 1.0, emotion: 1.5, vocal: 2.5, pacing: 2.5 }
};

export function ConfidenceCoachUI() {
    // Video state
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const streamRef = useRef(null); // Ref to always hold the live stream — avoids stale closure on cleanup

    // Session state
    const [sessionStatus, setSessionStatus] = useState("idle"); // idle, analyzing, ended
    const [scenarioCategory, setScenarioCategory] = useState("Job Interview"); // default scenario category
    const [difficulty, setDifficulty] = useState("Beginner"); // Beginner, Intermediate, Expert
    const [question, setQuestion] = useState(""); // generated question string
    const [previousQuestions, setPreviousQuestions] = useState([]); // history of questions asked this session
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [startTime, setStartTime] = useState(null);

    // Transcript state
    const [userAnswer, setUserAnswer] = useState("");
    const [interimAnswer, setInterimAnswer] = useState("");
    const [recognitionLang, setRecognitionLang] = useState("en-IN"); // Changed to en-IN for better Indian accent detection
    const recognitionRef = useRef(null);

    // ML Analyzers
    const audioAnalyzerRef = useRef(null);
    const mediaPipeCleanupRef = useRef(null);
    const [mlStats, setMlStats] = useState({
        faceFrames: 0,
        visibleFaceFrames: 0,
        postures: [],
        positiveFrames: 0,
        tenseFrames: 0,
        emotionMeasuredFrames: 0,
        currentPostureRatio: 0,
        handFrames: 0,
        visibleHandFrames: 0
    });
    const [audioStats, setAudioStats] = useState(null);

    // Live Breakdown Metrics
    const [liveMetrics, setLiveMetrics] = useState({
        eyeContact: 0,
        posture: 0,
        pitch: 0,
        energy: 0,
        pace: 0,
        wpm: 0,
        isSpeaking: false
    });

    // Final Payload
    const [finalScore, setFinalScore] = useState(null);
    const [finalDataPayload, setFinalDataPayload] = useState(null);
    const [aiFeedback, setAiFeedback] = useState([]);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const [aiFeedbackError, setAiFeedbackError] = useState(false);

    // Latest State Refs (to avoid hook dependency loops)
    const mlStatsRef = useRef(mlStats);
    const userAnswerRef = useRef(userAnswer);
    const interimAnswerRef = useRef(interimAnswer);

    useEffect(() => { mlStatsRef.current = mlStats; }, [mlStats]);
    useEffect(() => { userAnswerRef.current = userAnswer; }, [userAnswer]);
    useEffect(() => { interimAnswerRef.current = interimAnswer; }, [interimAnswer]);

    const scenarios = ["Job Interview", "Presentation", "Networking", "Negotiation", "Crisis Management", "Impromptu Pitch", "Hostile Q&A", "Salary Discussion"];

    useEffect(() => {
        // Initialize camera for preview when idle
        const initCamera = async () => {
            if (streamRef.current) return;

            console.log("🎥 Requesting Camera/Mic Access...");
            try {
                // First get basic stream to trigger permission prompt so labels become visible
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(d => d.kind === 'videoinput');

                // Stop the temporary stream to free up the hardware
                tempStream.getTracks().forEach(track => track.stop());

                // Find the requested built-in camera or fall back
                const targetCamera = videoInputs.find(d =>
                    d.label.toLowerCase().includes('usb2.0') ||
                    d.label.toLowerCase().includes('uvc webcam')
                );

                console.log("📸 Available cameras:", videoInputs.map(d => d.label));

                const videoConstraints = targetCamera ? {
                    deviceId: { exact: targetCamera.deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                };

                if (targetCamera) {
                    console.log(`🎯 Using specific camera: ${targetCamera.label}`);
                } else {
                    console.log(`⚠️ Specific camera not found, using generic constraints.`);
                }

                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: true
                });

                console.log("✅ Camera/Mic Access Granted:", mediaStream.id);
                streamRef.current = mediaStream;
                setStream(mediaStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("❌ Failed to access camera/mic:", err);
                try {
                    console.log("🔄 Retrying with absolute basic constraints...");
                    const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    streamRef.current = basicStream;
                    setStream(basicStream);
                } catch (fallbackErr) {
                    if (err.name === 'NotAllowedError') {
                        alert("Camera/Mic access was denied. Please enable permissions in your browser settings and refresh.");
                    } else if (err.name === 'NotFoundError') {
                        alert("No camera or microphone found. Please connect your hardware.");
                    }
                }
            }
        };

        initCamera();

        return () => {
            if (streamRef.current) {
                console.log("🎥 Cleaning up media tracks on unmount");
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`  - Stopped ${track.kind} track`);
                });
                streamRef.current = null;
            }
        };
    }, []);

    // Sync stream with video element
    useEffect(() => {
        if (stream && videoRef.current) {
            console.log("📺 Attaching stream to video element");
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current.play().catch(e => console.error("Video play failed:", e));
            };
        }
    }, [stream]);

    // Live Metrics Update Loop
    useEffect(() => {
        let interval;
        if (sessionStatus === "analyzing" && startTime) {
            console.log("📈 Starting Live Metrics Loop");
            interval = setInterval(() => {
                const now = Date.now();
                const durationMinutes = (now - startTime) / 60000;

                // Calculate WPM from ref
                const words = userAnswerRef.current.trim().split(/\s+/).filter(w => w.length > 0).length;
                const wpm = durationMinutes > 0 ? Math.round(words / durationMinutes) : 0;

                // Sync with audio analyzer
                let pitch = 0;
                let energy = 0;
                if (audioAnalyzerRef.current) {
                    const metrics = audioAnalyzerRef.current.getMetrics();
                    pitch = Math.min(100, (metrics.currentPitch / 300) * 100);
                    energy = metrics.currentEnergy;
                }

                const currentMl = mlStatsRef.current;

                // Real-time instantaneous metrics (last 10-30 frames ~ 1 second)
                const recentFaces = currentMl.recentFaces || [];
                const faceRatio = recentFaces.length > 0 ? (recentFaces.filter(Boolean).length / recentFaces.length) : 0;

                const recentPostures = currentMl.postures.slice(-20); // numeric scores, last 20 frames
                let livePosture = 0;
                if (recentPostures.length > 0) {
                    // -1 means no one detected = 0 points
                    const total = recentPostures.reduce((s, v) => s + Math.max(0, v), 0);
                    livePosture = Math.round(total / recentPostures.length);
                }

                setLiveMetrics(prev => ({
                    ...prev,
                    eyeContact: Math.round(faceRatio * 100),
                    posture: livePosture,
                    pitch: Math.round(pitch),
                    energy: Math.min(100, Math.round(energy * 1.5)), // Added sensitivity boost for live bar
                    wpm: wpm,
                    pace: wpm === 0 ? 0 : (wpm < 95 ? Math.round((wpm / 120) * 100) : (wpm > 170 ? Math.max(0, 100 - (wpm - 170)) : 100)),
                    isSpeaking: interimAnswerRef.current.length > 0 || (Date.now() - prev.lastSpeechTime < 2000),
                    lastSpeechTime: interimAnswerRef.current.length > 0 ? Date.now() : (prev.lastSpeechTime || 0)
                }));
            }, 500);
        }
        return () => {
            if (interval) {
                console.log("📉 Clearing Live Metrics Loop");
                clearInterval(interval);
            }
        };
    }, [sessionStatus, startTime]); // Removed userAnswer, interimAnswer, mlStats dependencies

    // Voice Command Detection via SpeechRecognition
    // (Porcupine removed to avoid external API key dependency)

    useEffect(() => {
        // Run listener in idle and analyzing states
        if (sessionStatus === "ended" || isGeneratingQuestion) {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { }
            }
            return;
        }

        let active = true;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        let recognition = recognitionRef.current;
        if (!recognition) {
            console.log("🎤 Initializing Speech Recognition for Active Session");
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 3; // Allow more context for phonetic matching
            recognition.lang = recognitionLang;
            recognitionRef.current = recognition;
        } else {
            // Update language if it changed
            recognition.lang = recognitionLang;
        }

        recognition.onresult = (event) => {
            if (!active) return;
            let interimTranscript = '';
            let finalTranscriptParts = [];

            const sanitize = (text) => {
                return text
                    .replace(/artificial integration/gi, "artificial intelligence")
                    .replace(/deployment computer/gi, "diploma in computer")
                    .replace(/deployment in computer/gi, "diploma in computer")
                    .replace(/purchasing my/gi, "pursuing my")
                    .replace(/purchasing the/gi, "pursuing a")
                    .replace(/pulse parser/gi, "resume parser")
                    .replace(/regiment pulse/gi, "resume")
                    .replace(/80 score/gi, "ATS score")
                    .replace(/within 80/gi, "with an ATS")
                    .replace(/genital/gi, "generator")
                    .replace(/Christmas/gi, "Kharpude");
            };

            for (let i = 0; i < event.results.length; ++i) {
                const result = event.results[i];
                const rawText = result[0].transcript.toLowerCase().trim();

                // --- COMMAND SCANNER ---
                if (sessionStatus === "idle" && (rawText === "start" || rawText === "begin" || rawText.includes("begin session"))) {
                    console.log("🗣️ Voice Command detected: START");
                    startSession();
                    return;
                }

                if (sessionStatus === "analyzing" && (rawText.includes("end this speech") || rawText === "finish" || rawText === "stop session")) {
                    console.log("🗣️ Voice Command detected: END");
                    endSession();
                    return;
                }

                if (sessionStatus === "analyzing") {
                    if (result.isFinal) {
                        const cleaned = sanitize(result[0].transcript);
                        if (result[0].confidence > 0.05 || cleaned.length > 5) {
                            finalTranscriptParts.push(cleaned.trim());
                        }
                    } else {
                        interimTranscript += result[0].transcript;
                    }
                }
            }

            if (sessionStatus === "analyzing") {
                const currentFinal = finalTranscriptParts.join(" ");
                if (currentFinal.trim() !== userAnswerRef.current.trim()) {
                    setUserAnswer(currentFinal);
                    userAnswerRef.current = currentFinal;
                }
                setInterimAnswer(interimTranscript);
                interimAnswerRef.current = interimTranscript;
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech Recognition Error:", event.error);
            if (event.error === 'not-allowed') {
                console.error("🎤 Speech Recognition blocked by user/browser.");
            } else if (event.error === 'language-not-supported') {
                console.warn(`🎤 Language ${recognitionLang} not supported, falling back to en-US`);
                setRecognitionLang("en-US");
            }
        };

        recognition.onend = () => {
            if (active && (sessionStatus === "idle" || sessionStatus === "analyzing")) {
                setTimeout(() => { if (active) try { recognition.start(); } catch (e) { } }, 300);
            }
        };

        if (stream && (sessionStatus === "idle" || sessionStatus === "analyzing")) {
            try { recognition.start(); } catch (e) { }
        }

        return () => {
            active = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onresult = null;
                    recognitionRef.current.onend = null;
                    recognitionRef.current.onerror = null;
                    recognitionRef.current.stop();
                } catch (e) { }
            }
        };
    }, [sessionStatus, recognitionLang]);

    // AI Question Generation
    useEffect(() => {
        let active = true;
        const fetchQuestion = async () => {
            if (sessionStatus !== "idle") return;
            setIsGeneratingQuestion(true);
            try {
                const res = await fetch('/api/confidence-coach/generate-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scenarioType: scenarioCategory, difficulty: difficulty, previousQuestions: previousQuestions })
                });
                const data = await res.json();
                if (active) {
                    setQuestion(data.success && data.question ? data.question : `Please provide your best response for a typical ${scenarioCategory} scenario.`);
                    if (data.success && data.question) setPreviousQuestions(prev => [...prev, data.question]);
                }
            } catch (err) {
                if (active) setQuestion(`Please provide your best response for a typical ${scenarioCategory} scenario.`);
            } finally {
                if (active) setIsGeneratingQuestion(false);
            }
        };
        fetchQuestion();
        return () => { active = false; };
    }, [scenarioCategory, difficulty, sessionStatus]);

    // Live Timer
    const [timeElapsed, setTimeElapsed] = useState(0);
    useEffect(() => {
        let interval;
        if (sessionStatus === "analyzing" && startTime) {
            interval = setInterval(() => {
                setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else {
            setTimeElapsed(0);
        }
        return () => clearInterval(interval);
    }, [sessionStatus, startTime]);

    const startSession = async () => {
        if (sessionStatus !== "idle") return;
        setSessionId(crypto.randomUUID());
        setStartTime(Date.now());
        setUserAnswer("");
        setInterimAnswer("");
        setFinalScore(null);
        setFinalDataPayload(null);
        setAudioStats(null);
        setMlStats({
            faceFrames: 0,
            visibleFaceFrames: 0,
            postures: [],
            positiveFrames: 0,
            tenseFrames: 0,
            emotionMeasuredFrames: 0,
            currentPostureRatio: 0,
            handFrames: 0,
            visibleHandFrames: 0
        });
        setAiFeedback([]);
        setAiFeedbackError(false);
        setLiveMetrics({ eyeContact: 0, posture: 0, pitch: 0, energy: 0, pace: 0, wpm: 0, isSpeaking: false });

        console.log("🚀 Initializing session analysis components...");
        setSessionStatus("analyzing");

        const audioAnalyzer = new AudioAnalyzer();
        audioAnalyzerRef.current = audioAnalyzer;
        try {
            console.log("🎤 Starting Audio Analyzer with shared stream");
            await audioAnalyzer.start(stream);
        } catch (e) {
            console.error("Audio Analyzer Start Error:", e);
        }

        if (videoRef.current) {
            console.log("🎥 Starting MediaPipe stream analysis. Video readyState:", videoRef.current.readyState);
            mediaPipeCleanupRef.current = startMediaPipeStream(videoRef.current, (results) => {
                // DEBUG: enable this line to spam logs if needed
                // console.log("🧠 MediaPipe Frame processed:", results.focus, results.emotion);

                setMlStats(prev => {
                    const isFaceVisible = results.face && results.face.faceBlendshapes && results.face.faceBlendshapes.length > 0;
                    const allPostures = [...prev.postures, results.postureScore !== undefined ? results.postureScore : -1];
                    const recentFaces = [...(prev.recentFaces || []), isFaceVisible].slice(-30);

                    // Cumulative ratio for final results (treat -1 as 0)
                    const postureSum = allPostures.reduce((s, v) => s + Math.max(0, v), 0);
                    const presenceRatio = allPostures.length > 0 ? (postureSum / (allPostures.length * 100)) : 0;

                    return {
                        ...prev,
                        recentFaces,
                        faceFrames: prev.faceFrames + 1,
                        visibleFaceFrames: prev.visibleFaceFrames + (isFaceVisible ? 1 : 0),
                        postures: allPostures.slice(-100), // numeric scores now
                        positiveFrames: prev.positiveFrames + (results.emotion === "positive" ? 1 : 0),
                        tenseFrames: prev.tenseFrames + (results.emotion === "tense" ? 1 : 0),
                        emotionMeasuredFrames: prev.emotionMeasuredFrames + (results.emotion !== "neutral" ? 1 : 0),
                        currentPostureRatio: presenceRatio,
                        handFrames: prev.handFrames + 1,
                        visibleHandFrames: prev.visibleHandFrames + (results.handsVisible ? 1 : 0)
                    };
                });
            });
        }
    };

    const fetchAiFeedback = async (metrics) => {
        if (!metrics) return;
        setIsGeneratingFeedback(true);
        setAiFeedbackError(false);
        setAiFeedback([]); // Clear old feedback immediately
        try {
            const res = await fetch('/api/confidence-coach/generate-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metrics,
                    scenarioType: scenarioCategory,
                    difficulty: difficulty
                })
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.feedback) && data.feedback.length > 0) {
                setAiFeedback(data.feedback);
            } else {
                setAiFeedbackError(true);
            }
        } catch (err) {
            console.error("❌ Failed to fetch AI feedback:", err);
            setAiFeedbackError(true);
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const endSession = () => {
        if (sessionStatus !== "analyzing") return;
        setSessionStatus("ended");

        if (mediaPipeCleanupRef.current) {
            mediaPipeCleanupRef.current();
            mediaPipeCleanupRef.current = null;
        }

        let audioMetrics = { avgVolume: 0, volumeVariance: 0, avgPitch: 0, avgEnergy: 0, pitchStability: 0, energyTrend: "Stable" };
        if (audioAnalyzerRef.current) {
            audioMetrics = audioAnalyzerRef.current.stop();
            audioAnalyzerRef.current = null;
        }
        setAudioStats(audioMetrics);

        const endTimeStamp = Date.now();
        const timeTaken = Math.floor((endTimeStamp - startTime) / 1000);

        // Filler Word Detection
        const fillerWords = ["um", "uh", "err", "like", "actually", "basically", "you know", "literally", "sort of", "kind of", "i mean"];
        const fillerTranscript = userAnswerRef.current.toLowerCase();
        let fillerCount = 0;
        fillerWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            const matches = fillerTranscript.match(regex);
            if (matches) fillerCount += matches.length;
        });

        // Combine state, ref, AND interim (words being processed but not committed as 'final').
        // At session end, the last spoken words often sit in the interim buffer.
        const stateTranscript = userAnswer || "";
        const refTranscript = userAnswerRef.current || "";
        const interimAtEnd = interimAnswerRef.current || "";

        // Use longest confirmed transcript, then append interim words
        const baseTranscript = stateTranscript.length >= refTranscript.length ? stateTranscript : refTranscript;
        const finalTranscript = (baseTranscript + " " + interimAtEnd).trim();

        const wordCount = finalTranscript.length > 0 ? finalTranscript.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
        const durationMin = timeTaken / 60;
        const finalWPM = durationMin > 0 ? Math.round(wordCount / durationMin) : 0;

        // --- SCENARIO-BASED WEIGHTED SCORING ---
        const weights = SCENARIO_WEIGHTS[scenarioCategory] || SCENARIO_WEIGHTS["Job Interview"];
        const difficultyMultiplier = difficulty === "Expert" ? 2.0 : (difficulty === "Intermediate" ? 1.5 : 1.0);

        // 1. Eye Contact (EC)
        // Beginner: 70% EC = 1.0 score. Expert: 90% EC = 1.0 score.
        const ecThreshold = difficulty === "Expert" ? 0.9 : (difficulty === "Intermediate" ? 0.8 : 0.7);
        const faceVisRatio = mlStats.faceFrames > 0 ? (mlStats.visibleFaceFrames / mlStats.faceFrames) : 0;
        const eyeContactScore = Math.min(1.0, faceVisRatio / ecThreshold);
        const eyeContactPts = eyeContactScore * weights.eyeContact;

        // 2. Presence & Posture (P)
        const posturePts = mlStats.currentPostureRatio * weights.posture;

        // 3. Emotion Calibration (E)
        let emotionScore = 0.5; // neutral start
        if (mlStats.faceFrames > 0) {
            const positiveRatio = mlStats.positiveFrames / mlStats.faceFrames;
            const tenseRatio = mlStats.tenseFrames / mlStats.faceFrames;
            // Expert is stricter on tense expressions
            const tensePenaltyFactor = difficulty === "Expert" ? 2.0 : 1.5;
            emotionScore = Math.min(1.0, Math.max(0.2, 0.5 + (positiveRatio * 2.0) - (tenseRatio * tensePenaltyFactor)));
        }
        const emotionPts = emotionScore * weights.emotion;

        // 4. Vocal Performance (V)
        const vocalPts = (audioMetrics.pitchStability / 100) * weights.vocal;

        // 5. Pacing Performance (W)
        // Adjusted range: 40 - 65 WPM is "Good/Very Good" (1.0)
        let pacingScore = 0.5;
        if (finalWPM >= 40 && finalWPM <= 65) pacingScore = 1.0;
        else if (finalWPM > 65) pacingScore = 1.0;
        else if (finalWPM >= 20) pacingScore = 0.8; // Moderate
        else if (finalWPM >= 15) pacingScore = 0.5; // Slow
        else pacingScore = 0.2; // Too Slow
        const pacingPts = pacingScore * weights.pacing;

        // Deductions for fillers
        // Filler penalty is much harsher on Expert
        const fillerRate = (fillerCount / (wordCount || 1));
        const baseFillerPenalty = fillerRate * 50;
        const fillerPenalty = Math.min(3.0, baseFillerPenalty * difficultyMultiplier);

        let totalScore = eyeContactPts + posturePts + emotionPts + vocalPts + pacingPts;
        totalScore -= fillerPenalty;

        const finalCalculatedScore = Math.min(10.0, Math.max(1.0, Math.round(totalScore * 10) / 10));
        setFinalScore(finalCalculatedScore);

        const payload = {
            moduleId: "confidenceCoach",
            gameType: "voice",
            sessionId: sessionId || crypto.randomUUID(),
            question: question,
            userAnswer: userAnswer.trim() || "(No transcript captured)",
            correctAnswer: "completed",
            isCorrect: true,
            score: finalCalculatedScore,
            timeTaken: timeTaken,
            metrics: {
                eyeContact: Math.round(eyeContactScore * 100),
                posture: Math.round(mlStats.currentPostureRatio * 100),
                emotion: emotionPts > 1.5 ? "Confident" : (emotionPts < 0.8 ? "Tense" : "Neutral"),
                vocalStability: audioMetrics.pitchStability,
                pacing: Math.round((pacingPts / 0.8) * 100),
                wpm: Math.round(finalWPM),
                fillers: fillerCount // Added fillers here
            },
            meta: {
                fillers: fillerCount,
                wordCount: wordCount,
                wpm: Math.round(finalWPM),
                pitchStability: audioMetrics.pitchStability,
                energyTrend: audioMetrics.energyTrend
            }
        };

        const token = getAuthToken();
        setFinalDataPayload(payload);
        fetchAiFeedback(payload.metrics);

        // Fire-and-forget asynchronous save to JWT-protected backend (Plan 4.3)
        fetch('/api/confidence-coach/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(payload),
        }).catch(err => console.error("❌ Failed to save session:", err));
    };

    const getProgressColor = (value) => {
        if (value < 40) return "bg-red-500";
        if (value < 70) return "bg-orange-400";
        return "bg-green-500";
    };

    return (
        <div className="w-full h-fit lg:h-full flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden pb-4 lg:pb-0">
            {/* Left Panel: Video Feed */}
            <div className="w-full lg:w-[60%] min-h-[40vh] lg:min-h-0 bg-black rounded-xl overflow-hidden relative shadow-lg border border-border flex items-center justify-center shrink-0 lg:shrink">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full flex-1 h-full object-cover transform scale-x-[-1]"
                />

                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-white border border-white/10 text-sm">
                        <Video size={16} className={stream ? "text-green-400" : "text-red-400"} />
                        <span>{stream ? "Camera Active" : "No Camera"}</span>
                        {/* DEBUG: {stream?.id} */}
                    </div>
                </div>

                {sessionStatus === "analyzing" && (
                    <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 text-white text-sm font-bold animate-pulse shadow-lg">
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        RECORDING
                    </div>
                )}
            </div>

            {/* Right Panel: Controls & Instructions */}
            <div className="w-full lg:w-[40%] bg-card rounded-xl border border-border p-5 lg:p-6 flex flex-col shadow-sm flex-1 lg:overflow-y-auto">

                {sessionStatus === "idle" && (
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <h2 className="text-3xl font-black mb-2 tracking-tight">Confidence Coach</h2>
                            <p className="text-muted-foreground mb-8">Master your presence with real-time AI feedback.</p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="flex-1 min-w-0">
                                    <label className="block text-sm font-medium mb-2">Scenario Type</label>
                                    <select
                                        value={scenarioCategory}
                                        onChange={(e) => setScenarioCategory(e.target.value)}
                                        className="w-full p-2.5 sm:p-3 rounded-lg border border-input bg-background"
                                        disabled={isGeneratingQuestion}
                                    >
                                        {scenarios.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full p-2.5 sm:p-3 rounded-lg border border-input bg-background"
                                        disabled={isGeneratingQuestion}
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>
                            </div>

                            {isGeneratingQuestion ? (
                                <div className="text-sm font-medium text-primary animate-pulse mb-8 flex items-center gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
                                    <Loader2 size={18} className="animate-spin" /> Crafting your challenge...
                                </div>
                            ) : (
                                <div className="border border-border bg-secondary/20 p-5 rounded-2xl mb-8 shadow-inner relative group">
                                    <div className="absolute -top-3 left-4 bg-background px-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Practice Question</div>
                                    <p className="text-lg font-semibold leading-relaxed">&quot;{question}&quot;</p>
                                </div>
                            )}

                            <div className="bg-secondary/40 rounded-2xl p-5 mb-4 border border-border">
                                <h3 className="font-bold flex items-center gap-2 mb-3 text-sm">
                                    <Mic size={18} className="text-primary" /> VOICE COMMANDS
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-xs bg-background p-3 rounded-lg border border-border">
                                        <span className="text-muted-foreground block mb-1">TO START</span>
                                        <span className="font-bold">&quot;Start&quot;</span>
                                    </div>
                                    <div className="text-xs bg-background p-3 rounded-lg border border-border">
                                        <span className="text-muted-foreground block mb-1">TO END</span>
                                        <span className="font-bold">&quot;End this speech&quot;</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={startSession}
                            disabled={!stream || isGeneratingQuestion}
                            className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl hover:translate-y-[-2px] active:translate-y-[0] transition-all flex justify-center items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {isGeneratingQuestion ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <Play fill="currentColor" size={24} className="group-hover:scale-110 transition-transform" />
                            )}
                            {isGeneratingQuestion ? "PREPARING..." : "BEGIN SESSION"}
                        </button>
                    </div>
                )}

                {sessionStatus === "analyzing" && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-primary">Live Analysis</h2>
                                <Badge variant="outline" className="font-mono text-lg bg-secondary/50 px-3 py-1">
                                    {timeElapsed}s
                                </Badge>
                            </div>

                            {/* LIVE BREAKDOWN */}
                            <div className="space-y-4 bg-secondary/10 p-5 rounded-2xl border border-border">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Live Breakdown</h3>

                                <div className="space-y-4">
                                    {[
                                        { label: "Eye Contact", value: liveMetrics.eyeContact, icon: <Eye size={14} /> },
                                        { label: "Posture", value: liveMetrics.posture, icon: <TrendingUp size={14} /> },
                                        { label: "Pitch", value: liveMetrics.pitch, icon: <Activity size={14} /> },
                                        { label: "Energy", value: liveMetrics.energy, icon: <Zap size={14} /> },
                                        { label: "Pace", value: liveMetrics.pace, icon: <TrendingUp size={14} /> }
                                    ].map((m) => (
                                        <div key={m.label} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <div className="flex items-center gap-2 opacity-70">
                                                    {m.icon} {m.label}
                                                </div>
                                                <span>{m.value}%</span>
                                            </div>
                                            <Progress value={m.value} className="h-2" indicatorClassName={getProgressColor(m.value)} />
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                                    <div className="text-xs font-bold text-muted-foreground">Speaking Pace</div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-primary">{liveMetrics.wpm} WPM</span>
                                        <Badge variant={liveMetrics.isSpeaking ? "default" : "secondary"} className="text-[10px] h-5 px-2">
                                            {liveMetrics.isSpeaking ? "Speaking" : "No Speech"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-secondary/30 rounded-2xl border border-border overflow-hidden flex flex-col">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-5 pt-4 pb-2 bg-secondary/50 border-b border-border">Live Transcript</h3>
                                <div className="p-5 overflow-y-auto max-h-[160px]">
                                    <p className="text-sm font-medium leading-relaxed">
                                        {userAnswer} <span className="text-primary italic animate-pulse">{interimAnswer}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={endSession}
                            className="w-full py-5 bg-destructive/10 text-destructive border-2 border-destructive/20 rounded-2xl font-black text-lg shadow-lg hover:bg-destructive hover:text-white transition-all flex justify-center items-center gap-3 mt-6"
                        >
                            <Square fill="currentColor" size={24} />
                            END SPEECH
                        </button>
                    </div>
                )}

                {sessionStatus === "ended" && (
                    <div className="flex flex-col h-full overflow-y-auto pb-4">
                        {finalScore === null ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                <Loader2 size={48} className="text-primary animate-spin" />
                                <h2 className="text-2xl font-black uppercase tracking-widest animate-pulse">Analyzing...</h2>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center space-y-2 mb-4">
                                    <div className="flex justify-center mb-2">
                                        <div className="bg-green-500/10 p-2 rounded-full">
                                            <CheckCircle size={32} className="text-green-500" />
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter">SUCCESS</h2>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Session analyzed against AI models</p>
                                </div>

                                {/* 6-CARD RESULTS LAYOUT */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Eye Contact */}
                                    <div className="bg-secondary/20 p-5 rounded-2xl border border-border flex flex-col items-center text-center">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Eye Contact</span>
                                        <span className="text-2xl font-black text-primary mb-1">
                                            {mlStats.faceFrames > 0 ? Math.round((mlStats.visibleFaceFrames / mlStats.faceFrames * 100)) : 0}%
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-bold opacity-60">Time looking at camera</span>
                                    </div>

                                    {/* Expression */}
                                    <div className="bg-secondary/20 p-5 rounded-2xl border border-border flex flex-col items-center text-center">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Expression</span>
                                        <span className="text-2xl font-black text-primary mb-1">
                                            {(() => {
                                                if (mlStats.faceFrames === 0) return "Neutral";
                                                const posRatio = mlStats.positiveFrames / mlStats.faceFrames;
                                                const tenseRatio = mlStats.tenseFrames / mlStats.faceFrames;
                                                if (posRatio > 0.08) return "Confident";
                                                if (tenseRatio > 0.1) return "Tense";
                                                return "Neutral";
                                            })()}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-bold opacity-60">Dominant facial emotion</span>
                                    </div>

                                    {/* Vocal Energy - matches Vocal Pacing Details */}
                                    <div className="bg-secondary/20 p-5 rounded-2xl border border-border flex flex-col items-center text-center">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Vocal Energy</span>
                                        <span className="text-2xl font-black text-primary mb-1">
                                            {(() => {
                                                const wpm = finalDataPayload?.meta?.wpm || 0;
                                                if (wpm === 0) return "No Speech";
                                                if (wpm < 15) return "Too Slow";
                                                if (wpm < 20) return "Slow";
                                                if (wpm < 40) return "Moderate";
                                                if (wpm < 65) return "Good";
                                                return "Very Good";
                                            })()}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-bold opacity-60">{Math.round(finalDataPayload?.meta?.wpm || 0)} WPM average</span>
                                    </div>

                                    {/* Posture */}
                                    <div className="bg-secondary/20 p-5 rounded-2xl border border-border flex flex-col items-center text-center">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Posture</span>
                                        <span className="text-2xl font-black text-primary mb-1">
                                            {Math.round(mlStats.currentPostureRatio * 100) > 60 ? "Strong" : (Math.round(mlStats.currentPostureRatio * 100) > 30 ? "Moderate" : "Weak")}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-bold opacity-60">{Math.round(mlStats.currentPostureRatio * 100)}% session average</span>
                                    </div>

                                    {/* Fillers */}
                                    <div className="bg-secondary/20 p-5 rounded-2xl border border-border flex flex-col items-center text-center">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Fillers</span>
                                        <span className="text-2xl font-black text-primary mb-1">
                                            {finalDataPayload?.meta?.fillers || 0}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-bold opacity-60">Um, uh, like, etc.</span>
                                    </div>

                                    {/* Clarity */}
                                    <div className="bg-secondary/20 p-5 rounded-2xl border border-border flex flex-col items-center text-center">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Clarity</span>
                                        <span className="text-2xl font-black text-primary mb-1">
                                            {(() => {
                                                const wordsCount = (finalDataPayload?.meta?.wordCount || 1);
                                                const fillersPerWord = (finalDataPayload?.meta?.fillers || 0) / wordsCount;
                                                // Clarity = pitch stability minus filler penalty
                                                const pitchBase = Math.min(100, audioStats?.pitchStability || 50);
                                                const fillerPenalty = Math.round(fillersPerWord * 200); // each 1% filler rate = 2pt penalty
                                                return Math.max(0, Math.round(pitchBase - fillerPenalty)) + "%";
                                            })()}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-bold opacity-60">Linguistic clarity</span>
                                    </div>
                                </div>

                                {/* DETAILED VOCAL PACING BREAKDOWN */}
                                <div className="bg-secondary/10 rounded-2xl p-5 border border-border mt-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vocal Pacing Details</span>
                                        <span className="text-xs font-black text-primary">{Math.round(finalDataPayload?.meta?.wpm || 0)} WPM</span>
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-2xl font-black text-yellow-500">
                                            {(() => {
                                                const wpm = finalDataPayload?.meta?.wpm || 0;
                                                if (wpm === 0) return "No Speech";
                                                if (wpm < 15) return "Too Slow";
                                                if (wpm < 20) return "Slow";
                                                if (wpm < 40) return "Moderate";
                                                if (wpm < 65) return "Good";
                                                return "Very Good";
                                            })()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted-foreground font-bold">Pitch Stability</span>
                                            <span className={audioStats?.pitchStability > 70 ? "text-green-500 font-black" : "text-red-500 font-black"}>{audioStats?.pitchStability || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted-foreground font-bold">Fillers / 100 words</span>
                                            <span className="text-green-500 font-black">{((finalDataPayload?.meta?.fillers || 0) / (Math.max(1, (finalDataPayload?.meta?.wordCount || 1)) / 100)).toFixed(1)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted-foreground font-bold">Volume</span>
                                            <span className="text-green-500 font-black">Good</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted-foreground font-bold">Energy Trend</span>
                                            <span className="text-green-500 font-black">{audioStats?.energyTrend || "Stable"}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted-foreground font-bold">Pause Ratio</span>
                                            <span className="text-blue-500 font-black">0%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted-foreground font-bold">Filler Severity</span>
                                            <span className="text-green-500 font-black">Excellent</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Holistic Score Area */}
                                <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 shadow-xl relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col items-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-primary/70">Holistic Confidence Score</span>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className="text-8xl font-black leading-none text-primary">{finalScore}</span>
                                            <span className="text-2xl font-bold opacity-30 text-primary">/10</span>
                                        </div>

                                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                                            <span>Difficulty: <span className="text-primary">{difficulty}</span></span>
                                            <div className="w-1 h-1 rounded-full bg-border"></div>
                                            <span>Duration: <span className="text-primary">{finalDataPayload?.timeTaken}s</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mt-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Areas for Improvement</h3>
                                        {aiFeedback.length > 0 && !isGeneratingFeedback && (
                                            <button
                                                onClick={() => fetchAiFeedback(finalDataPayload.metrics)}
                                                className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                                            >
                                                <Zap size={10} /> REGENERATE
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid gap-3">
                                        {isGeneratingFeedback ? (
                                            <div className="space-y-3">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-24 bg-secondary/5 rounded-xl animate-pulse flex gap-4 p-4 border border-border/50">
                                                        <div className="w-10 h-10 rounded-lg bg-secondary/10 shrink-0" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-3 w-24 bg-secondary/10 rounded" />
                                                            <div className="h-4 w-full bg-secondary/10 rounded" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : aiFeedback.length > 0 ? (
                                            aiFeedback.map((item, idx) => (
                                                <div key={idx} className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow group">
                                                    <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                        {(() => {
                                                            const iconType = (item.iconType || "zap").toLowerCase();
                                                            if (iconType.includes("camera") || iconType.includes("video")) return <Video size={18} />;
                                                            if (iconType.includes("mic") || iconType.includes("voice")) return <Mic size={18} />;
                                                            if (iconType.includes("activity")) return <Activity size={18} />;
                                                            if (iconType.includes("eye")) return <Eye size={18} />;
                                                            if (iconType.includes("trending")) return <TrendingUp size={18} />;
                                                            return <Zap size={18} />;
                                                        })()}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black uppercase opacity-60 tracking-tight">{item.title}</p>
                                                        <p className="text-sm font-medium leading-relaxed">{item.description}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (isGeneratingFeedback || (finalScore !== null && aiFeedback.length === 0 && !aiFeedbackError)) ? (
                                            <div className="p-10 border-2 border-dashed border-primary/30 rounded-3xl flex flex-col items-center justify-center text-center bg-primary/5">
                                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                                    <Loader2 size={32} className="text-primary animate-spin" />
                                                </div>
                                                <p className="text-sm font-black text-primary uppercase tracking-widest mb-1">AI COACHING TIPS</p>
                                                <p className="text-[10px] text-muted-foreground font-bold animate-pulse">GENERATING ANALYTICS...</p>
                                            </div>
                                        ) : aiFeedbackError ? (
                                            <div className="p-8 border-2 border-dashed border-red-500/30 rounded-3xl flex flex-col items-center justify-center text-center bg-red-500/5">
                                                <div className="bg-red-500/10 p-4 rounded-full mb-4">
                                                    <Zap size={32} className="text-red-500" />
                                                </div>
                                                <p className="text-sm font-bold text-red-500 uppercase tracking-widest mb-2">AI Connection Failed</p>
                                                <button
                                                    onClick={() => fetchAiFeedback(finalDataPayload.metrics)}
                                                    className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:scale-105 transition-transform shadow-lg"
                                                >
                                                    Tap to Try Again
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-10 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center bg-secondary/5">
                                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                                    <CheckCircle size={32} className="text-muted-foreground opacity-20" />
                                                </div>
                                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Feedback ready</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* YOUTUBE PLAYLIST INTEGRATION */}
                                <div className="bg-secondary/10 rounded-3xl p-6 border border-border mt-2 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                        <TrendingUp size={80} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Recommended Training</h3>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-24 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0 relative border border-white/10">
                                            <img src="https://img.youtube.com/vi/K0pxo-dS9Hc/0.jpg" className="w-full h-full object-cover" alt="YouTube Thumbnail" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Play size={12} fill="white" className="text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black leading-tight">Mastering Body Language</p>
                                            <p className="text-[10px] font-medium text-muted-foreground">Confidence Coach Curated Playlist</p>
                                            <a
                                                href="https://www.youtube.com/playlist?list=PLp_f9kI_pG7yUshX7b_0PskFk9OQyW8vS"
                                                target="_blank"
                                                className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 mt-1"
                                            >
                                                WATCH ON YOUTUBE →
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSessionStatus("idle");
                                        setFinalScore(null);
                                        setAiFeedback([]);
                                    }}
                                    className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black hover:brightness-110 active:scale-[0.98] transition-all flex justify-center items-center gap-3 mt-6 shadow-xl shadow-primary/20"
                                >
                                    PRACTICE AGAIN
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}