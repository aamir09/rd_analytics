import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
console.log(Object.keys(client));
console.log(client.models ? Object.keys(client.models) : 'no models');
console.log(client.interactions ? Object.keys(client.interactions) : 'no interactions');
