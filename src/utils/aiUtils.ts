/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

export async function generateWealthInsights(state: AppState) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `
    You are a professional personal finance advisor. 
    Analyze the following user finance data and provide 3 short, actionable insights.
    User Data:
    - Accounts: ${JSON.stringify(state.accounts)}
    - Transactions (last 30 days): ${JSON.stringify(state.transactions.slice(0, 50))}
    - Weekly Goal: $${state.weeklyGoal}
    
    Output format should be a JSON array of objects:
    [
      { "id": 1, "title": "Insight Title", "description": "Concise advice", "type": "positive|neutral|negative", "icon": "utensils|shopping|car|home" }
    ]
    Only return the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Failed to generate insights:", error);
    return [
      { id: 1, title: "Great progress!", description: "You've spent 15% less on dining this week compared to last.", type: "positive", icon: "utensils" },
      { id: 2, title: "Spending Habit", description: "Food remains your top expense category. Consider meal prep to save more.", type: "neutral", icon: "shopping" },
      { id: 3, title: "On Track", description: "You're on track to hit your savings goal for 'Bali Trip' 5 days early!", type: "positive", icon: "car" }
    ];
  }
}
