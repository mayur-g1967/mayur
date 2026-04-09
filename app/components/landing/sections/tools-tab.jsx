'use client';

import { Fragment, useState } from 'react';

import {
  LayoutDashboard,
  Mic,
  Users,
  GraduationCap,
  Brain,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PillSubheading } from '../ui/PillSubheading';

// Define the tab type
export default function AIToolsTabs() {
  const [activeTab, setActiveTab] = useState('text');

  // Tab data
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-8 h-8" />,
      lightImage: '/images/tab-image/dashboard-dark.jpeg',
      darkImage: '/images/tab-image/dashboard.jpeg',
      title: 'Your Command Center',
      description:
        'View your progress, analytics, and active learning modules in one seamless interface tailored to your PersonaAI journey.',
    },
    {
      id: 'confidence',
      label: 'Confidence Coach',
      icon: <Mic className="w-8 h-8" />,
      lightImage: '/images/tab-image/confidence-coach-dark.png',
      darkImage: '/images/tab-image/confidence-coach.png',
      title: 'Master Your Delivery',
      description:
        'Practice your communication skills with real-time AI feedback. Analyze your vocal tone, pacing, and visual presence instantly.',
    },
    {
      id: 'mentor',
      label: 'Social Mentor',
      icon: <Users className="w-8 h-8" />,
      lightImage: '/images/tab-image/socialmentor-dark.jpeg',
      darkImage: '/images/tab-image/socialmentor.jpeg',
      title: 'Navigate Social Dynamics',
      description:
        'Prepare for difficult conversations, interviews, and networking events through personalized AI roleplay scenarios.',
    },
    {
      id: 'micro',
      label: 'Micro-Learning',
      icon: <GraduationCap className="w-8 h-8" />,
      lightImage: '/images/tab-image/microlearning-dark.jpeg',
      darkImage: '/images/tab-image/microlearning.jpeg',
      title: 'Build Skills Fast',
      description:
        'Engage with bite-sized, personalized lessons designed to fit your busy schedule and accelerate your personal growth.',
    },
    {
      id: 'inquizzo',
      label: 'InQuizzo',
      icon: <Brain className="w-8 h-8" />,
      lightImage: '/images/tab-image/inquizzo-dark.jpeg',
      darkImage: '/images/tab-image/inquizzo.jpeg',
      title: 'Test Your Knowledge',
      description:
        'Challenge yourself with dynamic, AI-generated quizzes across various domains to ensure maximum retention and mastery.',
    },
  ];

  // Find the active tab
  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <section id="ai-tools" className="py-14 md:py-28 dark:bg-dark-primary">
      <div className="wrapper">
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <PillSubheading text="AI Toolkit" />
          <h2 className="mb-3 font-bold text-center text-foreground text-3xl md:text-title-lg">
            All the AI tools you need, at your Fingertips.
          </h2>
          <p className="max-w-2xl mx-auto leading-6 text-muted-foreground">
            Unlock the Potential of Innovation, Discover the Advanced AI Tools
            Transforming Your Ideas into Reality with Unmatched Precision and
            Intelligence.
          </p>
        </div>

        <div className="max-w-[1008px] mx-auto">
          <div>
            {/* Tab Navigation */}
            <div className="overflow-x-auto custom-scrollbar mx-auto max-w-fit relative">
              <div className="flex gap-2 min-w-max rounded-full bg-muted p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center h-12 gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 rounded-full ${activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground bg-transparent'
                      }`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}

            <div className="p-6 tab-img-bg overflow-hidden rounded-4xl mt-8">
              <div className="p-3 tab-img-overlay">
                {tabs.map((tab) => (
                  <Fragment key={tab.id}>
                    <Image
                      src={tab.lightImage || '/placeholder.svg'}
                      alt={tab.label}
                      width={936}
                      height={535}
                      className={cn(
                        'w-full rounded-2xl block dark:hidden',
                        currentTab.id !== tab.id && 'hidden!'
                      )}
                      quality={90}
                      priority
                    />

                    <Image
                      src={tab.darkImage || '/placeholder.svg'}
                      alt={tab.label}
                      width={936}
                      height={535}
                      className={cn(
                        'w-full rounded-2xl hidden dark:block',
                        currentTab.id !== tab.id && 'hidden!'
                      )}
                      quality={90}
                      priority
                    />
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-6 text-center">
              <h2 className="mb-2 text-xl font-bold text-foreground">
                {currentTab.title}
              </h2>
              <p className="max-w-xl mx-auto mb-6 text-sm text-muted-foreground">
                {currentTab.description}
              </p>
              <button className="px-6 py-3 text-sm font-medium text-white transition-colors rounded-full bg-primary hover:opacity-90">
                Try it now for free
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
