export const QUESTION_LIMIT = 600;
export const ANSWER_LIMIT = 3000;
export const HISTORY_LIMIT = 15; // Seven complete exchanges plus the next question.

export type Message = { role: "user" | "assistant"; content: string };

export function validConversation(value: unknown): value is Message[] {
  return Array.isArray(value) && value.length > 0 && value.length <= HISTORY_LIMIT
    && value.length % 2 === 1 && value.every((entry, index) => {
      const user = index % 2 === 0;
      return entry?.role === (user ? "user" : "assistant")
        && typeof entry.content === "string" && entry.content.trim().length > 0
        && entry.content.length <= (user ? QUESTION_LIMIT : ANSWER_LIMIT);
    });
}
