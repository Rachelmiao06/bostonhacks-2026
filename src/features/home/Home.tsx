import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coin } from "@/components/shared/coin";
import { Dice } from "@/components/shared/dice";
import { Pawn } from "@/components/shared/pawn";
import { Ribbon } from "@/components/shared/ribbon";
import { Tilt } from "@/components/shared/tilt";
import { cn } from "@/lib/utils";
import { content } from "./content";

const NUMBER_TONES = {
  sun: "bg-sun",
  sky: "bg-sky",
  leaf: "bg-leaf",
} as const;

export function Home() {
  return (
    <div className="space-y-20">
      {/* Hero: tilted sky panel, pixel title, big yellow START pill */}
      <section className="relative isolate mx-auto max-w-3xl px-2 pt-8 pb-10 text-center sm:pb-16">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 -rotate-2 rounded-3xl border-2 border-ink bg-sky shadow-tile"
        />

        <h1 className="font-pixel text-2xl leading-snug text-paper [text-shadow:3px_3px_0_var(--ink)] sm:text-5xl sm:leading-snug sm:[text-shadow:4px_4px_0_var(--ink)]">
          {content.title}
        </h1>

        <div className="mt-8 flex justify-center">
          <Link href={content.startHref} className={cn(buttonVariants({ size: "xl" }), "h-16 px-12 text-3xl")}>
            {content.startLabel}
            <ArrowRight className="size-6" aria-hidden />
          </Link>
        </div>

        <div className="mt-10">
          <Ribbon>{content.tagline}</Ribbon>
        </div>

        {/* phone: dice sits in the flow under the ribbon */}
        <div className="mt-8 flex items-center justify-center gap-5 sm:hidden">
          <Dice size={72} />
          <p className="font-pixel text-[0.5rem] text-ink/80">{content.diceHint}</p>
        </div>

        {/* floating game pieces */}
        <Dice size={84} className="absolute bottom-2 left-6 hidden sm:block" />
        <Pawn
          tone="cherry"
          size={52}
          className="absolute top-2 left-1 hidden animate-float [--tilt:-6deg] sm:block"
        />
        <Coin size={48} className="absolute -top-5 right-3 sm:top-6 sm:right-4 sm:size-14" />
        <Pawn
          tone="leaf"
          size={46}
          className="absolute right-3 -bottom-6 animate-float [--tilt:5deg] [animation-delay:-2s] sm:right-10 sm:bottom-0"
        />
        <p className="absolute left-4 -bottom-12 hidden font-pixel text-[0.5rem] text-paper/70 sm:block">
          {content.diceHint}
        </p>
      </section>

      {/* Board track: one tile per page */}
      <section className="space-y-8">
        <div className="text-center">
          <Ribbon tone="sun">{content.squaresHeading}</Ribbon>
        </div>
        <ol className="grid gap-8 sm:grid-cols-3">
          {content.squares.map((square, i) => (
            <li key={square.href}>
              <Tilt>
                <Link
                  href={square.href}
                  className="group block rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-sky/60"
                >
                  <Card className="transition-shadow group-hover:shadow-tile-lift">
                    <CardHeader>
                      <span
                        className={cn(
                          "mb-2 grid size-12 place-items-center rounded-full border-2 border-ink font-pixel text-sm text-ink shadow-chip",
                          NUMBER_TONES[square.tone],
                        )}
                      >
                        {i + 1}
                      </span>
                      <CardTitle>{square.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">{square.blurb}</CardContent>
                  </Card>
                </Link>
              </Tilt>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
