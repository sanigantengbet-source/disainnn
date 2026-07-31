import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  Link2,
  ArrowRight,
  FileText,
  Monitor,
  Camera,
  Layers,
  Loader2,
  Compass,
  Menu,
  ShieldCheck,
  Gauge,
  FileCode2,
  Braces,
  Diamond,
  MessageCircle,
  Twitter,
  Mail,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { extractDesign } from "@/lib/extract.functions";
import { cn } from "@/lib/utils";
import { LandingSections } from "@/components/landing-sections";

const CHANNEL_URL = "https://whatsapp.com/channel/0029Vb6ukqnHQbS4mKP0j80L";
const LOGO_SRC = "/designsf-logo.jpg";

const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Resources",
    links: [
      { label: "Extract", href: "#top" },
      { label: "How it works", href: "#top" },
      { label: "Design tokens", href: "#top" },
      { label: "CSS audit", href: "#top" },
    ],
  },
  {
    title: "Output",
    links: [
      { label: "DESIGN.md", href: "#top" },
      { label: "HTML preview", href: "#top" },
      { label: "Color tokens", href: "#top" },
      { label: "Typography", href: "#top" },
    ],
  },
  {
    title: "Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "Support", href: CHANNEL_URL },
      { label: "Sitemap", href: "/sitemap.xml" },
      { label: "robots.txt", href: "/robots.txt" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#top" },
      { label: "SANN404 Forum", href: CHANNEL_URL },
      { label: "Privacy Policy", href: "#top" },
      { label: "Terms of Service", href: "#top" },
    ],
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DesignSF — Extract the design system behind any website" },
      {
        name: "description",
        content:
          "Paste a URL and get its real colors, typography scale, radii and a DESIGN.md — extracted from live CSS, with a full source audit and accuracy scores.",
      },
      { property: "og:title", content: "DesignSF — Website to design system" },
      {
        property: "og:description",
        content:
          "Real colors, typography scale, CSS source audit and DESIGN.md extracted from any website's live CSS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type ColorToken = { hex: string; count: number };
type TypeRow = { element: string; family: string; size: string; weight: string; height: string };
type CssSource = {
  kind: "inline" | "style-attr" | "stylesheet";
  label: string;
  bytes: number;
  rules: number;
  colors: number;
  fonts: number;
  typeHits: number;
  ok: boolean;
};
type Accuracy = { score: number; level: "high" | "medium" | "low"; samples: number; note: string };
type Audit = {
  sources: CssSource[];
  totals: { sheetsFound: number; sheetsFetched: number; bytes: number; declarations: number };
  colorAccuracy: Accuracy;
  typographyAccuracy: Accuracy;
  method: string;
};
type Page = {
  url: string;
  title: string;
  description: string;
  favicon: string;
  screenshot: string;
  primary: ColorToken[];
  neutral: ColorToken[];
  typography: TypeRow[];
  fonts: string[];
  radii: string[];
  html: string;
  md: string;
  audit: Audit;
};

function groupTypography(rows: TypeRow[]): Array<[string, TypeRow[]]> {
  const groups = new Map<string, TypeRow[]>();
  for (const r of rows) {
    const key = r.family || "—";
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  return [...groups.entries()];
}

const SAMPLES = ["apple.com", "stripe.com", "linear.app", "github.com", "notion.so"];

const TYPED_URLS = [
  "https://vercel.com",
  "https://github.com",
  "https://stripe.com",
  "https://linear.app",
  "https://notion.so",
  "https://apple.com",
];

function useTypingPlaceholder(words: string[], active: boolean) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!active) return;
    const word = words[wordIdx % words.length];
    const done = !deleting && text === word;
    const cleared = deleting && text === "";

    const delay = done ? 1600 : cleared ? 300 : deleting ? 35 : 75;
    const timer = setTimeout(() => {
      if (done) return setDeleting(true);
      if (cleared) {
        setDeleting(false);
        setWordIdx((i) => (i + 1) % words.length);
        return;
      }
      setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1));
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, wordIdx, words, active]);

  return text;
}


const LOADING_STEPS = [
  "Fetching page HTML",
  "Discovering linked stylesheets",
  "Parsing color declarations",
  "Extracting typography scale",
  "Building DESIGN.md",
  "Finalizing preview",
];

