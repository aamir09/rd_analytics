import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
  const response = await client.models.list();
  for await (const model of response) {
    console.log(model.name);
  }
}
run().catch(console.error);
