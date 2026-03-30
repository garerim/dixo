// =============================================================================
// CORE — Bot module barrel exports
// =============================================================================

export { computeBotAction, getBotThinkingDelay } from "./bot-ai";
export type { BotAction } from "./bot-ai";

export {
  createBotProfiles,
  isBotPlayer,
} from "./bot-profiles";
export type { BotDifficulty, BotProfile } from "./bot-profiles";
