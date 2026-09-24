import type { WasteAnalysisResponse } from "./detection";

export interface ChatContext extends WasteAnalysisResponse {
  selected_detection_index?: number;
}
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}
interface ChatResponse {
  answer: string;
}

export async function chatWithBinVisionAI(
  message: string,
  history: ChatTurn[],
  context?: ChatContext,
): Promise<string> {
  const endpoint = import.meta.env["VITE_CHAT_API_URL"] || "/api/chat";
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.slice(-20), context }),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 429)
        throw new Error("BinVision AI is busy right now. Wait a moment and try again.");
      if (response.status === 404)
        throw new Error(
          "BinVision AI service isn't connected yet. Start the chat backend and retry.",
        );
      if (response.status >= 500)
        throw new Error("BinVision AI is temporarily unavailable. Please try again.");
      throw new Error("I couldn't send that message. Please check it and try again.");
    }
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error("BinVision AI returned an unreadable response. Please retry.");
    }
    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as ChatResponse).answer !== "string" ||
      !(data as ChatResponse).answer.trim()
    ) {
      throw new Error("BinVision AI returned an empty response. Please try again.");
    }
    return (data as ChatResponse).answer.trim();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error("That took too long. Check your connection and retry.");
    if (error instanceof TypeError)
      throw new Error("Can't reach BinVision AI. Check that the chat service is running.");
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}
