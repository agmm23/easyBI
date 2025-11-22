import { GoogleGenAI } from "@google/genai";
import { DataSource } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeDataWithGemini = async (
  query: string,
  dataSources: DataSource[]
): Promise<string> => {
  try {
    // Prepare data context summary to send to Gemini
    // We limit the data to avoid huge payloads in this demo
    const contextData = dataSources.map(ds => ({
      name: ds.name,
      type: ds.type,
      sampleData: ds.data.slice(0, 20) // Send first 20 rows as context
    }));

    const prompt = `
      Actúa como un consultor de Business Intelligence experto para pequeñas empresas.
      Tengo los siguientes conjuntos de datos disponibles en mi aplicación "SimpleBI":
      
      ${JSON.stringify(contextData, null, 2)}

      El usuario pregunta: "${query}"

      Por favor, analiza los datos proporcionados (si es relevante) y responde a la pregunta del usuario.
      Si la pregunta es sobre tendencias, márgenes o sugerencias, usa los números proporcionados.
      Mantén la respuesta profesional, concisa y en formato Markdown.
      Resalta los puntos clave en negrita.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asistente inteligente de análisis de datos para SimpleBI.",
        temperature: 0.4,
      }
    });

    return response.text || "No pude generar un análisis en este momento.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Lo siento, hubo un error al conectar con el servicio de inteligencia artificial. Por favor verifica tu conexión o clave API.";
  }
};
