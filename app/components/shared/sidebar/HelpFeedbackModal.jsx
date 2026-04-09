"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import { MessageCircleQuestionMark, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function HelpFeedbackModal({ isOpen, onClose }) {
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === "light";
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        type: "feedback",
        subject: "",
        message: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject.trim() || !formData.message.trim()) {
            toast.error("Please fill in all fields.");
            return;
        }

        setIsSubmitting(true);

        // Simulate network delay for premium feel
        await new Promise((resolve) => setTimeout(resolve, 1200));

        toast.success("Thank you! Your message has been sent to our team.");

        // Reset and close
        setFormData({ type: "feedback", subject: "", message: "" });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className={cn(
                    "sm:max-w-[450px] p-0 overflow-hidden border-0 shadow-2xl",
                    isLight ? "bg-white/95" : "bg-[#0A0810]/95"
                )}
                style={{
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    boxShadow: isLight
                        ? "0 20px 40px rgba(101, 90, 124, 0.15)"
                        : "0 20px 40px rgba(0, 0, 0, 0.4)",
                }}
            >
                {/* Header with Gradient */}
                <div
                    className={cn(
                        "relative px-6 py-5 overflow-hidden",
                        isLight
                            ? "bg-gradient-to-r from-[#EBE6FF] to-white border-b border-[#655A7C]/10"
                            : "bg-gradient-to-r from-primary/10 to-transparent border-b border-white/5"
                    )}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <div
                                className={cn(
                                    "p-2 rounded-lg",
                                    isLight ? "bg-white shadow-sm text-primary" : "bg-primary/20 text-white"
                                )}
                            >
                                <MessageCircleQuestionMark className="w-5 h-5" />
                            </div>
                            <span className={isLight ? "text-foreground" : "text-persona-cream"}>
                                Help & Support
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5">
                    <DialogDescription className="mb-6">
                        Encountered an issue or have a brilliant idea for InQuizzo? We'd love to hear from you.
                    </DialogDescription>

                    <form id="feedback-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className={isLight ? "text-foreground font-medium" : "text-persona-cream/90"}>
                                What is this regarding?
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger
                                    className={cn(
                                        "w-full transition-all duration-200 border-opacity-50",
                                        isLight
                                            ? "bg-white border-[#655A7C]/20 hover:border-primary focus:ring-primary/20"
                                            : "bg-[#0A0810]/50 border-white/10 hover:border-white/20 focus:ring-white/10 text-white"
                                    )}
                                >
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className={isLight ? "bg-white" : "bg-[#1A1820] text-white border-white/10"}>
                                    <SelectItem value="feedback">General Feedback</SelectItem>
                                    <SelectItem value="bug">Report a Bug</SelectItem>
                                    <SelectItem value="feature">Feature Request</SelectItem>
                                    <SelectItem value="question">Question / Help</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className={isLight ? "text-foreground font-medium" : "text-persona-cream/90"}>
                                Subject
                            </Label>
                            <Input
                                placeholder="Briefly describe the topic..."
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className={cn(
                                    "w-full transition-all duration-200 border-opacity-50",
                                    isLight
                                        ? "bg-white border-[#655A7C]/20 hover:border-primary focus:ring-primary/20"
                                        : "bg-[#0A0810]/50 border-white/10 hover:border-white/20 focus:ring-white/10 text-white placeholder:text-white/40"
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className={isLight ? "text-foreground font-medium" : "text-persona-cream/90"}>
                                Message
                            </Label>
                            <Textarea
                                placeholder="Give us all the details here..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className={cn(
                                    "w-full min-h-[120px] resize-none transition-all duration-200 border-opacity-50",
                                    isLight
                                        ? "bg-white border-[#655A7C]/20 hover:border-primary focus:ring-primary/20"
                                        : "bg-[#0A0810]/50 border-white/10 hover:border-white/20 focus:ring-white/10 text-white placeholder:text-white/40"
                                )}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div
                    className={cn(
                        "px-6 py-4 flex justify-end gap-3",
                        isLight
                            ? "bg-[#F8F7FF] border-t border-[#655A7C]/10"
                            : "bg-[#1A1820]/50 border-t border-white/5"
                    )}
                >
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className={cn(
                            "font-medium border-opacity-50",
                            isLight
                                ? "bg-white border-[#655A7C]/20 hover:bg-[#F0EBFF] text-[#655A7C]"
                                : "bg-transparent border-white/10 hover:bg-white/5 text-white/80"
                        )}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="feedback-form"
                        disabled={isSubmitting}
                        className={cn(
                            "font-medium shadow-md transition-all",
                            isLight
                                ? "bg-primary hover:bg-primary/90 text-white"
                                : "bg-primary hover:bg-primary/90 text-white"
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
