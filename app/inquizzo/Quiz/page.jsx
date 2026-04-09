// // location : app/inquizzo/Quiz/page.jsx

// 'use client'

// import React, { useState, useMemo } from 'react'
// import CursorGlow from '@/app/components/inquizzo/effects/CursorGlow'
// import SpotlightCard from '@/app/components/inquizzo/effects/SpotlightCard'
// import { useRouter } from 'next/navigation'
// import Header from '@/app/components/shared/header/Header.jsx'
// import { Card } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Progress } from "@/components/ui/progress"
// import { Button } from "@/components/ui/button"
// import {
//   Search,
//   SortAsc,
//   SortDesc,
//   Clock,
//   BarChart3,
//   Star,
//   CircleCheck,
//   Loader,
//   ChevronDown,
//   Brain,
//   Filter
// } from "lucide-react"
// import {
//   ToggleGroup,
//   ToggleGroupItem,
// } from "@/components/ui/toggle-group"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuRadioItem,
//   DropdownMenuRadioGroup,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { QUIZ_STRUCTURE } from '@/lib/quizData'
// import { cn } from "@/lib/utils"

// export default function QuizBrowser() {
//   const router = useRouter();
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [domainFilter, setDomainFilter] = useState('all');
//   const [sortOption, setSortOption] = useState('recent');
//   const [searchQuery, setSearchQuery] = useState('');

//   const today = new Date().toLocaleDateString('en-GB', {
//     weekday: 'short',
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric'
//   });

//   // Flatten the recursive QUIZ_STRUCTURE for the list
//   const allTopics = useMemo(() => {
//     const flattened = [];
//     Object.entries(QUIZ_STRUCTURE).forEach(([domainKey, domain]) => {
//       Object.entries(domain.categories).forEach(([catKey, category]) => {
//         Object.entries(category.subCategories).forEach(([subCatKey, subCategory]) => {
//           Object.entries(subCategory.topics).forEach(([topicKey, topic]) => {
//             // Mock progress for the browser look
//             const mockProgress = Math.random() > 0.7 ? (Math.random() > 0.5 ? 100 : Math.floor(Math.random() * 90) + 10) : 0;
//             flattened.push({
//               id: topicKey,
//               name: topic.name,
//               domain: domain.name,
//               domainId: domainKey,
//               category: category.name,
//               subCategory: subCategory.name,
//               progress: mockProgress,
//               path: `/inquizzo/QuizDomainSelection?domain=${domainKey}&category=${catKey}&subCategory=${subCatKey}&topic=${topicKey}`
//             });
//           });
//         });
//       });
//     });
//     return flattened;
//   }, []);

//   const filteredTopics = useMemo(() => {
//     let result = [...allTopics];

//     // Status Filter
//     if (statusFilter !== 'all') {
//       result = result.filter(t => {
//         if (statusFilter === 'completed') return t.progress === 100;
//         if (statusFilter === 'inprogress') return t.progress > 0 && t.progress < 100;
//         if (statusFilter === 'pending') return t.progress === 0;
//         return true;
//       });
//     }

//     // Domain Filter
//     if (domainFilter !== 'all') {
//       result = result.filter(t => t.domainId === domainFilter);
//     }

//     // Search
//     if (searchQuery) {
//       result = result.filter(t =>
//         t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         t.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         t.category.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     // Sorting
//     if (sortOption === 'progress-desc') {
//       result.sort((a, b) => b.progress - a.progress);
//     } else if (sortOption === 'progress-asc') {
//       result.sort((a, b) => a.progress - b.progress);
//     } else if (sortOption === 'az') {
//       result.sort((a, b) => a.name.localeCompare(b.name));
//     } else if (sortOption === 'za') {
//       result.sort((a, b) => b.name.localeCompare(a.name));
//     }

//     return result;
//   }, [allTopics, statusFilter, domainFilter, searchQuery, sortOption]);

//   const domainLabels = {
//     all: "All Domains",
//     ...Object.fromEntries(Object.entries(QUIZ_STRUCTURE).map(([k, v]) => [k, v.name]))
//   };

//   return (
//     <div className="relative w-full flex flex-col min-h-screen bg-gradient-to-br from-[#03001E] via-[#7303C0]/[0.03] to-[#03001E] text-foreground overflow-hidden">
//       <CursorGlow />
//       <Header
//         DateValue="last7"
//         onDateChange={() => { }}
//         tempDate={today}
//         showDateFilter={false}
//       />

