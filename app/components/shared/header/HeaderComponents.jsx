'use client'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Bell, Sun, Moon, MonitorCog, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { isAuthenticated, clearAuth } from "@/lib/auth-client";
import { toast } from 'sonner';

export function DateFilter({ value, onValueChange }) {
    return (
        <div className='w-24 md:w-32 h-10 md:h-20 flex items-center justify-center rounded-lg'>
            <Select value={value} onValueChange={onValueChange} modal={false}>
                <SelectTrigger className={cn(
                    "h-10 md:h-20 w-full bg-transparent text-foreground border-ring/5 py-2 border-2 cursor-pointer transition-all duration-200 ease-in-out",
                    "hover:border-ring hover:border-2"
                )}>
                    <SelectValue placeholder="Date Filter" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="last7">Last 7 Days</SelectItem>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

export function Notifications() {
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const lastNotificationCount = useRef(0);
    const audioRef = useRef(null);

    // Request notification permission & setup audio
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        audioRef.current = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
    }, []);

    const fetchNotifications = async () => {
        if (!isAuthenticated()) {
            clearAuth();
            window.location.href = '/login';
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("/api/notifications", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                const newNotifications = result.data || [];
                const newUnreadCount = newNotifications.filter((n) => !n.read).length;

                // New notification detected
                if (newUnreadCount > lastNotificationCount.current) {
                    const latest = newNotifications.find(n => !n.read);

                    // Play sound
                    audioRef.current?.play().catch(() => { });

                    // Browser notification
                    if (Notification.permission === 'granted' && latest) {
                        new Notification(latest.title, {
                            body: latest.message,
                            icon: '/favicon.ico',
                        });
                    }
                }

                lastNotificationCount.current = newUnreadCount;
                setNotifications(newNotifications);
                setUnreadCount(newUnreadCount);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation(); // Prevent marking as read when clicking delete
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.ok) {
                toast.success('Notification deleted');
                fetchNotifications();
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const deleteAllNotifications = async () => {
        try {
            const response = await fetch("/api/notifications", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.ok) {
                toast.success('All notifications cleared');
                fetchNotifications();
            }
        } catch (error) {
            console.error("Error deleting all notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // 10s for testing
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={cn(
            "h-10 w-10 border-0 border-ring flex items-center justify-center rounded-lg transition-all duration-100 ease-in-out cursor-pointer relative",
            "hover:border-ring hover:border-2"
        )}>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild className="cursor-pointer">
                    <button className="relative focus:outline-none focus-visible:ring-0">
                        <Bell />
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    sideOffset={15}
                    alignOffset={-5}
                    className="notification-dropdown w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] flex flex-col p-0 overflow-hidden border border-black/5 dark:border-white/10 backdrop-blur-xl bg-card/70 shadow-2xl"
                >
                    {/* Header — sticky, never scrolls */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5 sticky top-0 bg-transparent z-10 shrink-0">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Notifications</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={deleteAllNotifications}
                                    className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List — scrolls independently */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-4 text-center text-muted-foreground">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                <Bell className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification._id}
                                    className={cn(
                                        "p-4 cursor-pointer border-b border-black/5 dark:border-white/5 last:border-b-0 focus:bg-primary/5 transition-colors",
                                        !notification.read && "bg-primary/10 dark:bg-primary/5"
                                    )}
                                    onClick={() => markAsRead(notification._id)}
                                >
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <span className="font-semibold text-sm block">
                                                    {notification.title}
                                                </span>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                {!notification.read && (
                                                    <span className="h-2 w-2 bg-blue-500 rounded-full shrink-0" />
                                                )}
                                                <button
                                                    onClick={(e) => deleteNotification(notification._id, e)}
                                                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-muted-foreground">
                                                {notification.module}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export function Theme() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';
    return (
        <div className={cn("h-10 w-10 border-0 border-ring flex items-center justify-center rounded-lg transition-all duration-100 ease-in-out cursor-pointer",
            "hover:border-ring hover:border-2"
        )} >
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild className="cursor-pointer">
                    <button className="focus:outline-none focus-visible:ring-0">
                        <Sun className='scale-100 dark:scale-0' />
                        <Moon className='absolute -translate-y-6 scale-0 dark:scale-100' />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    sideOffset={15}
                    alignOffset={-5}
                    className="border dark:border-white/10 backdrop-blur-[12px] bg-background/80"
                >
                    <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                        <Sun /> Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                        <Moon /> Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                        <MonitorCog /> System
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