function ExtractionLoader() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    setStep(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        const remaining = 92 - p;
        const jump = Math.max(0.5, Math.min(remaining * 0.08, 8));
        return Math.min(92, p + jump);
      });
    }, 280);

    const stepInterval = setInterval(() => {
      setStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 2200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative px-5 py-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex items-start gap-4">
          <span className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Loader2 className="size-5 animate-spin" />
            <span className="absolute inset-0 rounded-xl bg-primary/10 blur-md" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Extracting design system</p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground transition-all duration-300">
              {LOADING_STEPS[step]}…
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
              This usually takes 5–15 seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function Panel({
  title,
  children,
  right,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {right}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Swatches({ label, colors }: { label: string; colors: ColorToken[] }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="mb-2 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      {colors.length === 0 ? (
        <p className="text-xs text-muted-foreground">No colors detected.</p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          {colors.map((c) => (
            <div key={c.hex} className="flex items-center gap-2">
              <span
                className="size-9 rounded-lg border border-border"
                style={{ backgroundColor: c.hex }}
                aria-hidden
              />
              <code className="font-mono text-xs text-foreground">{c.hex}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LEVEL_STYLES: Record<Accuracy["level"], string> = {
  high: "border-primary/50 bg-primary/10 text-primary",
  medium: "border-border bg-secondary text-foreground",
  low: "border-destructive/40 bg-destructive/10 text-destructive-foreground",
};

function AccuracyMeter({ label, a, icon }: { label: string; a: Accuracy; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-muted-foreground">{icon}</span>
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium", LEVEL_STYLES[a.level])}>
          {a.score}% · {a.level}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${a.score}%` }} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{a.note}</p>
    </div>
  );
}

const KIND_LABEL: Record<CssSource["kind"], string> = {
  inline: "inline <style>",
  "style-attr": "style attribute",
  stylesheet: "stylesheet",
};

function Index() {
  const [url, setUrl] = useState("");
  const [multiPage, setMultiPage] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const [tab, setTab] = useState<"md" | "html">("md");
  const [copied, setCopied] = useState(false);
  const typedPlaceholder = useTypingPlaceholder(TYPED_URLS, url.length === 0);

  const copyOutput = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const run = useServerFn(extractDesign);
  const mutation = useMutation({
    mutationFn: (input: { url: string; multiPage: boolean }) => run({ data: input }),
    onSuccess: () => setPageIdx(0),
  });

  const pages = (mutation.data?.pages ?? []) as Page[];
  const page = pages[pageIdx];

  const shotsRef = useRef<HTMLDivElement | null>(null);
  const goShot = (i: number) => {
    const idx = Math.max(0, Math.min(pages.length - 1, i));
    setPageIdx(idx);
    const el = shotsRef.current;
    if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  };

  const submit = (value?: string) => {
    const target = (value ?? url).trim();
    if (!target) return;
    setUrl(target);
    mutation.mutate({ url: target, multiPage });
  };

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <header className="mb-12 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={LOGO_SRC}
              alt="DesignSF logo"
              className="size-9 shrink-0 rounded-xl object-cover"
            />
            <span className="truncate text-lg font-semibold tracking-tight">DesignSF</span>

          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-foreground sm:flex">
              <Compass className="size-3.5" /> Discover
            </span>
            <span className="grid size-9 place-items-center rounded-full border border-border">
              <Menu className="size-3.5" />
            </span>
          </div>
        </header>

        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Website → Design system
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Extract the design system behind <em className="text-primary">any</em> website.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            From any website — a structured <span className="text-foreground">DESIGN.md</span>, a live{" "}
            <span className="text-foreground">HTML preview</span>, and a full{" "}
            <span className="text-foreground">CSS source audit</span>.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3 pb-4">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={typedPlaceholder ? `${typedPlaceholder}|` : "|"}
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              inputMode="url"
            />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <button
              type="button"
              onClick={() => setMultiPage((v) => !v)}
              aria-pressed={multiPage}
              className="flex min-w-0 items-center gap-2 justify-self-start rounded-full border border-border bg-secondary px-2.5 py-1.5"
            >
              <span
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full border-2 border-muted-foreground/30 transition-colors",
                  multiPage ? "bg-primary border-primary" : "bg-muted/80",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-3.5 rounded-full bg-foreground shadow-md transition-all",
                    multiPage ? "left-[18px]" : "left-0.5",
                  )}
                />
                <span
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-[8px] font-bold transition-opacity",
                    multiPage ? "left-1 text-primary-foreground" : "right-1 text-muted-foreground/60",
                  )}
                >
                  {multiPage ? "I" : "O"}
                </span>
              </span>
              <Layers className="size-3 shrink-0 text-primary" />
              <span className="truncate text-[11px] font-medium">
                Multi-page{multiPage ? " · 5" : ""}
              </span>
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !url.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="Extract design system"
            >
              {mutation.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ArrowRight className="size-5" />
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs tracking-widest text-muted-foreground uppercase">Try</span>
          {SAMPLES.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${s}&sz=64`}
                alt=""
                aria-hidden
                loading="lazy"
                className="size-3.5 rounded-sm"
              />
              {s}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {["Real computed CSS", "DESIGN.md + HTML export", "No card to start"].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <Diamond className="size-2.5 text-primary" /> {t}
            </span>
          ))}
        </div>

        {mutation.isError && (
          <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            Extraction failed: {(mutation.error as Error).message}
          </p>
        )}

        {mutation.isPending && <ExtractionLoader />}

        {page && (
          <div className="mt-10 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-secondary">
                <img src={page.favicon} alt="" aria-hidden className="size-5" loading="lazy" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{new URL(page.url).hostname}</p>
                <p className="truncate text-xs text-muted-foreground">Design system extracted</p>
              </div>
            </div>

            <Panel
              title={
                pages.length > 1
                  ? `${pages.length} screenshots captured`
                  : "Above the fold"
              }
              icon={<Camera className="size-3.5 text-primary" />}
              right={
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {pages.length > 1 ? `${pageIdx + 1} / ${pages.length}` : "screenshot"}
                </span>
              }
            >
              <div className="relative">
                <div
                  className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-1"
                  ref={shotsRef}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                    if (i !== pageIdx && i < pages.length) setPageIdx(i);
                  }}
                >
                  {pages.map((p) => (
                    <img
                      key={p.url}
                      src={p.screenshot}
                      alt={`Screenshot of ${new URL(p.url).hostname}`}
                      loading="lazy"
                      className="w-full shrink-0 snap-center rounded-lg border border-border bg-secondary"
                    />
                  ))}
                </div>

                {pages.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous screenshot"
                      onClick={() => goShot(pageIdx - 1)}
                      className="absolute top-1/2 left-2 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-foreground"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next screenshot"
                      onClick={() => goShot(pageIdx + 1)}
                      className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-foreground"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </>
                )}
              </div>

              {pages.length > 1 && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                  {pages.map((p, i) => (
                    <button
                      key={p.url}
                      type="button"
                      aria-label={`Go to screenshot ${i + 1}`}
                      onClick={() => goShot(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === pageIdx ? "w-5 bg-primary" : "w-1.5 bg-muted",
                      )}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Extracted Colors">
              <Swatches label="Primary" colors={page.primary} />
              <Swatches label="Neutral" colors={page.neutral} />
            </Panel>

            <Panel title="Typography Scale">
              {groupTypography(page.typography).map(([family, rows]) => (
                <div key={family} className="mb-5 last:mb-0">
                  <p className="mb-2 text-sm font-semibold">{family}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] tracking-widest text-muted-foreground uppercase">
                          <th className="pb-2 font-medium">Element</th>
                          <th className="pb-2 text-right font-medium">Size</th>
                          <th className="pb-2 text-right font-medium">Weight</th>
                          <th className="pb-2 text-right font-medium">Height</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((t, i) => (
                          <tr key={`${t.element}-${i}`} className="border-t border-border">
                            <td className="py-2 font-mono text-primary">{t.element}</td>
                            <td className="py-2 text-right font-mono">{t.size}</td>
                            <td className="py-2 text-right font-mono">{t.weight}</td>
                            <td className="py-2 text-right font-mono">{t.height}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {page.radii.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Radii: <code className="font-mono">{page.radii.join(", ")}</code>
                </p>
              )}
            </Panel>


            <Panel
              title="Extraction Audit"
              icon={<ShieldCheck className="size-4 text-primary" />}
              right={
                <span className="shrink-0 text-xs text-muted-foreground">
                  {page.audit.totals.sheetsFetched}/{page.audit.totals.sheetsFound} sheets ·{" "}
                  {Math.round(page.audit.totals.bytes / 1024)} KB
                </span>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <AccuracyMeter
                  label="Color accuracy"
                  a={page.audit.colorAccuracy}
                  icon={<Gauge className="size-4" />}
                />
                <AccuracyMeter
                  label="Typography accuracy"
                  a={page.audit.typographyAccuracy}
                  icon={<Gauge className="size-4" />}
                />
              </div>

              <p className="mt-5 mb-3 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                CSS sources
              </p>
              <ul className="space-y-2">
                {page.audit.sources.map((s, i) => (
                  <li
                    key={`${s.kind}-${i}`}
                    className="rounded-xl border border-border bg-secondary/40 px-4 py-3"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {s.kind === "stylesheet" ? (
                          <FileCode2 className="size-4 shrink-0 text-primary" />
                        ) : (
                          <Braces className="size-4 shrink-0 text-primary" />
                        )}
                        <span className="truncate font-mono text-xs text-foreground">{s.label}</span>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[11px]",
                          s.ok
                            ? "border-border text-muted-foreground"
                            : "border-destructive/40 text-destructive-foreground",
                        )}
                      >
                        {s.ok ? KIND_LABEL[s.kind] : "unavailable"}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                      {Math.round(s.bytes / 1024)} KB · {s.rules} rules · {s.colors} colors · {s.fonts}{" "}
                      fonts · {s.typeHits} type hits
                    </p>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{page.audit.method}</p>
            </Panel>

            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <span className="flex gap-1.5">
                  {["bg-muted", "bg-muted", "bg-muted"].map((c, i) => (
                    <span key={i} className={cn("size-3 rounded-full", c)} />
                  ))}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  DESIGN-{new URL(page.url).hostname.replace(/\./g, "-")}.md
                </span>
              </header>
              <div className="flex gap-1 border-b border-border px-3 py-2">
                {(
                  [
                    ["md", "DESIGN.md", FileText],
                    ["html", "HTML", Monitor],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs transition-colors",
                      tab === key ? "bg-secondary text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {tab === "md" ? (
                  <pre className="max-h-[420px] overflow-auto rounded-xl bg-secondary p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                    {page.md}
                  </pre>
                ) : (
                  <iframe
                    title="HTML preview"
                    srcDoc={page.html}
                    className="h-[420px] w-full rounded-xl border border-border bg-secondary"
                  />
                )}
                <button
                  type="button"
                  onClick={() => copyOutput(tab === "md" ? page.md : page.html)}
                  className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary"
                >
                  {copied ? "Copied!" : `Copy ${tab === "md" ? "DESIGN.md" : "HTML"}`}
                </button>
              </div>
            </section>
          </div>
        )}

        <LandingSections />

        <footer className="mt-16 border-t border-border pt-12">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_SRC}
              alt="DesignSF logo"
              className="size-9 shrink-0 rounded-xl object-cover"
            />
            <span className="text-xl font-semibold tracking-tight">DesignSF</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The Ultimate Design System Extractor for Any Website
          </p>

          <div className="mt-6 flex items-center gap-6 text-muted-foreground">
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp channel"
              className="transition-colors hover:text-foreground"
            >
              <MessageCircle className="size-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="transition-colors hover:text-foreground"
            >
              <Twitter className="size-4" />
            </a>
            <a
              href="mailto:sann404forum@gmail.com"
              aria-label="Email"
              className="transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-bold tracking-wide uppercase">{col.title}</h3>
                <ul className="mt-4 space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
            <p className="text-xs text-muted-foreground">
              Copyright © {new Date().getFullYear()} SANN404 FORUM GROUP. All Rights Reserved.
            </p>
            <Moon className="size-4 shrink-0 text-muted-foreground" />
          </div>
        </footer>
      </div>

      <a
        href={CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join saluran developer"
        className="fixed right-4 bottom-4 z-50 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle className="size-4" />
      </a>
    </main>
  );
}
