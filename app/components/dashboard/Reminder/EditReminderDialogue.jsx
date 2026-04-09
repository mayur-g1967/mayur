"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarClock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function EditReminderDialog({ children, reminder, onReminderUpdated }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Styled exactly like your NewReminderDialog
  const [formData, setFormData] = useState({
    title: "",
    datetime: "",
    module: "Confidence Coach",
    priority: "medium",
  });

  // Load existing reminder data when dialog opens
  useEffect(() => {
    if (open && reminder) {
      setFormData({
        title: reminder.title || "",
        // Formats the Date object for the datetime-local input
        datetime: reminder.date ? new Date(
          new Date(reminder.date).getTime() -
          new Date(reminder.date).getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16) : "",
        module: reminder.module || "Confidence Coach",
        priority: reminder.priority || "medium",
      });
    }
  }, [open, reminder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validations matching your style
      if (!formData.title.trim()) {
        setError("Title is required");
        setLoading(false);
        return;
      }

      if (!formData.datetime) {
        setError("Date and time are required");
        setLoading(false);
        return;
      }

      // Prepare data for API matching your Schema
      const reminderData = {
        title: formData.title.trim(),
        module: formData.module,
        date: formData.datetime,
        priority: formData.priority,
      };

      console.log("Updating reminder:", reminderData);

      // Dynamic PUT request to your API
      const response = await fetch(`/api/dashboard/reminders/${reminder._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`, // ADD THIS
        },
        body: JSON.stringify(reminderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update reminder");
      }

      console.log("Reminder updated successfully:", result);

      // Close dialog and notify parent
      setOpen(false);

      if (onReminderUpdated) {
        onReminderUpdated(result.data);
      }
      toast.success("Reminder updated successfully!");
    } catch (err) {
      console.error("Error updating reminder:", err);
      setError(err.message || "Something went wrong");
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Input handlers adopted from NewReminderDialog
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-105 bg-card text-card-foreground border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              Edit Reminder
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update your reminder details.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm mt-4">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Reminder title</Label>
              <Input
                id="title"
                placeholder="e.g. Daily voice practice"
                value={formData.title}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="datetime">Date & time</Label>
              <div className="relative">
                <CalendarClock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="datetime"
                  type="datetime-local"
                  className="pl-9"
                  value={formData.datetime}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="module">Module</Label>
              <Select
                value={formData.module}
                onValueChange={(value) => handleSelectChange("module", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Confidence Coach">Confidence Coach</SelectItem>
                  <SelectItem value="Social Mentor">Social Mentor</SelectItem>
                  <SelectItem value="Micro-Learning">Micro-Learning</SelectItem>
                  <SelectItem value="InQuizzo">InQuizzo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleSelectChange("priority", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Saving..." : "Apply Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}