//       <main className="relative z-10 p-6 flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
//         <div className="flex flex-col gap-1">
//           <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7303C0] to-[#EC38BC] bg-clip-text text-transparent">Quiz Browser</h2>
//           <p className="text-sm text-muted-foreground">Explore and practice from {allTopics.length} available topics</p>
//         </div>

//         <Card className="p-4 border border-[#1a0533] bg-[#08011a]/80 backdrop-blur-sm rounded-2xl relative overflow-hidden">
//           <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7303C0] via-[#EC38BC] to-transparent rounded-t-2xl" />
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//             {/* Status Filter */}
//             <ToggleGroup type="single" variant="outline" value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)} className="flex-wrap">
//               <ToggleGroupItem value="all" className="data-[state=on]:bg-red-500/20 data-[state=on]:text-red-500 [&[data-state=on]>svg]:fill-red-500 data-[state=on]:border-red-800">
//                 <Star className="w-4 h-4 mr-2" /> All
//               </ToggleGroupItem>
//               <ToggleGroupItem value="completed" className="data-[state=on]:bg-green-500/20 data-[state=on]:text-green-500 [&[data-state=on]>svg]:fill-green-500 data-[state=on]:border-green-800">
//                 <CircleCheck className="w-4 h-4 mr-2" /> Completed
//               </ToggleGroupItem>
//               <ToggleGroupItem value="inprogress" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 [&[data-state=on]>svg]:fill-blue-400 data-[state=on]:border-blue-800">
//                 <Loader className="w-4 h-4 mr-2" /> In Progress
//               </ToggleGroupItem>
//               <ToggleGroupItem value="pending" className="data-[state=on]:bg-yellow-500/20 data-[state=on]:text-yellow-600 [&[data-state=on]>svg]:fill-yellow-600 data-[state=on]:border-yellow-800">
//                 <Clock className="w-4 h-4 mr-2" /> Pending
//               </ToggleGroupItem>
//             </ToggleGroup>

//             <div className="flex items-center gap-3 w-full md:w-auto">
//               {/* Search Bar */}
//               <div className="relative flex-1 md:w-64">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                 <input
//                   type="text"
//                   placeholder="Search topics..."
//                   className="w-full bg-muted/30 border border-muted rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:border-ring transition-all"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//               </div>

//               {/* Domain Filter */}
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="outline" size="sm" className="h-[38px] border-muted hover:border-ring">
//                     <Filter className="w-4 h-4 mr-2" />
//                     <span className="max-w-[100px] truncate">{domainLabels[domainFilter]}</span>
//                     <ChevronDown className="w-4 h-4 ml-2" />
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end">
//                   <DropdownMenuRadioGroup value={domainFilter} onValueChange={setDomainFilter}>
//                     {Object.entries(domainLabels).map(([val, label]) => (
//                       <DropdownMenuRadioItem key={val} value={val}>{label}</DropdownMenuRadioItem>
//                     ))}
//                   </DropdownMenuRadioGroup>
//                 </DropdownMenuContent>
//               </DropdownMenu>

//               {/* Sort Select */}
//               <Select value={sortOption} onValueChange={setSortOption}>
//                 <SelectTrigger className="h-[38px] md:w-40 border-muted hover:border-ring">
//                   <SelectValue placeholder="Sort by" />
//                 </SelectTrigger>
//                 <SelectContent align="end">
//                   <SelectItem value="recent"><div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> Recent</div></SelectItem>
//                   <SelectItem value="progress-desc"><div className="flex items-center"><BarChart3 className="w-4 h-4 mr-2" /> Progress: High</div></SelectItem>
//                   <SelectItem value="progress-asc"><div className="flex items-center"><BarChart3 className="w-4 h-4 mr-2 rotate-180" /> Progress: Low</div></SelectItem>
//                   <SelectItem value="az"><div className="flex items-center"><SortAsc className="w-4 h-4 mr-2" /> A → Z</div></SelectItem>
//                   <SelectItem value="za"><div className="flex items-center"><SortDesc className="w-4 h-4 mr-2" /> Z → A</div></SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </Card>

