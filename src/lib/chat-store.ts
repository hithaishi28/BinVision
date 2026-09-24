import { useSyncExternalStore } from "react";
import type { ChatContext, ChatTurn } from "./chat-service";
import type { WasteAnalysisResponse } from "./detection";

export interface VisibleChatMessage extends ChatTurn {
  id: string;
  error?: boolean;
}
interface ChatState {
  open: boolean;
  messages: VisibleChatMessage[];
  context: ChatContext | undefined;
  selectedDetectionIndex: number | undefined;
}
let state: ChatState = {
  open: false,
  messages: [],
  context: undefined,
  selectedDetectionIndex: undefined,
};
const SERVER_SNAPSHOT: ChatState = {
  open: false,
  messages: [],
  context: undefined,
  selectedDetectionIndex: undefined,
};
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}
export function getChatState() {
  return state;
}
export function updateChat(patch: Partial<ChatState>) {
  state = { ...state, ...patch };
  emit();
}
export function appendChatMessage(message: VisibleChatMessage) {
  state = { ...state, messages: [...state.messages, message] };
  emit();
}
export function clearChat() {
  state = { ...state, messages: [] };
  emit();
}
export function openAssistant() {
  updateChat({ open: true });
}
export function setAssistantContext(
  analysis?: WasteAnalysisResponse,
  selectedDetectionIndex?: number,
) {
  updateChat({
    context: analysis
      ? {
          ...analysis,
          ...(selectedDetectionIndex !== undefined
            ? { selected_detection_index: selectedDetectionIndex }
            : {}),
        }
      : undefined,
    selectedDetectionIndex,
  });
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function useChatState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_SNAPSHOT,
  );
}
