function isWithRange(range) {
  const validRanges = ["today", "last7", "last30"];
  return validRanges.includes(range);
}