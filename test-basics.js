import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDfceVPmzXQCE_tZ62aSmTidzl_fFOH_4M";
const genAI = new GoogleGenerativeAI(API_KEY);

const getGenerativeModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
};

const extractJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error("Could not extract JSON format from Gemini response. Raw text: " + text);
    
    let cleanStr = match[0].replace(/```json/gi, '').replace(/```/gi, '');
    return JSON.parse(cleanStr);
  }
};

export const generateBasicsData = async (learningLanguage, nativeLanguage) => {
  const model = getGenerativeModel();
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
    const result = await model.generateContent(prompt);
    console.log("Raw output:");
    console.log(result.response.text());
    console.log("Extracting JSON...");
    const json = extractJSON(result.response.text());
    console.log("Success:", Object.keys(json));
  } catch (error) {
    console.error("Gemini API Error generating basics:", error.message);
  }
};

generateBasicsData("Telugu", "English");
