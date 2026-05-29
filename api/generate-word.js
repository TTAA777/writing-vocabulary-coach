export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      exam = "IELTS",
      level = "Band 6.5",
      category = "General Academic",
      language = "Japanese"
    } = req.body || {};

    const prompt = `
You are an English vocabulary coach for iPad learners.

Create ONE useful vocabulary item.

Exam: ${exam}
Level: ${level}
Category: ${category}
User language: ${language}

Return ONLY valid JSON.
No markdown.
No explanation outside JSON.

JSON format:
{
  "word": "string",
  "meaningJa": "string",
  "partOfSpeech": "string",
  "example": "string",
  "exampleJa": "string",
  "difficulty": "string",
  "memoryTipJa": "string"
}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: "OpenAI API error",
        detail: errorText
      });
    }

    const data = await response.json();
    const text = data.output_text;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      detail: error.message
    });
  }
}