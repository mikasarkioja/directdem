import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { fetchLatestSpeeches, analyzeSpeech } from "../lib/eduskunta/speech-parser";
import { fetchWrittenQuestions, processQuestion } from "../lib/eduskunta/question-fetcher";
import { updateActivityIndex } from "../lib/eduskunta/activity-engine";

async function testEduskuntaIntelligence() {
  console.log("🚀 Testing Eduskunta Intelligence Expansion...");

  try {
    // 1. Speeches
    console.log("🎤 Fetching latest speeches...");
    const speeches = await fetchLatestSpeeches(2);
    if (speeches.length > 0) {
      console.log(`✅ Found ${speeches.length} speeches.`);
      console.log(`🧠 Analyzing first speech by ${speeches[0].speakerName}...`);
      const analysis = await analyzeSpeech(speeches[0]);
      console.log("-----------------------------------------");
      console.log("THEMES:", analysis.themes.join(", "));
      console.log("SENTIMENT:", analysis.sentiment);
      console.log("DNA IMPACT:", JSON.stringify(analysis.dna_impact));
      console.log("-----------------------------------------");
    }

    // 2. Questions
    console.log("🔍 Fetching written questions...");
    const questions = await fetchWrittenQuestions(2);
    if (questions.length > 0) {
      console.log(`✅ Found ${questions.length} questions.`);
      console.log(`📍 Tagging first question: ${questions[0].title}...`);
      const geo = await processQuestion(questions[0]);
      console.log("-----------------------------------------");
      console.log("LOCAL INTEREST:", geo.is_local_interest);
      console.log("LOCATION:", geo.location);
      console.log("TAGS:", geo.tags.join(", "));
      console.log("-----------------------------------------");
    }

    // 3. Activity Index
    if (speeches.length > 0) {
      console.log(`📊 Updating activity index for MP ${speeches[0].mpId}...`);
      const index = await updateActivityIndex(speeches[0].mpId);
      console.log(`✅ Activity Index: ${index}`);
    }

  } catch (error: any) {
    console.error("💥 Test failed:", error.message);
  }
}

testEduskuntaIntelligence();

