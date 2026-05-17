import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface SurveyValidation {
  isSuitable: boolean;
  reason: string;
}

export interface SurveySimulation {
  results: { [option: string]: number };
  rawAnswers: string[];
}

export const aiService = {
  async validateSurvey(question: string, options: string[]): Promise<SurveyValidation> {
    const prompt = `Aşağıdaki anket sorusu ve seçenekleri, istatistiksel bir anket için uygun mu? 
    İstatistiksel anketlerde genellikle kişisel tercihler, demografik veriler veya gözlemlenebilir özellikler sorulmalıdır. 
    "Bugün hava kaç derece?" gibi tek bir doğru cevabı olan veya anlık değişen fiziksel ölçümler istatistik anketi için uygun değildir.
    "Hangi telefon markasını kullanıyorsunuz?" gibi sorular uygundur.

    Soru: ${question}
    Seçenekler: ${options.join(', ')}

    Lütfen JSON formatında cevap ver:
    {
      "isSuitable": boolean,
      "reason": "Neden uygun veya değil açıklaması (Türkçe)"
    }`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSuitable: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            },
            required: ["isSuitable", "reason"]
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("AI Validation Error:", error);
      return { isSuitable: false, reason: "Yapay zeka doğrulaması başarısız oldu." };
    }
  },

  async simulateSurveyAnswers(question: string, options: string[]): Promise<SurveySimulation> {
    const prompt = `Sen 10 farklı insansın. Aşağıdaki anket sorusuna her biriniz birer seçenekle cevap vereceksiniz.
    Soru: ${question}
    Seçenekler: ${options.join(', ')}

    Lütfen her bir insanın seçtiği şıkkı içeren 10 elemanlı bir liste döndür.
    Sadece seçilen seçeneklerin metinlerini içeren bir JSON listesi döndür.
    Format: ["SeçenekA", "SeçenekB", ...]`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const rawAnswers: string[] = JSON.parse(response.text || '[]');
      const results: { [option: string]: number } = {};
      
      options.forEach(opt => results[opt] = 0);
      rawAnswers.forEach(answer => {
        if (results.hasOwnProperty(answer)) {
          results[answer]++;
        } else {
          // Find closest option if AI hallucinated slightly
          const closest = options.find(opt => answer.includes(opt) || opt.includes(answer));
          if (closest) results[closest]++;
        }
      });

      return { results, rawAnswers };
    } catch (error) {
      console.error("AI Simulation Error:", error);
      return { results: {}, rawAnswers: [] };
    }
  }
};
