import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDfceVPmzXQCE_tZ62aSmTidzl_fFOH_4M";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testGeneration() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const learningLanguage = "Telugu";
  const nativeLanguage = "English";
  const levelId = "Placement Test";
  const levelDifficulty = 1;

  const prompt = `You are a language learning content generator. Generate a complete language learning exercise.

Learning Language: ${learningLanguage} (write story and answers in this language)
Native Language: ${nativeLanguage} (write questions in this language)
Level: ${levelId}
Difficulty: ${levelDifficulty} (1=easiest, 5=hardest)

Generate the following in strict JSON format:

{
  "story_text_learning": "A short story (4-8 sentences) in ${learningLanguage} script",
  "story_text_native": "Same story translated to ${nativeLanguage}",
  "questions": [
    {
      "id": 1,
      "text_native": "Question in ${nativeLanguage} based on the story",
      "correct_answer_tiles": ["word1", "word2", "word3"],
      "available_tiles": ["word1", "word2", "word3", "distractor1", "distractor2", "distractor3"]
    }
  ]
}

Requirements:
- Number of questions: Level 1 has 2 questions, Level 2 has 3, Level 3 has 4, Level 4 has 5, Level 5 has 6
- correct_answer_tiles should be 2-6 words that form the correct answer in ${learningLanguage}
- available_tiles should include all correct words plus 2-3 extra distractor words
- The story should be engaging, culturally appropriate, and suitable for language learners
- Questions should test comprehension of the story
- For Level 1, use simple vocabulary. For Level 5, use complex sentences and advanced vocabulary

Return ONLY valid JSON, no markdown formatting like \`\`\`json, no other text.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Raw output starting======\n" + text + "\n======Raw output ending");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not find JSON in response");
    
    console.log("Successfully matched JSON bracket block.");
    
    const parsed = JSON.parse(match[0]);
    console.log("Successfully parsed JSON!", Object.keys(parsed));
  } catch (err) {
    console.error("Test Error:", err.message);
  }
}

testGeneration();
