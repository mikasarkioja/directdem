import OpenAI from "openai";

const MODEL = "text-embedding-3-small";

export async function embedFinnishNewsText(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "missing") {
    throw new Error("OPENAI_API_KEY puuttuu tai on asettamatta.");
  }
  const openai = new OpenAI({ apiKey: key });
  const input = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!input) {
    throw new Error("Tyhjä teksti embeddingiin.");
  }
  const res = await openai.embeddings.create({
    model: MODEL,
    input,
  });
  return res.data[0].embedding;
}
