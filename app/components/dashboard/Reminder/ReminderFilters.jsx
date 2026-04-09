// This is in app/components/dashboard/Reminder/ReminderFilters.jsx

import { Star, CircleCheck, CalendarArrowUp, Clock, AlertCircle } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";

export function ReminderFilters({ value, onValueChange }) {
    return (
        <div className="flex items-center w-full relative">
            <ToggleGroup type="single" variant="outline" spacing={2} className="grid grid-cols-2 w-full" value={value} onValueChange={onValueChange}>
                <ToggleGroupItem
                    value="all"
                    aria-label="Toggle All"
                    className="hover:text-foreground hover:bg-primary/10 transition-colors data-[state=on]:bg-red-500/20 data-[state=on]:text-red-500 [&[data-state=on]>svg]:fill-red-500 [&[data-state=on]>svg]:text-white data-[state=on]:border-red-800"
                >
                    <Star className="shrink-0" />
                    <span className="truncate">All</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                    value="completed"
                    aria-label="Toggle Completed"
                    className="hover:text-foreground hover:bg-primary/10 transition-colors data-[state=on]:bg-green-500/20 data-[state=on]:text-green-500 [&[data-state=on]>svg]:fill-green-500 [&[data-state=on]>svg]:text-white data-[state=on]:border-green-800"
                >
                    <CircleCheck className="shrink-0" />
                    <span className="truncate">Completed</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                    value="upcoming"
                    aria-label="Toggle Upcoming"
                    className="hover:text-foreground hover:bg-primary/10 transition-colors data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 [&[data-state=on]>svg]:fill-blue-400 data-[state=on]:border-blue-800 [&[data-state=on]>svg]:text-white"
                >
                    <CalendarArrowUp className="shrink-0" />
                    <span className="truncate">Upcoming</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                    value="pending"
                    aria-label="Toggle Pending"
                    className="hover:text-foreground hover:bg-primary/10 transition-colors data-[state=on]:bg-yellow-500/20 data-[state=on]:text-white [&[data-state=on]>svg]:fill-yellow-400 [&[data-state=on]>svg]:stroke-white data-[state=on]:border-yellow-800 [&[data-state=on]>svg]:text-white"
                >
                    <Clock className="shrink-0" />
                    <span className="truncate">Pending</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                    value="overdue"
                    aria-label="Toggle Overdue"
                    className="hover:text-foreground hover:bg-primary/10 transition-colors data-[state=on]:bg-orange-500/20 data-[state=on]:text-orange-500 [&[data-state=on]>svg]:fill-orange-500 [&[data-state=on]>svg]:text-white data-[state=on]:border-orange-800"
                >
                    <AlertCircle className="shrink-0" />
                    <span className="truncate">Overdue</span>
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    )
}