//         <div className="flex flex-col gap-3 pb-8">
//           {filteredTopics.length > 0 ? (
//             filteredTopics.map((topic) => (
//               <div
//                 key={`${topic.domainId}-${topic.id}`}
//                 className="flex flex-col md:flex-row md:items-center justify-between rounded-xl px-4 py-4 border border-[#1a0533]/60 bg-gradient-to-r from-[#08011a] to-transparent hover:border-[#7303C0]/30 hover:shadow-md hover:shadow-[#7303C0]/10 hover:from-[#7303C0]/5 hover:to-transparent transition-all duration-200 cursor-pointer group"
//                 onClick={() => router.push(topic.path)}
//               >
//                 <div className="flex items-center gap-4 w-full md:w-[350px]">
//                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7303C0]/20 to-[#9b10a8]/10 flex items-center justify-center text-[#EC38BC] ring-1 ring-[#7303C0]/20 group-hover:ring-[#7303C0]/50 group-hover:scale-110 transition-all">
//                     <Brain className="w-5 h-5" />
//                   </div>
//                   <div>
//                     <h4 className="font-semibold text-persona-ink text-base mb-0.5">{topic.name}</h4>
//                     <div className="flex flex-wrap gap-x-2 gap-y-1">
//                       <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{topic.domain}</span>
//                       <span className="text-[10px] text-muted-foreground/50">•</span>
//                       <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{topic.category}</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center w-full md:w-[250px] gap-3 mt-4 md:mt-0">
//                   <Progress value={topic.progress} className="h-2 rounded-full" />
//                   <span className="text-xs text-muted-foreground min-w-[35px] font-medium">{topic.progress}%</span>
//                 </div>

//                 <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0 w-full md:w-auto">
//                   <Badge
//                     className={cn(
//                       "text-[10px] px-3 py-1 rounded-full font-semibold",
//                       topic.progress === 100 && "bg-green-500/20 text-green-500 border-green-800",
//                       topic.progress > 0 && topic.progress < 100 && "bg-blue-500/20 text-blue-400 border-blue-800",
//                       topic.progress === 0 && "bg-yellow-500/20 text-yellow-600 border-yellow-800"
//                     )}
//                   >
//                     {topic.progress === 100 ? "Completed" : topic.progress === 0 ? "Pending" : "In Progress"}
//                   </Badge>
//                   <Button variant={topic.progress === 100 ? "outline" : "default"} size="sm" className="h-9 px-4 font-medium">
//                     {topic.progress === 100 ? "Review" : topic.progress === 0 ? "Start Quiz" : "Continue"}
//                   </Button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-[#7303C0]/5 to-transparent rounded-3xl border border-dashed border-[#7303C0]/20">
//               <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7303C0]/20 to-[#9b10a8]/10 flex items-center justify-center mb-4">
//                 <Search className="w-8 h-8 text-[#EC38BC]/50" />
//               </div>
//               <p className="text-lg font-medium text-muted-foreground">No topics found matching your filters</p>
//               <Button variant="link" className="text-[#EC38BC] mt-2" onClick={() => {
//                 setStatusFilter('all');
//                 setDomainFilter('all');
//                 setSearchQuery('');
//               }}>Clear all filters</Button>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   )
// }

// location : app/inquizzo/Quiz/page.jsx

'use client'

import React, { useState, useMemo } from 'react'
import { AnimatedIcon } from '@/app/components/inquizzo/AnimatedIcon'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/shared/header/Header.jsx'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search,
  SortAsc,
  SortDesc,
  Clock,
  BarChart3,
  Star,
  CircleCheck,
  Loader,
  ChevronDown,
  Brain,
  Filter,
  ChevronRight,
} from "lucide-react"
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
import { QUIZ_STRUCTURE } from '@/lib/quizData'
import { cn } from "@/lib/utils"

