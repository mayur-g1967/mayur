// app/mockData.js

import { MODULE_ROUTES, MODULE_LABELS } from "@/lib/moduleConfig";

const generateDynamicMockData = () => {
  const sessions = [];
  const now = new Date();
  
  const formatDate = (date) => date.toISOString().split('T')[0];
  const todayStr = formatDate(now);

  // Configuration for modules to ensure variety
  const modules = [
    { id: "confidencecoach", type: "confidenceCoach", weight: 0.35 },
    { id: "inquizzo", type: "inQuizzo", weight: 0.3 },
    { id: "socialmentor", type: "socialMentor", weight: 0.2 },
    { id: "microlearning", type: "microLearning", weight: 0.15 }
  ];

  // Generate data for the last 60 days (0 = today)
  for (let i = 0; i < 50; i++) {
    const sessionDate = new Date();
    sessionDate.setDate(now.getDate() - i);
    const dateStr = formatDate(sessionDate);

    // 1-8 SESSIONS PER DAY: Creating a busy, high-activity look
    const dailyCount = Math.floor(Math.random() * 8) + 1;
    
    for (let j = 0; j < dailyCount; j++) {
      // Pick a random module based on weight
      const rand = Math.random();
      const mod = modules.find((m, idx) => {
        const cumulativeWeight = modules.slice(0, idx + 1).reduce((acc, curr) => acc + curr.weight, 0);
        return rand <= cumulativeWeight;
      }) || modules[0];

      sessions.push({
        _id: `session_${i}_${j}`,
        date: dateStr,
        moduleId: mod.id,      // Connects to ModulesData.js
        module: mod.type,      // Connects to ActivityChart.jsx config
        duration: Math.floor(Math.random() * 400) + 200, // 3-10 minutes per session
        confidenceDelta: Math.floor(Math.random() * 3) + 1,
        // High probability of voice for specific modules
        isVoiceQuiz: (mod.id === "inquizzo" || mod.id === "confidencecoach") && Math.random() > 0.3
      });
    }
  }

  // Sorting descending so most recent is at index 0
  return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const mockSessions = generateDynamicMockData();