import { ExcuseTone } from "../types";

const WEBHOOK_URL = 'https://hook.eu2.make.com/8rj9t6jslzyfgvm7hlxec2yji8tvzl77';

interface ExcuseResponse {
  text: string;
}

// We maintain the same function signature to ensure compatibility with App.tsx,
// but internally we fetch from the webhook instead of streaming from Gemini.
export const generateExcuseStream = async (
  situation: string, 
  tone: ExcuseTone
): Promise<AsyncIterable<ExcuseResponse>> => {
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        situation,
        tone,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    
    // The webhook is expected to return the excuse text directly.
    // We attempt to parse it as JSON just in case the webhook returns a structured object.
    let finalExcuse = responseText;
    
    try {
        const json = JSON.parse(responseText);
        // Heuristic to find the excuse content if the response is a JSON object
        if (typeof json === 'object' && json !== null) {
            finalExcuse = json.excuse || json.text || json.output || json.content || json.message || responseText;
        }
    } catch (e) {
        // Response is likely plain text, use as is
    }

    // Return an async iterable that yields the single response
    // This mocks the streaming interface expected by the UI
    return {
      async *[Symbol.asyncIterator]() {
        yield { text: finalExcuse };
      }
    };

  } catch (error) {
    console.error("Error calling Webhook:", error);
    throw error;
  }
};