export default function QuizBrowser() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('all')
  const [domainFilter, setDomainFilter] = useState('all')
  const [sortOption, setSortOption] = useState('recent')
  const [searchQuery, setSearchQuery] = useState('')

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const allTopics = useMemo(() => {
    const flattened = []
    Object.entries(QUIZ_STRUCTURE).forEach(([domainKey, domain]) => {
      Object.entries(domain.categories).forEach(([catKey, category]) => {
        Object.entries(category.subCategories).forEach(([subCatKey, subCategory]) => {
          Object.entries(subCategory.topics).forEach(([topicKey, topic]) => {
            const mockProgress = Math.random() > 0.7
              ? (Math.random() > 0.5 ? 100 : Math.floor(Math.random() * 90) + 10)
              : 0
            flattened.push({
              id: topicKey,
              name: topic.name,
              domain: domain.name,
              domainId: domainKey,
              category: category.name,
              subCategory: subCategory.name,
              progress: mockProgress,
              path: `/inquizzo/QuizDomainSelection?domain=${domainKey}&category=${catKey}&subCategory=${subCatKey}&topic=${topicKey}`
            })
          })
        })
      })
    })
    return flattened
  }, [])

  const filteredTopics = useMemo(() => {
    let result = [...allTopics]

    if (statusFilter !== 'all') {
      result = result.filter(t => {
        if (statusFilter === 'completed') return t.progress === 100
        if (statusFilter === 'inprogress') return t.progress > 0 && t.progress < 100
        if (statusFilter === 'pending') return t.progress === 0
        return true
      })
    }

    if (domainFilter !== 'all') {
      result = result.filter(t => t.domainId === domainFilter)
    }

    if (searchQuery) {
      result = result.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (sortOption === 'progress-desc') result.sort((a, b) => b.progress - a.progress)
    else if (sortOption === 'progress-asc') result.sort((a, b) => a.progress - b.progress)
    else if (sortOption === 'az') result.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortOption === 'za') result.sort((a, b) => b.name.localeCompare(a.name))

    return result
  }, [allTopics, statusFilter, domainFilter, searchQuery, sortOption])

  // Group by domain for section headers
  const groupedByDomain = useMemo(() => {
    return filteredTopics.reduce((acc, topic) => {
      if (!acc[topic.domain]) acc[topic.domain] = []
      acc[topic.domain].push(topic)
      return acc
    }, {})
  }, [filteredTopics])

  const domainLabels = {
    all: "All Domains",
    ...Object.fromEntries(Object.entries(QUIZ_STRUCTURE).map(([k, v]) => [k, v.name]))
  }

  const filters = [
    { value: 'all', label: 'All', Icon: Star },
    { value: 'completed', label: 'Completed', Icon: CircleCheck },
    { value: 'inprogress', label: 'In Progress', Icon: Loader },
    { value: 'pending', label: 'Pending', Icon: Clock },
  ]

  return (
    <div className="relative w-full flex flex-col min-h-screen bg-[#242038] text-[#F7ECE1] overflow-hidden">
      {/* Background mesh blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#9067C6]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#8D86C9]/8 blur-[100px]" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #9067C6 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Noise SVG grain */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      <Header
        DateValue="last7"
        onDateChange={() => { }}
        tempDate={today}
        showDateFilter={false}
      />

      <main className="relative z-10 flex-1 flex flex-col w-full">

        {/* ── PAGE HERO ── */}
        <div className="px-4 md:px-8 lg:px-16 pt-8 md:pt-12 pb-8 border-b border-[#9067C6]/10">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => router.push('/inquizzo')}
              className="flex items-center gap-1.5 text-[#8D86C9] hover:text-[#F7ECE1] transition-colors text-sm mb-6"
            >
              ← Back to InQuizzo
            </button>

            <div className="flex items-end gap-4">
              <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none">
                <span className="text-[#F7ECE1]">Browse </span>
                <span
                  className="bg-gradient-to-r from-[#9067C6] to-[#8D86C9] bg-clip-text text-transparent"
                >
                  Topics
                </span>
              </h1>
              <span className="mb-2 text-xs md:text-sm text-[#CAC4CE] border border-[#9067C6]/20 px-3 py-1 rounded-full bg-[#9067C6]/5">
                {allTopics.length} available
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── STICKY FILTER BAR ── */}
        <div className="sticky top-0 z-40 px-4 md:px-8 lg:px-16 py-3 md:py-4 border-b border-[#9067C6]/10"
          style={{ background: 'rgba(36,32,56,0.85)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

            {/* Status pill filters */}
            <div className="flex items-center gap-1 p-1 rounded-full overflow-x-auto"
              style={{ background: 'rgba(144,103,198,0.08)', border: '1px solid rgba(144,103,198,0.15)' }}
            >
              {filters.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className="flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                  style={statusFilter === value ? {
                    background: 'linear-gradient(135deg, #9067C6, #8D86C9)',
                    color: '#F7ECE1',
                    boxShadow: '0 0 16px rgba(144,103,198,0.4)',
                  } : {
                    color: '#CAC4CE',
                    background: 'transparent',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8D86C9]" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-full outline-none transition-all text-[#F7ECE1] placeholder-[#CAC4CE]"
                  style={{
                    background: 'rgba(144,103,198,0.08)',
                    border: '1px solid rgba(144,103,198,0.15)',
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'rgba(144,103,198,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(144,103,198,0.15)'}
                />
              </div>

              {/* Domain filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-[#CAC4CE] transition-all"
                    style={{
                      background: 'rgba(144,103,198,0.08)',
                      border: '1px solid rgba(144,103,198,0.15)',
                    }}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span className="max-w-[80px] truncate">{domainLabels[domainFilter]}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-[#9067C6]/20 bg-[#2d2850] text-[#F7ECE1]"
                >
                  <DropdownMenuRadioGroup value={domainFilter} onValueChange={setDomainFilter}>
                    {Object.entries(domainLabels).map(([val, label]) => (
                      <DropdownMenuRadioItem
                        key={val}
                        value={val}
                        className="text-xs focus:bg-[#9067C6]/20 focus:text-[#F7ECE1]"
                      >
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger
                  className="h-[34px] w-36 text-xs rounded-full border-[#9067C6]/15 bg-[#9067C6]/8 text-[#CAC4CE]"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent
                  align="end"
                  className="border-[#9067C6]/20 bg-[#2d2850] text-[#F7ECE1] text-xs"
                >
                  <SelectItem value="recent" className="focus:bg-[#9067C6]/20">
                    <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />Recent</div>
                  </SelectItem>
                  <SelectItem value="progress-desc" className="focus:bg-[#9067C6]/20">
                    <div className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" />Progress: High</div>
                  </SelectItem>
                  <SelectItem value="progress-asc" className="focus:bg-[#9067C6]/20">
                    <div className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 rotate-180" />Progress: Low</div>
                  </SelectItem>
                  <SelectItem value="az" className="focus:bg-[#9067C6]/20">
                    <div className="flex items-center gap-2"><SortAsc className="w-3.5 h-3.5" />A → Z</div>
                  </SelectItem>
                  <SelectItem value="za" className="focus:bg-[#9067C6]/20">
                    <div className="flex items-center gap-2"><SortDesc className="w-3.5 h-3.5" />Z → A</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── DOMAIN SECTIONS ── */}
        <div className="px-4 md:px-8 lg:px-16 py-6 md:py-10 flex flex-col gap-10 md:gap-16">
          {filteredTopics.length === 0 ? (
            // ── EMPTY STATE ──
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 rounded-3xl"
              style={{
                background: 'rgba(144,103,198,0.04)',
                border: '1px dashed rgba(144,103,198,0.2)',
              }}
            >
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(144,103,198,0.1)', border: '1px solid rgba(144,103,198,0.2)' }}
              >
                <Search className="w-9 h-9 text-[#9067C6]/50" />
              </div>
              <p className="text-xl font-semibold text-[#CAC4CE] mb-2">No topics found</p>
              <p className="text-sm text-[#8D86C9]/60 mb-6">Try adjusting your filters or search query</p>
              <button
                onClick={() => { setStatusFilter('all'); setDomainFilter('all'); setSearchQuery('') }}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-[#F7ECE1] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #9067C6, #8D86C9)',
                  boxShadow: '0 0 24px rgba(144,103,198,0.3)',
                }}
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            Object.entries(groupedByDomain).map(([domainName, topics], domainIndex) => (
              <motion.div
                key={domainName}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Domain label */}
                <div className="flex items-baseline gap-4 mb-6">
                  <h2
                    className="font-syne font-black tracking-tighter leading-none"
                    style={{
                      fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                      WebkitTextStroke: '1px rgba(144,103,198,0.35)',
                      color: 'transparent',
                    }}
                  >
                    {domainName}
                  </h2>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      color: '#9067C6',
                      background: 'rgba(144,103,198,0.1)',
                      border: '1px solid rgba(144,103,198,0.2)',
                    }}
                  >
                    {topics.length}
                  </span>
                </div>

                {/* ── HORIZONTAL SCROLL CARDS ── */}
                <div
                  className="flex gap-5 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {topics.map((topic, topicIndex) => {
                    const isCompleted = topic.progress === 100
                    const isActive = topic.progress > 0 && topic.progress < 100
                    const isPending = topic.progress === 0

                    const statusColor = isCompleted
                      ? '#10b981'
                      : isActive
                        ? '#9067C6'
                        : '#CAC4CE'

                    const statusLabel = isCompleted ? '✓ Complete' : isActive ? '▶ Active' : '○ Pending'

                    return (
                      <motion.div
                        key={`${topic.domainId}-${topic.id}`}
                        // ── HOVER: elevation + shadow only. NO icon animation. ──
                        whileHover={{
                          y: -8,
                          boxShadow: `0 20px 50px rgba(144,103,198,0.25)`,
                        }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{
                          // whileInView transition overrides
                          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                        }}
                        onClick={() => router.push(topic.path)}
                        className="snap-start flex-none w-[220px] sm:w-[260px] md:w-[280px] rounded-2xl overflow-hidden cursor-pointer relative group"
                        data-cursor="card"
                      >
                        {/* Card surface */}
                        <div
                          className="w-full h-full rounded-2xl overflow-hidden relative"
                          style={{
                            border: `1px solid rgba(144,103,198,0.18)`,
                            background: 'linear-gradient(145deg, rgba(45,40,80,0.95), rgba(36,32,56,0.98))',
                            backdropFilter: 'blur(20px)',
                            minHeight: '200px',
                          }}
                        >
                          {/* Status top bar */}
                          <div
                            className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{
                              background: isCompleted
                                ? 'linear-gradient(to right, #10b981, #34d399)'
                                : isActive
                                  ? 'linear-gradient(to right, #9067C6, #8D86C9)'
                                  : 'rgba(144,103,198,0.12)',
                            }}
                          />

                          {/* Hover glow — CSS only, no framer-motion on this layer */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-2xl"
                            style={{
                              background: 'radial-gradient(400px at 50% 0%, rgba(144,103,198,0.08), transparent)',
                            }}
                          />

                          {/* Card content */}
                          <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: '200px' }}>
                            <div>
                              {/* Status badge */}
                              <span
                                className="inline-block text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-full mb-4"
                                style={{
                                  color: statusColor,
                                  background: `${statusColor}15`,
                                  border: `1px solid ${statusColor}30`,
                                }}
                              >
                                {statusLabel}
                              </span>

                              {/* Topic name */}
                              <h4
                                className="font-syne font-black text-lg text-[#F7ECE1] leading-tight mb-1 group-hover:text-white transition-colors duration-200"
                              >
                                {topic.name}
                              </h4>

                              {/* Category */}
                              <p className="text-[10px] text-[#CAC4CE] uppercase tracking-widest font-medium">
                                {topic.category}
                              </p>
                            </div>

                            {/* Bottom row: progress + icon */}
                            <div className="flex items-end justify-between mt-6">
                              <div className="flex-1 mr-4">
                                {/* Progress track */}
                                <div
                                  className="w-full h-[3px] rounded-full overflow-hidden mb-1.5"
                                  style={{ background: 'rgba(144,103,198,0.15)' }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${topic.progress}%`,
                                      background: isCompleted
                                        ? 'linear-gradient(to right, #10b981, #34d399)'
                                        : 'linear-gradient(to right, #9067C6, #8D86C9)',
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-[#CAC4CE]">{topic.progress}%</span>
                              </div>

                              {/* Action icon container — static, no animation on hover */}
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                                style={{
                                  background: 'rgba(144,103,198,0.12)',
                                  border: '1px solid rgba(144,103,198,0.25)',
                                }}
                              >
                                {/* 
                                  AnimatedIcon with whileHover disabled.
                                  The icon container does NOT scale or animate on card hover.
                                  It only subtly changes border color via CSS (group-hover on parent).
                                */}
                                <AnimatedIcon
                                  Icon={Brain}
                                  animation="pulse"
                                  hoverParent={false}
                                  // Key prop: whileHover is undefined inside AnimatedIcon
                                  // because we pass no trigger — icon stays static on card hover
                                  className="w-4 h-4 text-[#9067C6]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}