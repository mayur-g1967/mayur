"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, UserIcon, AtSign, FileText, X, Save } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function ProfileModal({ isOpen, onClose, onProfileUpdate }) {
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        firstName: "",
        lastName: "",
        username: "",
        picture: "",
    });

    // Keep local state in sync with localStorage data when modal opens
    useEffect(() => {
        if (isOpen) {
            const storedUser = localStorage.getItem("user");
            let userData = {};
            if (storedUser) {
                try {
                    userData = JSON.parse(storedUser);
                } catch (_) { }
            }

            const nameParts = (userData.name || "").split(" ");
            setProfileForm({
                firstName: userData.firstName || nameParts[0] || "",
                lastName: userData.lastName || nameParts.slice(1).join(" ") || "",
                username: userData.username || "",
                picture: userData.picture || "",
            });
        }
    }, [isOpen]);

    const getInitials = (name) => {
        if (!name || name.trim() === "") return "GU";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm((f) => ({ ...f, picture: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const token = localStorage.getItem("token");

            const res = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstName: profileForm.firstName,
                    lastName: profileForm.lastName,
                    username: profileForm.username,
                    picture: profileForm.picture,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to update profile");
                return;
            }

            // Update localStorage with new user info
            const storedUser = localStorage.getItem("user");
            const existingUser = storedUser ? JSON.parse(storedUser) : {};
            const updatedUser = {
                ...existingUser,
                name: data.user.name,
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                username: data.user.username,
                picture: data.user.picture,
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            if (onProfileUpdate) {
                onProfileUpdate(updatedUser);
            }

            toast.success("Profile updated successfully!");
            onClose();
        } catch (error) {
            console.error("Profile save error:", error);
            toast.error("Could not save profile. Please try again.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden dark:bg-persona-dark dark:border-white/10 dark:text-persona-cream shadow-2xl">

                {/* Header Area (Matches SettingsModal) */}
                <div className="bg-gradient-to-r from-primary/10 to-transparent dark:from-primary/20 pt-6 px-6 pb-4 border-b border-border dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <UserIcon className="w-6 h-6 text-primary" />
                            Edit Profile
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground dark:text-persona-cream/70 mt-1">
                            Update your personal information and public presence.
                        </p>
                    </DialogHeader>

                    {/* Avatar Area */}
                    <div className="mt-6 flex items-center gap-4">
                        <div className="relative shrink-0 group">
                            <label className="cursor-pointer">
                                <Avatar className="w-16 h-16 rounded-2xl ring-2 ring-primary/30 transition-opacity group-hover:opacity-80">
                                    <AvatarImage
                                        src={profileForm.picture || "https://github.com/shadcn.png"}
                                        alt="Profile preview"
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="text-lg rounded-2xl bg-muted dark:bg-white/5">
                                        {getInitials(`${profileForm.firstName} ${profileForm.lastName}`)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                                    <Camera className="w-3.5 h-3.5 text-white" />
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-muted-foreground dark:text-persona-cream/60 uppercase tracking-wider flex justify-between items-center">
                                <span>Profile Picture URL</span>
                                {profileForm.picture?.startsWith('data:image') && (
                                    <span className="text-green-500 font-semibold normal-case">Local ready</span>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder={profileForm.picture?.startsWith('data:image') ? "Local image attached..." : "https://example.com/avatar.jpg"}
                                value={profileForm.picture?.startsWith('data:image') ? "" : profileForm.picture}
                                onChange={(e) => setProfileForm((f) => ({ ...f, picture: e.target.value }))}
                                disabled={profileForm.picture?.startsWith('data:image')}
                                className="mt-1.5 w-full text-sm px-3 py-2 rounded-lg border border-border dark:border-white/10 bg-background/50 dark:bg-white/5 dark:text-persona-cream placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {profileForm.picture?.startsWith('data:image') && (
                                <button
                                    type="button"
                                    onClick={() => setProfileForm(f => ({ ...f, picture: "" }))}
                                    className="mt-1.5 text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer font-medium"
                                >
                                    Remove local image
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-persona-cream/60 uppercase tracking-wider mb-1.5">
                                First Name
                            </label>
                            <input
                                type="text"
                                placeholder="First"
                                value={profileForm.firstName}
                                onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                                className="w-full text-sm px-3 py-2.5 rounded-lg border border-border dark:border-white/10 bg-background/50 dark:bg-white/5 dark:text-persona-cream placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-persona-cream/60 uppercase tracking-wider mb-1.5">
                                Last Name
                            </label>
                            <input
                                type="text"
                                placeholder="Last"
                                value={profileForm.lastName}
                                onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                                className="w-full text-sm px-3 py-2.5 rounded-lg border border-border dark:border-white/10 bg-background/50 dark:bg-white/5 dark:text-persona-cream placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-persona-cream/60 uppercase tracking-wider mb-1.5">
                            <AtSign className="w-3.5 h-3.5" /> Username
                        </label>
                        <input
                            type="text"
                            placeholder="Username"
                            value={profileForm.username}
                            onChange={(e) => setProfileForm((f) => ({ ...f, username: e.target.value }))}
                            className="w-full text-sm px-3 py-2.5 rounded-lg border border-border dark:border-white/10 bg-background/50 dark:bg-white/5 dark:text-persona-cream placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                </div>

                {/* Footer Area (Matches SettingsModal) */}
                <DialogFooter className="px-6 py-4 border-t border-border dark:border-white/10 bg-muted/50 dark:bg-black/20 flex sm:justify-between items-center">
                    <button
                        onClick={onClose}
                        disabled={isSavingProfile}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-border dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white font-medium transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSavingProfile ? "Saving..." : "Save Changes"}
                    </button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
