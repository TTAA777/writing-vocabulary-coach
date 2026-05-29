export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      userAnswer,
      correctWord,
      meaningJa = "",
      example = ""
    } = req.body || {};

    if (!userAnswer || !correctWord) {
      return res.status(400).json({
        error: "Missing userAnswer or correctWord"
      });
    }

    const prompt = `
You are checking an English vocabulary answer.

Correct word: ${correctWord}
Japanese meaning: ${meaningJa}
Example sentence: ${example}
User answer: ${userAnswer}

Judge if the user's answer is correct.

Rules:
- Ignore uppercase/lowercase differences.
- Ignore small spacing differences.
- If spelling is clearly wrong, mark incorrect.
- If the answer is another valid English word but not the target word, mark incorrect.
- Be strict for vocabulary spelling practice.
- shortFeedbackJa must be simple Japanese.
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
        temperature: 0.2,
        text: {
          format: {
            type: "json_schema",
            name: "check_answer_result",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                isCorrect: {
                  type: "boolean"
                },
                score: {
                  type: "integer"
                },
                shortFeedbackJa: {
                  type: "string"
                },
                correctAnswer: {
                  type: "string"
                },
                userAnswer: {
                  type: "string"
                }
              },
              required: [
                "isCorrect",
                "score",
                "shortFeedbackJa",
                "correctAnswer",
                "userAnswer"
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