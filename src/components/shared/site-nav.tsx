import Link from "next/link";
import { site } from "@/lib/config";

export function SiteNav() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">{site.name}</Link>
        <div className="flex gap-4 text-sm text-muted-foreground">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
