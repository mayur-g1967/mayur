// lib/segmenter.js

/**
 * Splits transcript into 8 buckets and selects 1 sentence per bucket.
 * @param {string} text - Raw transcript
 * @param {number} attempt - Current user attempt (1, 2, 3...)
 */
export function segmentTranscript(text, attempt = 1) {
  // Regex to split by sentence boundaries (. ! ?)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const totalSentences = sentences.length;
  
  const segments = [];
  const segmentSize = Math.floor(totalSentences / 8);
  let extra = totalSentences % 8;
  
  let currentPos = 0;

  for (let i = 0; i < 8; i++) {
    const size = segmentSize + (extra > 0 ? 1 : 0);
    const bucket = sentences.slice(currentPos, currentPos + size);
    
    // Attempt Logic: Rotate through bucket sentences
    // If bucket has 2 sentences: Attempt 1 -> Index 0, Attempt 2 -> Index 1
    const selectedIndex = (attempt - 1) % bucket.length;
    
    // "Twisted" flag: true if we are repeating sentences or have low sentence count
    const isTwisted = attempt > bucket.length || bucket.length < 2;

    segments.push({
      id: i + 1,
      text: bucket[selectedIndex]?.trim() || "",
      isTwisted: isTwisted,
      context: bucket.join(" ").trim() // Full bucket context for the AI
    });

    currentPos += size;
    extra--;
  }

  return segments;
}