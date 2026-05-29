export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      userAnswer = "",
      correctWord,
      meaningJa = "",
      example = ""
    } = req.body || {};

    if (!correctWord) {
      return res.status(400).json({
        error: "Missing correctWord"
      });
    }

    const prompt = `
You are a Japanese English vocabulary tutor.

Correct word: ${correctWord}
Japanese meaning: ${meaningJa}
Example sentence: ${example}
User answer: ${userAnswer || "No answer"}

Explain the mistake in simple Japanese.

Rules:
- Use simple Japanese for a high school learner.
- Explain the difference between the user's answer and the correct word.
- If the user's answer is a different part of speech, explain that clearly.
- Give one short memory tip.
- Give one mini practice sentence in Japanese.
- The mini practice answer must be the correct English word.
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
        temperature: 0.4,
        text: {
          format: {
            type: "json_schema",
            name: "explain_answer_result",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                explanationJa: {
                  type: "string"
                },
                memoryTipJa: {
                  type: "string"
                },
                miniPracticeJa: {
                  type: "string"
                },
                miniPracticeAnswer: {
                  type: "string"
                }
              },
              required: [
                "explanationJa",
                "memoryTipJa",
                "miniPracticeJa",
                "miniPracticeAnswer"
              ]
            }
          }
        }
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

    const text =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "";

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text,
        fullResponse: data
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