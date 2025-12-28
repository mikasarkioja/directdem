# AI Summary Integration Guide

## Current Implementation

The `lib/ai-summary.ts` file currently uses a mock implementation that generates summaries based on keyword matching. This is perfect for MVP/demo purposes.

## Integrating Real AI (OpenAI/Anthropic)

When you're ready to use a real AI service, follow these steps:

### Option 1: OpenAI

1. **Install the OpenAI package:**
   ```bash
   npm install openai
   ```

2. **Set up environment variable:**
   Create a `.env.local` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

3. **Update `lib/ai-summary.ts`:**

   ```typescript
   import OpenAI from "openai";

   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });

   export async function generateCitizenSummary(rawText: string): Promise<string> {
     const systemPrompt = `...`; // (keep existing prompt)

     try {
       const response = await openai.chat.completions.create({
         model: "gpt-4o", // or "gpt-4o-mini" for cheaper option
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: `Tiivistä tämä lakiteksti selkokielelle: ${rawText}` }
         ],
         temperature: 0.7,
         max_tokens: 500,
       });
       
       return response.choices[0].message.content || "Tiivistelmää ei voitu luoda.";
     } catch (error) {
       console.error("AI Summary failed", error);
       return "Tiivistelmää ei voitu luoda. Lue alkuperäinen asiakirja.";
     }
   }
   ```

### Option 2: Anthropic (Claude)

1. **Install the Anthropic package:**
   ```bash
   npm install @anthropic-ai/sdk
   ```

2. **Set up environment variable:**
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. **Update `lib/ai-summary.ts`:**

   ```typescript
   import Anthropic from "@anthropic-ai/sdk";

   const anthropic = new Anthropic({
     apiKey: process.env.ANTHROPIC_API_KEY,
   });

   export async function generateCitizenSummary(rawText: string): Promise<string> {
     const systemPrompt = `...`; // (keep existing prompt)

     try {
       const response = await anthropic.messages.create({
         model: "claude-3-5-sonnet-20241022",
         max_tokens: 500,
         system: systemPrompt,
         messages: [
           {
             role: "user",
             content: `Tiivistä tämä lakiteksti selkokielelle: ${rawText}`
           }
         ],
       });
       
       return response.content[0].type === "text" 
         ? response.content[0].text 
         : "Tiivistelmää ei voitu luoda.";
     } catch (error) {
       console.error("AI Summary failed", error);
       return "Tiivistelmää ei voitu luoda. Lue alkuperäinen asiakirja.";
     }
   }
   ```

## System Prompt

The system prompt is designed to:
- Create neutral, unbiased summaries
- Use plain Finnish (selkokieli)
- Avoid jargon
- Follow a specific structure (Mistä on kyse? / Mikä muuttuu? / Vaikutus arkeen)
- Be understandable in 20 seconds

You can adjust the prompt in `lib/ai-summary.ts` to fine-tune the output.

## Cost Considerations

- **OpenAI GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Anthropic Claude 3.5 Sonnet**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **Mock implementation**: Free, but less accurate

For MVP, the mock implementation is recommended. Switch to real AI when you have:
1. API keys set up
2. Budget for API calls
3. Need for more accurate summaries

