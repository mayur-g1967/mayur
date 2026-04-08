import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_3 || process.env.GROQ_API_KEY || 'dummy-key-for-build'
})

function divideIntoSegments(transcript, numSegments = 8) {
  const words = transcript.split(/\s+/)
  const wordsPerSegment = Math.ceil(words.length / numSegments)
  const segments = []

  for (let i = 0; i < numSegments; i++) {
    const start = i * wordsPerSegment
    const end = Math.min(start + wordsPerSegment, words.length)
    segments.push(words.slice(start, end).join(' '))
  }

  return segments
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { transcript, userExplanation } = body

    console.log('Generating diagnostic MCQs...')

    const segments = divideIntoSegments(transcript, 8)

    const diagnosticPrompt = `
The user has poor understanding (< 60%) of this text. Generate 3 CRITICAL and COMPLEX diagnostic MCQs to determine if they:
1. Understand the concept but can't explain, OR
2. Don't understand the main concepts at all

Text segments:
${segments.map((seg, idx) => `SEGMENT ${idx + 1}:\n${seg}`).join('\n\n')}

User's weak explanation:
${userExplanation}

Generate 3 VERY DIFFICULT diagnostic MCQs in JSON format:
[
  {
    "question": "Critical thinking question that tests deep understanding",
    "options": {
      "A": "Option A",
      "B": "Option B",
      "C": "Option C",
      "D": "Option D"
    },
    "answer": "A"
  },
  ...3 questions total...
]

Requirements:
- Questions must be MUCH MORE DIFFICULT than the MCQ round
- Test deep conceptual understanding, not memorization
- Include trick options that sound plausible
- Can mix concepts from multiple segments
- Focus on areas where the user showed weakness
- Questions should differentiate between "can't explain" vs "doesn't understand"
- Return ONLY valid JSON, no other text
`

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: diagnosticPrompt
        }
      ],
      temperature: 0.9,
      max_tokens: 3000
    })

    const mcqText = completion.choices[0].message.content
    const mcqs = JSON.parse(mcqText)

    if (!Array.isArray(mcqs) || mcqs.length !== 3) {
      throw new Error(`Expected 3 diagnostic MCQs, got ${mcqs.length}`)
    }

    return Response.json({
      success: true,
      mcqs: mcqs
    })

  } catch (error) {
    console.error('Diagnostic MCQ Error:', error.message)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
