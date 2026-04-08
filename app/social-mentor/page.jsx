"use client";

import { useState, useEffect } from "react";
import Header from '@/app/components/shared/header/Header.jsx';
import { ChatInterface } from "@/app/components/socialmentor/ChatInterface/ChatInterface.jsx";
import { AvatarExperience } from "@/app/components/socialmentor/Avatar/AvatarExperience.jsx";
import { History, X, Trash2, Search, RefreshCw, Archive, ArchiveRestore } from "lucide-react";

import { getAuthToken } from "@/lib/auth-client";
import { DeleteHistoryAlert } from "@/app/components/socialmentor/DeleteHistoryAlert";
import { useTheme } from "next-themes";
import NoiseMesh from '@/app/components/inquizzo/NoiseMesh';
import { cn } from "@/lib/utils";

export default function SocialMentorPage() {
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';
    const [mounted, setMounted] = useState(false);

    const [isTalking, setIsTalking] = useState(false);
    const [avatarType, setAvatarType] = useState("male");

    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [activeMessages, setActiveMessages] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("active");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Premium Theme Tokens (Synced with Inquizzo)
    const t = isLight ? {
        pageBg: '#E8E0F0',
        primary: '#9067C6',
        primaryLight: '#8D86C9',
        accent: '#D6CA98',
        mint: '#CEF9F2',
        steel: '#AFC1D6',
        glassBg: 'rgba(171, 146, 191, 0.04)',
        glassBorder: 'rgba(101, 90, 124, 0.15)',
        glassHoverBg: 'rgba(144, 103, 198, 0.08)',
        cardBg: 'rgba(175, 193, 214, 0.08)',
        cardBorder: 'rgba(101, 90, 124, 0.15)',
        cardInnerBg: 'rgba(206, 249, 242, 0.15)',
        textPrimary: '#242038',
        textSecondary: '#655A7C',
        textMuted: '#655A7C',
        textSubtle: '#8D86C9',
        btnPrimaryBg: '#9067C6',
        btnPrimaryHover: '#7B56B3',
        btnSecondaryBg: 'rgba(171, 146, 191, 0.18)',
        btnSecondaryBorder: 'rgba(101, 90, 124, 0.3)',
        btnSecondaryText: '#242038',
        orb1: 'rgba(171, 146, 191, 0.4)',
        orb2: 'rgba(175, 193, 214, 0.45)',
        orb3: 'rgba(206, 249, 242, 0.5)',
        statBg: 'rgba(206, 249, 242, 0.35)',
        separator: 'rgba(101, 90, 124, 0.15)',
    } : {
        pageBg: null,
        primary: '#934cf0',
        primaryLight: '#934cf0',
        accent: '#934cf0',
        mint: '#934cf0',
        steel: '#934cf0',
        glassBg: 'rgba(147, 76, 240, 0.02)',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        glassHoverBg: 'rgba(255, 255, 255, 0.04)',
        cardBg: 'rgba(147, 76, 240, 0.02)',
        cardBorder: 'rgba(255, 255, 255, 0.08)',
        cardInnerBg: 'rgba(24, 16, 34, 0.15)',
        textPrimary: '#ffffff',
        textSecondary: '#ffffff',
        textMuted: '#94A3B8',
        textSubtle: '#94A3B8',
        btnPrimaryBg: '#934cf0',
        btnPrimaryHover: 'rgba(147, 76, 240, 0.9)',
        btnSecondaryBg: 'rgba(147, 76, 240, 0.03)',
        btnSecondaryBorder: 'rgba(255, 255, 255, 0.08)',
        btnSecondaryText: '#CBD5E1',
        orb1: 'rgba(147, 76, 240, 0.4)',
        orb2: 'rgba(79, 70, 229, 0.4)',
        orb3: 'rgba(88, 28, 135, 0.2)',
        statBg: 'rgba(24, 16, 34, 0.15)',
        separator: 'rgba(255, 255, 255, 0.03)',
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Ensure session ID is always stable
    useEffect(() => {
        if (!activeSessionId) {
            setActiveSessionId(Date.now().toString());
        }
    }, []);

    // Load preference on mount
    useEffect(() => {
        const saved = localStorage.getItem("social-mentor-avatar");
        if (saved) setAvatarType(saved);
    }, []);

    // Helper to change and persist
    const changeAvatar = (type) => {
        setAvatarType(type);
        localStorage.setItem("social-mentor-avatar", type);
    };

    useEffect(() => {
        if (showHistory) {
            fetchHistory();
        }
    }, [showHistory]);

    const fetchHistory = () => {
        setIsRefreshing(true);
        const token = getAuthToken();
        console.log("[SocialMentor] Fetching history with token:", token ? "Token exists" : "No token");

        fetch('/api/mentor/history', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                console.log("[SocialMentor] History fetch status:", res.status);
                return res.json();
            })
            .then(data => {
                console.log("[SocialMentor] History data received:", data);
                if (data.success) {
                    setSessions(data.data || []);
                } else {
                    console.error("Failed to fetch history:", data.error);
                }
            })
            .catch(err => {
                console.error("[SocialMentor] History fetch error:", err);
            })
            .finally(() => setIsRefreshing(false));
    };

    const toggleArchiveSession = async (session, e) => {
        e.stopPropagation();
        const token = getAuthToken();
        try {
            const res = await fetch('/api/mentor/history/archive', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    isArchived: !session.isArchived
                })
            });
            const data = await res.json();
            if (data.success) {
                setSessions(prev => prev.map(s => s.sessionId === session.sessionId ? { ...s, isArchived: !s.isArchived } : s));
            }
        } catch (error) {
            console.error("Failed to archive/unarchive session:", error);
        }
    };

    const handleSessionDeleted = (sessionId) => {
        setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    };

    const loadSession = (session) => {
        setActiveSessionId(session.sessionId);
        setActiveMessages(session.messages);
        setShowHistory(false);
    };

    const startNewSession = () => {
        setActiveSessionId(Date.now().toString());
        setActiveMessages(null);
        setShowHistory(false);
    };

    const today = new Date().toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const filteredSessions = sessions.filter(session => {
        const matchesTab = activeTab === "archived" ? session.isArchived : !session.isArchived;
        const searchLower = searchQuery.toLowerCase();

        const titleMatch = session.title ? session.title.toLowerCase().includes(searchLower) : false;
        const messagesMatch = session.messages && Array.isArray(session.messages)
            ? session.messages.some(m => m.text && typeof m.text === 'string' && m.text.toLowerCase().includes(searchLower))
            : false;

        const matchesSearch = titleMatch || messagesMatch;
        return matchesTab && matchesSearch;
    });

    if (!mounted) return null;

    return (
        <div className={cn("relative h-screen font-dm flex flex-col transition-colors duration-500 overflow-hidden", !isLight && "iq-mesh-bg")} style={isLight ? { backgroundColor: t.pageBg } : undefined}>
            <NoiseMesh />

            {/* Ambient background orbs */}
            {isLight ? (
                <div className="fixed inset-0 pointer-events-none overflow-hidden text-center">
                    <div className="absolute -top-24 -left-24 w-[500px] h-[500px] blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: '#AB92BF', opacity: 0.55 }} />
                    <div className="absolute -bottom-16 -right-16 w-[450px] h-[450px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#AFC1D6', opacity: 0.6 }} />
                    <div className="absolute top-[25%] right-[5%] w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: '#CEF9F2', opacity: 0.7 }} />
                </div>
            ) : (
                <div className="fixed inset-0 pointer-events-none overflow-hidden text-center z-0">
                    <div className="absolute -top-20 -left-20 w-[400px] h-[400px] blur-[80px] rounded-full pointer-events-none animate-pulse" style={{ backgroundColor: t.orb1 }} />
                    <div className="absolute bottom-10 right-10 w-[300px] h-[300px] blur-[80px] rounded-full pointer-events-none" style={{ backgroundColor: t.orb2 }} />
                    <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] blur-[80px] rounded-full pointer-events-none" style={{ backgroundColor: t.orb3 }} />
                </div>
            )}
            {/* Header Section */}
            <div className="sticky top-0 z-50 w-full shrink-0">
                <Header
                    DateValue="Interactive"
                    onDateChange={() => { }}
                    tempDate={today}
                    showDateFilter={false}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-2 px-3 flex flex-col lg:flex-row gap-3 overflow-hidden min-h-0">

                {/* Left Panel: Chat Interface */}
                <section
                    className="w-full lg:w-[68%] lg:min-w-[68%] lg:max-w-[68%] flex-shrink-0 flex flex-col rounded-[24px] border shadow-2xl overflow-hidden order-2 lg:order-1 h-[60%] lg:h-full backdrop-blur-2xl transition-all duration-300"
                    style={{ backgroundColor: t.glassBg, borderColor: t.glassBorder }}
                >
                    <ChatInterface
                        onTalkingStateChange={setIsTalking}
                        sessionId={activeSessionId}
                        initialMessages={activeMessages}
                        onNewChat={startNewSession}
                        avatarType={avatarType}
                        t={t}
                    />
                </section>

                {/* Right Panel: 3D Avatar Space or History */}
                <section
                    className="w-full lg:w-[32%] lg:min-w-[32%] lg:max-w-[32%] flex-shrink-0 rounded-[24px] border relative overflow-hidden flex flex-col order-1 lg:order-2 h-[40%] lg:h-full min-h-[300px] backdrop-blur-2xl transition-all duration-300 shadow-2xl"
                    style={{ backgroundColor: t.glassBg, borderColor: t.glassBorder }}
                >

                    {/* Status Badge & History Toggle */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 flex flex-col items-end gap-2">
                        {!showHistory && (
                            <div className="flex bg-white/5 dark:bg-black/20 backdrop-blur-2xl p-0.5 sm:p-1 rounded-lg border border-white/10 shadow-lg scale-90 sm:scale-100 origin-right">
                                <button
                                    onClick={() => changeAvatar("male")}
                                    className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded transition-all ${avatarType === "male" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"}`}
                                >
                                    Male
                                </button>
                                <button
                                    onClick={() => changeAvatar("female")}
                                    className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded transition-all ${avatarType === "female" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"}`}
                                >
                                    Female
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-white rounded-lg shadow-lg font-bold uppercase tracking-wider transition-all scale-90 sm:scale-100 origin-right hover:scale-105 active:scale-95 text-[10px]"
                            style={{ backgroundColor: t.primary }}
                        >
                            {showHistory ? <X className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
                            {showHistory ? "Back" : "History"}
                        </button>
                    </div>

                    {showHistory ? (
                        <div className="flex-1 w-full h-full backdrop-blur-2xl flex flex-col p-4 sm:p-6 overflow-hidden z-10 transition-colors">
                            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 shrink-0 pr-20 sm:pr-32">
                                <h2 className="text-xl sm:text-2xl font-syne font-black flex items-center gap-2" style={{ color: t.textPrimary }}>
                                    <History className="w-6 h-6" style={{ color: t.primary }} /> Session History
                                </h2>
                                <button
                                    onClick={fetchHistory}
                                    disabled={isRefreshing}
                                    className="p-2 transition-all disabled:opacity-50 rounded-xl"
                                    style={{ color: t.textMuted, backgroundColor: t.btnSecondaryBg }}
                                    title="Refresh History"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="relative mb-6 shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
                                <input
                                    type="text"
                                    placeholder="Search sessions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all shadow-inner"
                                    style={{
                                        backgroundColor: t.cardInnerBg,
                                        borderColor: t.cardBorder,
                                        color: t.textPrimary,
                                        "--tw-ring-color": t.primary + '55'
                                    }}
                                />
                            </div>

                            {/* Tabs */}
                            <div className="flex p-1 rounded-xl mb-6 shrink-0 shadow-sm" style={{ backgroundColor: t.btnSecondaryBg, border: `1px solid ${t.separator}` }}>
                                <button
                                    onClick={() => setActiveTab("active")}
                                    className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${activeTab === "active" ? "shadow-md scale-[1.02]" : "text-muted-foreground hover:text-foreground"}`}
                                    style={activeTab === "active" ? { backgroundColor: t.btnPrimaryBg, color: '#fff' } : { color: t.textMuted }}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setActiveTab("archived")}
                                    className={`flex-1 text-xs font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${activeTab === "archived" ? "shadow-md scale-[1.02]" : "text-muted-foreground hover:text-foreground"}`}
                                    style={activeTab === "archived" ? { backgroundColor: t.btnPrimaryBg, color: '#fff' } : { color: t.textMuted }}
                                >
                                    Archived
                                </button>
                            </div>

                            <div className="space-y-3 overflow-y-auto flex-1 p-1 scrollbar-thin scrollbar-thumb-border">
                                {filteredSessions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-10 italic">
                                        {searchQuery ? "No sessions match your search." : (activeTab === "archived" ? "No archived sessions." : "No past sessions found. Start a new chat!")}
                                    </p>
                                ) : (
                                    filteredSessions.map(session => (
                                        <div
                                            key={session.sessionId}
                                            onClick={() => loadSession(session)}
                                            className="p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group shadow-sm relative flex flex-col"
                                            style={{ backgroundColor: t.cardInnerBg, borderColor: t.cardBorder }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-sm font-bold truncate pr-2 flex-1 transition-colors" style={{ color: t.textPrimary }} title={session.title}>
                                                    {session.title || "Untitled Session"}
                                                </p>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: t.btnSecondaryBg, color: t.textMuted }}>
                                                        {new Date(session.updatedAt).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        onClick={(e) => toggleArchiveSession(session, e)}
                                                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                        title={session.isArchived ? "Unarchive" : "Archive"}
                                                    >
                                                        {session.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <DeleteHistoryAlert
                                                        session={session}
                                                        onSessionDeleted={handleSessionDeleted}
                                                    >
                                                        <button
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                            title="Delete History"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </DeleteHistoryAlert>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mt-1">
                                                {session.messages && session.messages.length > 1
                                                    ? `"${session.messages[1].text}"`
                                                    : "New Session"}
                                            </p>
                                            <p className="text-[10px] text-primary/70 mt-3 font-medium">
                                                {session.messages ? session.messages.length : 0} Messages
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 w-full h-full">
                            <AvatarExperience isTalking={isTalking} avatarType={avatarType} />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
