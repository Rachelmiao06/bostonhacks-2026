"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; short?: string; also?: string[] };

const isActive = (item: Item, pathname: string | null) => {
  if (pathname === null) return false;
  if (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) return true;
  return (item.also ?? []).some((p) => pathname.startsWith(p));
};

function Links({ items, pathname }: { items: Item[]; pathname: string | null }) {
  const row = useRef<HTMLUListElement>(null);

  // From Louie's PR #12: if the tabs ever outgrow a phone, the row scrolls sideways and keeps the current tab in view.
  useEffect(() => {
    row.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <ul ref={row} className="flex min-w-0 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = isActive(item, pathname);
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative block rounded-full px-3 py-2 font-heading text-[0.82rem] font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-graphite/40 sm:px-4 sm:text-sm",
                active ? "text-ivory" : "text-taupe hover:bg-ivory/60 hover:text-graphite",
              )}
              // The current tab is the same pressed green glass as the primary buttons.
              style={
                active
                  ? {
                      background: "linear-gradient(180deg, color-mix(in oklab, var(--leaf) 30%, var(--cat-verify)) 0%, var(--cat-verify) 100%)",
                      boxShadow:
                        "inset 0 1px 0 color-mix(in oklab, var(--ivory) 55%, transparent), 0 4px 10px -5px color-mix(in oklab, var(--cat-verify) 70%, transparent)",
                    }
                  : undefined
              }
            >
              {item.short ? (
                <>
                  <span className="sm:hidden">{item.short}</span>
                  <span className="max-sm:hidden">{item.label}</span>
                </>
              ) : (
                item.label
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Main links. Pass `pathname={null}` for the static fallback (no link marked as current). */
export function NavLinks({ items, pathname }: { items: Item[]; pathname?: string | null }) {
  return pathname === undefined ? <CurrentLinks items={items} /> : <Links items={items} pathname={pathname} />;
}

function CurrentLinks({ items }: { items: Item[] }) {
  return <Links items={items} pathname={usePathname()} />;
}

/** Secondary pages (About) behind a small "more" button. */
export function MoreMenu({ items }: { items: Item[] }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="More pages"
        className="grid size-9 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-ivory/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/40 data-popup-open:bg-ivory/60"
      >
        <Ellipsis className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-50">
          <Menu.Popup className="min-w-40 origin-(--transform-origin) rounded-xl border border-hairline bg-ivory p-1 font-ui text-sm text-graphite shadow-float transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {items.map((item) => (
              <Menu.LinkItem
                key={item.href}
                render={<Link href={item.href} />}
                className="block cursor-pointer rounded-lg px-3 py-2 outline-none data-highlighted:bg-stone-deep/60"
              >
                {item.label}
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
