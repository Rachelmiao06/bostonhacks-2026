/**
 * The one place that knows the challenge page's URL.
 * The map, My Challenges, Rewards or any new screen should link with `challengeHref(quest.id)`
 * so the route can change without hunting for strings. Without an id it links to the quest list.
 */
export const CHALLENGE_PATH = "/challenge";
export const QUEST_ID_PARAM = "id";

export function challengeHref(questId?: string) {
  return questId ? `${CHALLENGE_PATH}?${QUEST_ID_PARAM}=${encodeURIComponent(questId)}` : CHALLENGE_PATH;
}
