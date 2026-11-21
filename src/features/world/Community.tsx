"use client";

import { useState } from "react";
import type { QuestKind } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryStyle } from "@/features/explore/category";
import { categoryOfKind, kindLabels, type CategoryId } from "@/features/explore/content";
import { content } from "./content";
import { useCommunity, type Post } from "./useCommunity";
import { LikeStamp } from "./LikeStamp";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** What riders wrote on completed reports, newest first, each with a like stamp. */
export function Community() {
  const { state, stamp } = useCommunity();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const press = async (post: Post) => {
    setBusy(post.id);
    setFailed(false);
    if (!(await stamp(post))) setFailed(true);
    setBusy(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-serif text-xl font-semibold">{content.communityTitle}</h2>
        <p className="text-xs text-taupe">{content.communityNote}</p>
      </div>

      {state.status === "loading" && <p className="text-sm text-taupe">{content.communityLoading}</p>}
      {state.status === "unavailable" && (
        <p role="alert" className="text-sm text-taupe">
          {content.communityUnavailable}
        </p>
      )}
      {state.status === "ready" && state.posts.length === 0 && <p className="rounded-2xl border border-dashed border-graphite/20 px-4 py-8 text-center text-sm text-taupe">{content.communityEmpty}</p>}
      {failed && (
        <p role="alert" className="text-xs text-cat-service">
          {content.stampFailed}
        </p>
      )}
      {state.status === "ready" && state.posts.length > 0 && (
        <ul className="space-y-3">
          {state.posts.map((post) => (
            <PostCard key={post.id} post={post} busy={busy === post.id} onStamp={() => void press(post)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PostCard({ post, busy, onStamp }: { post: Post; busy: boolean; onStamp: () => void }) {
  const category: CategoryId = categoryOfKind[post.kind as QuestKind] ?? "station";
  const style = categoryStyle[category];
  const Icon = style.icon;
  return (
    <li className="flex overflow-hidden rounded-xl border border-hairline bg-ivory shadow-float">
      <div className={cn("flex w-11 shrink-0 items-center justify-center border-r border-dashed border-graphite/15 sm:w-14", style.soft)}>
        <Icon className={cn("size-4", style.text)} aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className={cn("text-[0.7rem] font-semibold", style.text)}>{kindLabels[post.kind as QuestKind] ?? categoryInfo(category).label}</p>
          <h3 className="font-serif text-lg leading-tight font-semibold">{post.station_name}</h3>
          <p className="line-clamp-1 text-sm text-graphite/80">{post.header}</p>
          <blockquote className="border-l-2 border-graphite/15 pl-2.5 font-serif text-sm text-graphite/85 italic">“{post.text}”</blockquote>
          <p className="pt-0.5 font-mono text-[0.62rem] tracking-wide text-taupe uppercase">
            {post.mine ? content.you : content.author(post.author)} · {day(post.completed_at)}
          </p>
          {post.resolved_at && <span className="inline-block rounded-full bg-stone px-2 py-0.5 text-[0.68rem] text-taupe">{content.fixed}</span>}
        </div>
        <LikeStamp station={post.station_name} likes={post.likes} liked={post.liked} mine={post.mine} busy={busy} onStamp={onStamp} />
      </div>
    </li>
  );
}
