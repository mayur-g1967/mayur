import {
  LayoutDashboard,
  Mic,
  Users,
  GraduationCap,
  Brain,
  BarChart3,
  LineChart
} from "lucide-react";

export const sidebarItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard/>,
    href: "/dashboard",
  },
  {
    title: "Confidence Coach",
    icon: <Mic/>,
    href: "/confidence-coach",
  },
  {
    title: "Social Mentor",
    icon: <Users/>,
    href: "/social-mentor",
  },
  {
    title: "Micro-Learning",
    icon: <GraduationCap/>,
    href: "/micro-learning",
  },
  {
    title: "InQuizzo",
    icon: <Brain/>,
    href: "/inquizzo",
  },
  // {
  //   title: "Analytics",
  //   icon: <BarChart3/>,
  //   href: "/analytics",
  // },
  // {
  //   title: "My Progress",
  //   icon: <LineChart/>,
  //   href: "/progress",
  // },
];