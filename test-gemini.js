import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDfceVPmzXQCE_tZ62aSmTidzI_fFOH_4M";
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent("Say hello");
    console.log("Raw text:", result.response.text());
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
