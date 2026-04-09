import {
  Bot,
  Zap,
  Mic,
  Users,
  GraduationCap,
  Brain
} from 'lucide-react';

export const CORE_FEATURES = [
  {
    title: "Confidence Coach",
    description:
      "Practice real-time communication with our AI coach. Get instant feedback on your confidence, tone, and delivery style.",
    iconUrl: Mic,
    pillText: "Voice AI"
  },
  {
    title: "Social Mentor",
    description:
      "Navigate complex social scenarios through interactive roleplay. Build lasting habits for networking and personal growth.",
    iconUrl: Users,
    pillText: "Roleplay"
  },
  {
    title: "InQuizzo",
    description:
      "Test your knowledge with dynamic, AI-generated quizzes that adapt to your learning pace and reveal subject mastery.",
    iconUrl: Brain,
    pillText: "Testing"
  },
  {
    title: "Micro-Learning",
    description:
      "Master new skills with bite-sized, personalized lessons designed for high-impact learning in minimal time.",
    iconUrl: GraduationCap,
    pillText: "Learning"
  },
  {
    title: "Performance Analytics",
    description:
      "Deep-dive into your growth with data-backed insights. Visualize your improvement and identify areas for refinement.",
    iconUrl: Bot,
    pillText: "Insights"
  },
  {
    title: "Growth Tracking",
    description:
      "Stay motivated with daily streaks and milestone tracking. See your cumulative progress reflected in a unified dashboard.",
    iconUrl: Zap,
    pillText: "Progress"
  }
];
