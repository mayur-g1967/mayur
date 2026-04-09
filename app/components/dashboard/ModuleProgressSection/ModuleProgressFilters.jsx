'use client'

import { Star, CircleCheck, Loader, Clock, ChevronDown } from "lucide-react"

import { SortAsc, SortDesc, BarChart3 } from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProgressStatusFilter({ value, onValueChange }) {
  return (
    <ToggleGroup type="single" variant="outline" spacing={2} value={value} onValueChange={onValueChange} className="flex-wrap">
      <ToggleGroupItem
        value="all"
        aria-label="Toggle All"
        className="hover:text-foreground hover:bg-primary/10 transition-colors data-[state=on]:bg-red-500/20 data-[state=on]:text-red-500 [&[data-state=on]>svg]:fill-red-500 [&[data-state=on]>svg]:text-white data-[state=on]:border-red-800"
      >
        <Star />
        All
      </ToggleGroupItem>
      <ToggleGroupItem
        value="completed"
        aria-label="Toggle Completed"
        className="hover:text-foreground hover:bg-primary/10 transition-colors data-[state=on]:bg-green-500/20 data-[state=on]:text-green-500 [&[data-state=on]>svg]:fill-green-500 [&[data-state=on]>svg]:text-white data-[state=on]:border-green-800"
      >
        <CircleCheck />
        Completed
      </ToggleGroupItem>
      <ToggleGroupItem
        value="inprogress"
        aria-label="Toggle In Progress"
        className="hover:text-foreground hover:bg-primary/10 transition-colors data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 [&[data-state=on]>svg]:fill-blue-400 data-[state=on]:border-blue-800"
      >
        <Loader />
        In Progress
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export function CategoryFilter({ value, onValueChange }) {
  const labels = {
    all: "All",
    confidencecoach: "Confidence Coach",
    inquizzo: "InQuizzo",
    microlearning: "Micro-Learning",
    socialmentor: "AI Social Mentor"
  }

  return (
    <DropdownMenu value={value} onValueChange={onValueChange}>
      <DropdownMenuTrigger asChild className="cursor-pointer border-muted border-2 hover:border-ring transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-foreground w-full md:w-auto">
        <button className="flex items-center gap-1 px-3 py-1 rounded-lg border text-sm bg-transparent transition w-full md:w-auto min-w-0 overflow-hidden">
          <span className="truncate">{labels[value]}</span> <ChevronDown className="shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10}>
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange} >
          <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="confidencecoach">Confidence Coach</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="inquizzo">InQuizzo</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="microlearning">Micro-Learning</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="socialmentor">AI Social Mentor</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu >
  )
}

export function SortSelect({ value, onValueChange }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className="
          flex items-center gap-1
          px-3 py-1
          border-2 border-muted
          rounded-lg
          text-sm
          dark:hover:bg-transparent
          hover:border-ring hover:bg-primary/10
          hover:text-foreground
          transition-all duration-200 ease-in-out
          cursor-pointer
          w-full md:w-auto min-w-0
          [&>span]:truncate
        "
      >
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>

      <SelectContent align="end" sideOffset={5}>
        <SelectItem value="recent">
          <Clock className="h-4 w-4 mr-2" />
          Recent
        </SelectItem>

        <SelectItem value="progress-desc">
          <BarChart3 className="h-4 w-4 mr-2" />
          Progress: High → Low
        </SelectItem>

        <SelectItem value="progress-asc">
          <BarChart3 className="h-4 w-4 mr-2 rotate-180" />
          Progress: Low → High
        </SelectItem>

        <SelectItem value="az">
          <SortAsc className="h-4 w-4 mr-2" />
          A → Z
        </SelectItem>

        <SelectItem value="za">
          <SortDesc className="h-4 w-4 mr-2" />
          Z → A
        </SelectItem>
      </SelectContent>
    </Select>
  )
}