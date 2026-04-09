// This is in app/components/dashboard/Reminder/RemindersList.jsx

import ReminderRow from "./ReminderRow";
import { Inbox, FilterX } from "lucide-react";

export default function RemindersList({ selectedFilter, remindersData, onToggle, onReminderUpdated, handleReminderDeleted }) {

    const filteredReminders = selectedFilter === 'all'
        ? remindersData
        : remindersData.filter((reminder) => reminder.status === selectedFilter);

    // No reminders at all
    if (remindersData.length === 0) {
        return (
            <div className="flex flex-col gap-2 justify-center items-center text-muted-foreground py-16">
                <Inbox className="h-10 w-10 opacity-50" />
                <p className="text-sm">No reminders yet. Add one to get started!</p>
            </div>
        );
    }

    // Reminders exist but none match the selected filter
    if (filteredReminders.length === 0) {
        const filterLabel = selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1);
        return (
            <div className="flex flex-col gap-2 justify-center items-center text-muted-foreground py-16">
                <FilterX className="h-10 w-10 opacity-50" />
                <p className="text-sm">No <span className="font-medium">{filterLabel}</span> reminders found.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {filteredReminders.map((reminder) => (
                <ReminderRow
                    key={reminder._id}
                    reminder={reminder}
                    onToggle={onToggle}
                    onReminderUpdated={onReminderUpdated}
                    onReminderDeleted={handleReminderDeleted}
                />
            ))}
        </div>
    );
}
