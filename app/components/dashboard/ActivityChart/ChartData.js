const generateDynamicChartData = () => {
  // Original activity values from your mock data to maintain the "look" of the chart
  const activityPatterns = [
    { cc: 3, sm: 1, ml: 2, iq: 1 }, { cc: 4, sm: 2, ml: 3, iq: 1 },
    { cc: 2, sm: 1, ml: 2, iq: 0 }, { cc: 5, sm: 2, ml: 4, iq: 2 },
    { cc: 6, sm: 3, ml: 4, iq: 2 }, { cc: 4, sm: 2, ml: 3, iq: 1 },
    { cc: 5, sm: 3, ml: 2, iq: 2 }, { cc: 3, sm: 1, ml: 3, iq: 1 },
    { cc: 4, sm: 2, ml: 4, iq: 2 }, { cc: 6, sm: 3, ml: 5, iq: 2 },
    { cc: 5, sm: 2, ml: 4, iq: 1 }, { cc: 4, sm: 3, ml: 3, iq: 2 },
    { cc: 6, sm: 4, ml: 5, iq: 3 }, { cc: 7, sm: 3, ml: 4, iq: 2 },
    { cc: 5, sm: 2, ml: 3, iq: 2 }, { cc: 4, sm: 2, ml: 4, iq: 1 },
    { cc: 6, sm: 3, ml: 5, iq: 3 }, { cc: 5, sm: 4, ml: 4, iq: 2 },
    { cc: 7, sm: 3, ml: 5, iq: 3 }, { cc: 6, sm: 4, ml: 6, iq: 3 },
    { cc: 5, sm: 3, ml: 4, iq: 2 }, { cc: 4, sm: 2, ml: 3, iq: 1 },
    { cc: 6, sm: 3, ml: 5, iq: 2 }, { cc: 7, sm: 4, ml: 6, iq: 3 },
    { cc: 6, sm: 3, ml: 5, iq: 2 }, { cc: 5, sm: 2, ml: 4, iq: 2 },
    { cc: 6, sm: 3, ml: 5, iq: 3 }, { cc: 7, sm: 4, ml: 6, iq: 3 },
    { cc: 6, sm: 3, ml: 5, iq: 2 }, { cc: 8, sm: 4, ml: 6, iq: 3 }
  ];

  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    // Calculate the date for 'i' days ago
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Format to YYYY-MM-DD
    const dateString = date.toISOString().split('T')[0];
    
    // Pick the pattern for this index
    const pattern = activityPatterns[29 - i];

    data.push({
      date: dateString,
      confidenceCoach: pattern.cc,
      socialMentor: pattern.sm,
      microLearning: pattern.ml,
      inQuizzo: pattern.iq,
    });
  }

  return data;
};

export const chartData = generateDynamicChartData();