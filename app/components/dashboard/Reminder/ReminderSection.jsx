// This is in app/components/dashboard/Reminder/ReminderSection.jsx

'use client';

import { ReminderFilters } from "./ReminderFilters.jsx";
import ReminderList from "./RemindersList.jsx";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Plus, Loader2, RefreshCw, Bell } from "lucide-react";
import { NewReminderDialog } from "./NewReminderDialog.jsx";
import { isAuthenticated, clearAuth } from "@/lib/auth-client";

export default function ReminderSection() {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch reminders function
    const fetchReminders = async () => {
        if (!isAuthenticated()) {
            clearAuth();
            window.location.href = '/login';
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("/api/dashboard/reminders", {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setReminders(result.data);
            } else {
                console.error("Failed to fetch:", result.error);
            }
        } catch (error) {
            if (error.name !== 'TypeError' || error.message !== 'Failed to fetch') {
                console.error("Error fetching reminders:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    // Refresh reminders function
    const handleRefresh = async () => {
        if (!isAuthenticated()) {
            clearAuth();
            window.location.href = '/login';
            return;
        }

        setRefreshing(true);
        try {
            const [response] = await Promise.all([
                fetch("/api/dashboard/reminders", {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }),
                new Promise(resolve => setTimeout(resolve, 600)) // Min delay to show animation
            ]);

            const result = await response.json();

            if (response.ok && result.success) {
                setReminders(result.data);
            } else {
                console.error("Failed to fetch:", result.error);
            }
        } catch (error) {
            if (error.name !== 'TypeError' || error.message !== 'Failed to fetch') {
                console.error("Error fetching reminders:", error);
            }
        } finally {
            setRefreshing(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchReminders();
    }, []);

    const handleReminderCreated = (newReminder) => {
        setReminders((prev) => [newReminder, ...prev]);
    };

    const handleReminderUpdated = (updatedReminder) => {
        setReminders((prev) =>
            prev.map((rem) => (rem._id === updatedReminder._id ? updatedReminder : rem))
        );
    };

    const handleReminderDeleted = (deletedId) => {
        setReminders((prev) => prev.filter(reminder => reminder._id !== deletedId));
    };

    const toggleReminderStatus = async (id) => {
        const reminderToUpdate = reminders.find(r => r._id === id);
        if (!reminderToUpdate) return;

        const newStatus = reminderToUpdate.status === "completed" ? "pending" : "completed";
        const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

        try {
            const response = await fetch(`/api/dashboard/reminders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...reminderToUpdate,
                    status: newStatus,
                    completedAt: completedAt
                }),
            });

            if (response.ok) {
                setReminders(prev =>
                    prev.map(rem =>
                        rem._id === id
                            ? { ...rem, status: newStatus, completedAt: completedAt }
                            : rem
                    )
                );
            }
        } catch (error) {
            console.error("Failed to toggle status:", error);
        }
    };

    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';

    const t = isLight ? {
        cardBg: 'var(--card)',
        cardBorder: 'var(--border)',
        primary: '#9067C6',
        textMuted: '#655A7C',
        separator: 'var(--border)',
    } : {
        cardBg: 'var(--card)',
        cardBorder: 'var(--border)',
        primary: '#934cf0',
        textMuted: '#94A3B8',
        separator: 'var(--border)',
    };

    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="col-span-full lg:col-span-1 h-[500px] flex flex-col backdrop-blur-[12px] border rounded-2xl shadow-xl overflow-hidden"
            style={{
                backgroundColor: t.cardBg,
                borderColor: t.cardBorder,
                boxShadow: `0 10px 30px -15px ${isLight ? 'rgba(0,0,0,0.1)' : t.primary + '22'}`,
            }}
        >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex flex-col gap-3" style={{ borderBottom: `1px solid ${t.separator}` }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: t.primary + '1A', border: `1px solid ${t.primary}33` }}
                        >
                            <Bell className="size-3.5" style={{ color: t.primary }} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: t.textMuted }}>Reminders</span>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                            style={{ color: t.textMuted }}
                        >
                            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <NewReminderDialog onReminderCreated={handleReminderCreated}>
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: t.primary }}
                        >
                            <Plus className="size-3" />
                            <span className="hidden lg:inline xl:hidden">Add</span>
                            <span className="hidden 2xl:inline">Add Reminder</span>
                        </button>
                    </NewReminderDialog>
                </div>
                <ReminderFilters
                    value={selectedFilter}
                    onValueChange={(value) => {
                        if (!value) return;
                        setSelectedFilter(value);
                    }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
                {loading || refreshing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                        <Loader2 className="h-7 w-7 animate-spin" style={{ color: t.primary }} />
                        <p className="text-xs" style={{ color: t.textMuted }}>
                            {refreshing ? 'Refreshing...' : 'Loading reminders...'}
                        </p>
                    </div>
                ) : (
                    <ReminderList
                        remindersData={reminders}
                        selectedFilter={selectedFilter}
                        onToggle={toggleReminderStatus}
                        handleReminderDeleted={handleReminderDeleted}
                        onReminderUpdated={handleReminderUpdated}
                    />
                )}
            </div>
        </motion.div>
    );
}