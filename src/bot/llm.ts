import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import colors from "colors";
import * as fs from 'fs'
import { scraperConfig } from "../app.ts";
import { parseDate } from "../common/parse-date.ts";
colors.enable();

dotenv.config();

const ai = new GoogleGenAI({});

async function invokeModel(message: string) {

  console.log("Gemini esta pensando...")
  const response = await ai.models.generateContent({
    config:{
        temperature:0.5,
        systemInstruction:`Eres un asistente de de analisis de ofertas de trabajo, tu mision es
        analizar las siguientes ofertas laborales, y el numero de las paginas de las ofertas que mejor coincidan
        con este perfil: ${scraperConfig.profileToLookForMatches}, puedes der una pequena explicacion de por que esa oferta es apropiada para
        ese perfil
        `
    },
    model: "gemini-2.5-flash",
    contents: message,
  });
  console.log(response.text);
  return response.text
}

export async function doAnalisisOfOffers(date: Date) {

  const prompt = fs.readFileSync(`src/extracted_data/extracted_${parseDate(date)}.txt`, 'utf8')

  const analisisResponse = await invokeModel(prompt) ?? 'LLM no response'

  fs.writeFileSync(`src/bot_analisis/reply_${parseDate(date)}.md`, analisisResponse)

}


