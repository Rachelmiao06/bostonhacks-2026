"use client";

import { useCallback, useEffect, useState } from "react";
import { getRiderId } from "@/lib/rider";

/** One completed report from any rider. No rider id: `author` is a short anonymous handle. */
export type Post = {
  id: string;
  text: string;
  completed_at: string;
  station_name: string;
  header: string;
  kind: string;
  resolved_at: string | null;
  author: string;
  mine: boolean;
  likes: number;
  liked: boolean;
};

export type CommunityState = { status: "loading" } | { status: "unavailable" } | { status: "ready"; posts: Post[] };

/**
 * Reads the community feed from GET /api/community and presses like stamps through POST /api/likes.
 * Counts come from the server; the stamp shows at once and is put back if the server says no.
 */
export function useCommunity() {
  const [state, setState] = useState<CommunityState>({ status: "loading" });

  useEffect(() => {
    let live = true;
    fetch(`/api/community?userId=${encodeURIComponent(getRiderId())}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ posts: Post[] }>;
      })
      .then((data) => live && setState({ status: "ready", posts: data.posts }))
      .catch(() => live && setState({ status: "unavailable" }));
    return () => {
      live = false;
    };
  }, []);

  const patch = useCallback((id: string, change: Partial<Post>) => {
    setState((s) => (s.status === "ready" ? { status: "ready", posts: s.posts.map((p) => (p.id === id ? { ...p, ...change } : p)) } : s));
  }, []);

  /** Returns false when the stamp could not be saved. */
  const stamp = useCallback(
    async (post: Post) => {
      patch(post.id, { liked: true, likes: post.likes + 1 });
      try {
        const res = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId: post.id, userId: getRiderId() }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { likes: number };
        patch(post.id, { liked: true, likes: data.likes });
        return true;
      } catch {
        patch(post.id, { liked: post.liked, likes: post.likes });
        return false;
      }
    },
    [patch],
  );

  return { state, stamp };
}
