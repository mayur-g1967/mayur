"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { User, Bell, Palette, Moon, Sun, Monitor, ShieldCheck, Mail, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SettingsModal({ isOpen, onClose }) {
    const { theme, setTheme } = useTheme();

    // Settings State
    const [settings, setSettings] = useState({
        emailHints: true,
        activityEmails: true,
        marketingEmails: false,
        pushNotifications: true,
        dataSharing: false,
        publicProfile: true,
    });

    const handleToggle = (key) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        toast.success("Settings saved successfully!");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden dark:bg-persona-dark dark:border-white/10 dark:text-persona-cream shadow-2xl">

                {/* Header Area */}
                <div className="bg-gradient-to-r from-primary/10 to-transparent dark:from-primary/20 pt-6 px-6 pb-4 border-b border-border dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            Settings
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground dark:text-persona-cream/70">
                            Manage your account settings and preferences.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Tabs Area */}
                <Tabs defaultValue="appearance" className="w-full">
                    <div className="px-6 pt-4 border-b border-border dark:border-white/10">
                        <TabsList className="w-full grid grid-cols-3 bg-muted/50 dark:bg-black/20 p-1 rounded-lg">
                            <TabsTrigger value="appearance" className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
                                <Palette className="w-4 h-4" /> Appearance
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
                                <Bell className="w-4 h-4" /> Notifications
                            </TabsTrigger>
                            <TabsTrigger value="privacy" className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
                                <ShieldCheck className="w-4 h-4" /> Privacy
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6 h-[350px] overflow-y-auto no-scrollbar">
                        {/* APPEARANCE TAB */}
                        <TabsContent value="appearance" className="m-0 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-white flex items-center gap-2">
                                    Theme Preferences
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Light Theme Option */}
                                    <button
                                        onClick={() => setTheme("light")}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 border rounded-xl gap-3 transition-all cursor-pointer",
                                            theme === "light"
                                                ? "border-primary bg-primary/10 dark:bg-white/10 ring-2 ring-primary/20"
                                                : "border-border hover:border-primary/50 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <Sun className={cn("w-6 h-6", theme === "light" ? "text-primary dark:text-white" : "text-muted-foreground")} />
                                        <span className={cn("font-medium", theme === "light" ? "text-primary dark:text-white" : "text-muted-foreground")}>Light</span>
                                    </button>

                                    {/* Dark Theme Option */}
                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 border rounded-xl gap-3 transition-all cursor-pointer",
                                            theme === "dark"
                                                ? "border-primary bg-primary/10 dark:bg-white/10 ring-2 ring-primary/20"
                                                : "border-border hover:border-primary/50 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <Moon className={cn("w-6 h-6", theme === "dark" ? "text-primary dark:text-white" : "text-muted-foreground")} />
                                        <span className={cn("font-medium", theme === "dark" ? "text-primary dark:text-white" : "text-muted-foreground")}>Dark</span>
                                    </button>

                                    {/* System Theme Option */}
                                    <button
                                        onClick={() => setTheme("system")}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 border rounded-xl gap-3 transition-all cursor-pointer",
                                            theme === "system"
                                                ? "border-primary bg-primary/10 dark:bg-white/10 ring-2 ring-primary/20"
                                                : "border-border hover:border-primary/50 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <Monitor className={cn("w-6 h-6", theme === "system" ? "text-primary dark:text-white" : "text-muted-foreground")} />
                                        <span className={cn("font-medium", theme === "system" ? "text-primary dark:text-white" : "text-muted-foreground")}>System</span>
                                    </button>
                                </div>
                            </div>
                        </TabsContent>

                        {/* NOTIFICATIONS TAB */}
                        <TabsContent value="notifications" className="m-0 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-white">Email Notifications</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-4 dark:border-white/10 bg-background/50 dark:bg-white/5">
                                        <div className="space-y-0.5">
                                            <Label className="text-base flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted-foreground" /> Learning Reminders
                                            </Label>
                                            <p className="text-sm text-muted-foreground dark:text-persona-cream/60">
                                                Receive daily summaries and module hints.
                                            </p>
                                        </div>
                                        <Switch checked={settings.emailHints} onCheckedChange={() => handleToggle("emailHints")} />
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4 dark:border-white/10 bg-background/50 dark:bg-white/5">
                                        <div className="space-y-0.5">
                                            <Label className="text-base flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" /> Account Activity
                                            </Label>
                                            <p className="text-sm text-muted-foreground dark:text-persona-cream/60">
                                                Security alerts and profile updates.
                                            </p>
                                        </div>
                                        <Switch checked={settings.activityEmails} onCheckedChange={() => handleToggle("activityEmails")} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-white mt-6">Push Notifications</h3>
                                <div className="flex items-center justify-between rounded-lg border p-4 dark:border-white/10 bg-background/50 dark:bg-white/5">
                                    <div className="space-y-0.5">
                                        <Label className="text-base flex items-center gap-2">
                                            <Smartphone className="w-4 h-4 text-muted-foreground" /> Mobile Alerts
                                        </Label>
                                        <p className="text-sm text-muted-foreground dark:text-persona-cream/60">
                                            Get real-time updates directly on your device.
                                        </p>
                                    </div>
                                    <Switch checked={settings.pushNotifications} onCheckedChange={() => handleToggle("pushNotifications")} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* PRIVACY TAB */}
                        <TabsContent value="privacy" className="m-0 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-white">Data & Privacy</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-4 dark:border-white/10 bg-background/50 dark:bg-white/5">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Public Profile</Label>
                                            <p className="text-sm text-muted-foreground dark:text-persona-cream/60">
                                                Allow others to see your learning achievements.
                                            </p>
                                        </div>
                                        <Switch checked={settings.publicProfile} onCheckedChange={() => handleToggle("publicProfile")} />
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4 dark:border-white/10 bg-background/50 dark:bg-white/5">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Data Sharing (Analytics)</Label>
                                            <p className="text-sm text-muted-foreground dark:text-persona-cream/60">
                                                Help us improve by sharing anonymous usage data.
                                            </p>
                                        </div>
                                        <Switch checked={settings.dataSharing} onCheckedChange={() => handleToggle("dataSharing")} />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Footer Area */}
                <DialogFooter className="px-6 py-4 border-t border-border dark:border-white/10 bg-muted/50 dark:bg-black/20 flex sm:justify-between items-center">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        Changes are saved automatically.
                    </p>
                    <button
                        onClick={handleSave}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                        Done
                    </button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
