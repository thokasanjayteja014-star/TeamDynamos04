import Groq from "groq-sdk";

const API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: API_KEY });

const extractJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error("Could not extract JSON format from response.");
    let cleanStr = match[0].replace(/```json/gi, '').replace(/```/gi, '');
    return JSON.parse(cleanStr);
  }
};

export const generateBasicsData = async (learningLanguage, nativeLanguage) => {
  const prompt = `You are an expert language teacher.

Provide the fundamental beginner basics for learning the language: ${learningLanguage}. The explanations should be in ${nativeLanguage}.

Output STRICTLY in JSON format:
{
  "alphabet": "Provide a quick overview or string of characters representing the alphabet/script.",
  "pronunciation": "Provide 1-2 sentences on how pronunciation generally works.",
  "sentenceStructure": "Explain the sentence structure (Subject-Verb-Object vs Subject-Object-Verb, etc).",
  "greetings": [
    { "text": "greeting in ${learningLanguage} script", "meaning": "meaning in ${nativeLanguage}" }
  ],
  "emotions": [
    { "word": "emotion word in ${learningLanguage} script", "meaning": "emotion meaning in ${nativeLanguage} (e.g. Happy, Sad)" }
  ]
}

Return ONLY raw JSON without markdown or any other text.`;

  try {
    const result = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You output perfect JSON based strictly on the user criteria." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }
    });
    console.log("Raw output:", result.choices[0].message.content);
    const json = extractJSON(result.choices[0].message.content);
    console.log("Extracted successfully!", Object.keys(json));
  } catch (error) {
    console.error("Groq API Error generating basics:", error.message || error);
  }
};

generateBasicsData("Telugu", "English");
