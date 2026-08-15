import { GoogleGenAI } from '@google/genai';

async function run() {
  const client = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
  const res = await client.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: 'Say hello in 1 word',
  });
  console.log(JSON.stringify(res, null, 2));
}
run().catch(console.error);
