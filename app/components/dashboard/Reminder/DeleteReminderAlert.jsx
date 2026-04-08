"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteReminderAlert({ children, reminder, onReminderDeleted }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async (e) => {
    // Prevent closing immediately so we can show loading state
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/dashboard/reminders/${reminder._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`, // ADD THIS
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete reminder");
      }

      console.log("Reminder deleted:", result);

      // Close the dialog
      setOpen(false);

      // Notify parent to remove from state
      if (onReminderDeleted) {
        onReminderDeleted(reminder._id);
      }
      toast.success("Reminder deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "Could not delete reminder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the reminder:
            <span className="font-semibold text-foreground block mt-1 italic">
              "{reminder.title}"
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="cursor-pointer hover:bg-muted"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-500 hover:bg-red-700 text-white cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}