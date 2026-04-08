import Groq from 'groq-sdk'
// Sets timeout to 5 minutes
export async function POST(request) {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY_3 || process.env.GROQ_API_KEY || 'dummy-key-for-build'
    })

    const formData = await request.formData()
    const audioFile = formData.get('audio')

    if (!audioFile) {
      return Response.json({
        success: false,
        error: 'No audio file provided'
      }, { status: 400 })
    }

    const buffer = await audioFile.arrayBuffer()

    const transcription = await groq.audio.transcriptions.create({
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      model: "whisper-large-v3",
      temperature: 0,
      response_format: "verbose_json"
    })

    console.log('Transcribed text:', transcription.text)

    return Response.json({
      success: true,
      text: transcription.text
    })

  } catch (error) {
    console.error('Transcription Error:', error.message)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
