/**
 * The one place that builds challenge URLs. Never write these strings anywhere else.
 *
 *   /challenge          the quest hub (the list of quests)
 *   /challenges/<id>    one quest: report or verify it (id = a quest id from /api/quests)
 *
 * The map, the hub, My Challenges, Rewards or any new screen links with `challengeHref(quest.id)`,
 * so a route can change without hunting for strings.
 */
export const CHALLENGE_PATH = "/challenge";
export const QUEST_PATH = "/challenges";

/** With a quest id: that quest's page. Without one: the hub. */
export function challengeHref(questId?: string) {
  return questId ? `${QUEST_PATH}/${encodeURIComponent(questId)}` : CHALLENGE_PATH;
}

/**
 * TEMPORARY: the old practice page at /challenge opens its made-up sample quests in place
 * with ?id=<sample id>. Those ids do not exist in /api/quests, so they cannot use challengeHref.
 * Delete this, and the practice page, when the hub moves to live quests.
 */
export const PRACTICE_ID_PARAM = "id";
export function practiceHref(sampleId: string) {
  return `${CHALLENGE_PATH}?${PRACTICE_ID_PARAM}=${encodeURIComponent(sampleId)}`;
}
