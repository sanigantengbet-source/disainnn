/**
 * Real design-system extraction.
 * Fetches the target page HTML + its real stylesheets and parses actual
 * declared values. No AI, no dummy data.
 */

export type ColorToken = { hex: string; count: number };
export type TypeRow = {
  element: string;
  family: string;
  size: string;
  weight: string;
  height: string;
  count?: number;
};
export type CssSource = {
  kind: "inline" | "style-attr" | "stylesheet";
  label: string;
  bytes: number;
  rules: number;
  colors: number;
  fonts: number;
  typeHits: number;
  ok: boolean;
};
export type Accuracy = {
  score: number;
  level: "high" | "medium" | "low";
  samples: number;
  note: string;
};
export type Audit = {
  sources: CssSource[];
  totals: { sheetsFound: number; sheetsFetched: number; bytes: number; declarations: number };
  colorAccuracy: Accuracy;
  typographyAccuracy: Accuracy;
  method: string;
};
export type PageResult = {
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
  audit: Audit;
};
export type ExtractResult = { pages: PageResult[]; links: string[] };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function get(url: string, timeout = 15000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "*/*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function toHex(input: string): string | null {
  const s = input.trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) {
      h = h
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("");
    }
    h = h.slice(0, 6);
    if (h.length !== 6) return null;
    return "#" + h.toUpperCase();
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    if (parts[3] !== undefined && parseFloat(parts[3]) < 0.5) return null;
    const nums = parts.slice(0, 3).map((p) =>
      p.endsWith("%") ? Math.round((parseFloat(p) / 100) * 255) : Math.round(parseFloat(p)),
    );
    if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
    return (
      "#" + nums.map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()
    );
  }
  return null;
}

function saturation(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { s: 0, l };
  const d = max - min;
  return { s: l > 0.5 ? d / (2 - max - min) : d / (max + min), l };
}

function absolute(href: string, base: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function attr(tag: string, name: string) {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : "";
}

function better(prev: string | undefined, next: string | undefined) {
  if (!next || /inherit|initial|unset|revert/i.test(next)) return prev;
  if (!prev) return next;
  const concrete = (v: string) => /^-?[\d.]+(px|rem|em|%|pt|vw|vh)?$/i.test(v.trim());
  if (!concrete(prev) && concrete(next)) return next;
  return prev;
}

const ELEMENTS = ["h1", "h2", "h3", "h4", "p", "span", "button", "a", "input", "body"];

function parseCss(css: string) {
  const colors = new Map<string, number>();
  const fonts = new Map<string, number>();
  const radii = new Map<string, number>();
  const byElement = new Map<string, Record<string, string>>();
  const variants = new Map<string, TypeRow & { count: number }>();

  // colors anywhere in css
  const colorRe = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g;
  for (const raw of css.match(colorRe) ?? []) {
    const hex = toHex(raw);
    if (!hex) continue;
    colors.set(hex, (colors.get(hex) ?? 0) + 1);
  }

  const ruleRe = /([^{}@]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  let rules = 0;
  let typeHits = 0;
  while ((m = ruleRe.exec(css))) {
    rules++;
    const selectors = m[1].trim().toLowerCase();
    const body = m[2];
    const decl = (prop: string) => {
      const d = body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;!]+)`, "i"));
      return d ? d[1].trim() : "";
    };

    const fam = decl("font-family") || decl("font");
    if (fam) {
      const first = fam.split(",")[0].replace(/["']/g, "").trim();
      if (first && first.length < 40 && !/^(inherit|initial|unset|var\()/.test(first)) {
        fonts.set(first, (fonts.get(first) ?? 0) + 1);
      }
    }
    const rad = decl("border-radius");
    if (rad && !rad.includes("var(")) radii.set(rad, (radii.get(rad) ?? 0) + 1);

    for (const el of ELEMENTS) {
      const matchesEl = selectors
        .split(",")
        .some((s) => new RegExp(`(^|[\\s>+~])${el}([\\s.:\\[>+~,]|$)`).test(s.trim() + " "));
      if (!matchesEl) continue;
      const size = decl("font-size");
      const weight = decl("font-weight");
      const height = decl("line-height");
      const family = fam ? fam.split(",")[0].replace(/["']/g, "").trim() : "";
      if (!size && !weight && !height && !family) continue;
      typeHits++;
      const cur = byElement.get(el) ?? {};
      cur.size = better(cur.size, size) ?? cur.size;
      cur.weight = better(cur.weight, weight) ?? cur.weight;
      cur.height = better(cur.height, height) ?? cur.height;
      cur.family = better(cur.family, family) ?? cur.family;
      byElement.set(el, cur);

      const clean = (v: string) => (!v || /var\(|inherit|initial|unset|revert/i.test(v) ? "" : v.trim());
      const row = {
        element: el,
        family: clean(family),
        size: clean(size),
        weight: clean(weight),
        height: clean(height),
      };
      if (row.size || row.weight || row.height) {
        const key = `${row.element}|${row.family}|${row.size}|${row.weight}|${row.height}`;
        const prev = variants.get(key);
        if (prev) prev.count++;
        else variants.set(key, { ...row, count: 1 });
      }
    }
  }
  return { colors, fonts, radii, byElement, variants, rules, typeHits };
}

function mergeCount(target: Map<string, number>, src: Map<string, number>) {
  for (const [k, v] of src) target.set(k, (target.get(k) ?? 0) + v);
}

async function extractPage(pageUrl: string): Promise<{ page: PageResult; links: string[] }> {
  const html = await get(pageUrl);
  const origin = new URL(pageUrl).origin;

  const title =
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim().slice(0, 160) ??
    new URL(pageUrl).hostname;
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0]
      ? attr(html.match(/<meta[^>]+name=["']description["'][^>]*>/i)![0], "content")
      : "";

  // stylesheets
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const sheetUrls: string[] = [];
  for (const tag of linkTags) {
    if (!/stylesheet/i.test(attr(tag, "rel"))) continue;
    const abs = absolute(attr(tag, "href"), pageUrl);
    if (abs) sheetUrls.push(abs);
  }
  const inline = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? [])
    .map((s) => s.replace(/<\/?style[^>]*>/gi, ""))
    .join("\n");
  const styleAttrs = (html.match(/style\s*=\s*"[^"]*"/gi) ?? [])
    .map((s) => `.inline{${s.slice(7, -1)}}`)
    .join("\n");

  const sheets = await Promise.all(
    sheetUrls.slice(0, 10).map((u) => get(u, 12000).catch(() => "")),
  );

  const colors = new Map<string, number>();
  const fonts = new Map<string, number>();
  const radii = new Map<string, number>();
  const byElement = new Map<string, Record<string, string>>();
  const allVariants = new Map<string, TypeRow & { count: number }>();

  const cssSources: CssSource[] = [];
  const labelled: Array<{ kind: CssSource["kind"]; label: string; css: string; ok: boolean }> = [
    { kind: "inline", label: "<style> blocks in HTML", css: inline, ok: !!inline },
    { kind: "style-attr", label: "inline style=\"…\" attributes", css: styleAttrs, ok: !!styleAttrs },
    ...sheets.map((css, i) => ({
      kind: "stylesheet" as const,
      label: sheetUrls[i],
      css,
      ok: !!css,
    })),
  ];

  for (const src of labelled) {
    const css = src.css;
    const parsed = css ? parseCss(css.slice(0, 900_000)) : null;
    cssSources.push({
      kind: src.kind,
      label: src.label,
      bytes: css.length,
      rules: parsed?.rules ?? 0,
      colors: parsed ? [...parsed.colors.values()].reduce((a, b) => a + b, 0) : 0,
      fonts: parsed?.fonts.size ?? 0,
      typeHits: parsed?.typeHits ?? 0,
      ok: src.ok,
    });
    if (!parsed) continue;
    mergeCount(colors, parsed.colors);
    mergeCount(fonts, parsed.fonts);
    mergeCount(radii, parsed.radii);
    for (const [el, vals] of parsed.byElement) {
      const cur = byElement.get(el) ?? {};
      byElement.set(el, {
        size: better(cur.size, vals.size) ?? "",
        weight: better(cur.weight, vals.weight) ?? "",
        height: better(cur.height, vals.height) ?? "",
        family: better(cur.family, vals.family) ?? "",
      });
    }
    for (const [k, v] of parsed.variants) {
      const prev = allVariants.get(k);
      if (prev) prev.count += v.count;
      else allVariants.set(k, { ...v });
    }
  }

  const sorted = [...colors.entries()]
    .map(([hex, count]) => ({ hex, count }))
    .sort((a, b) => b.count - a.count);

  const primary = sorted
    .filter((c) => {
      const { s, l } = saturation(c.hex);
      return s > 0.25 && l > 0.12 && l < 0.9;
    })
    .slice(0, 8);
  const neutral = sorted.filter((c) => saturation(c.hex).s <= 0.25).slice(0, 10);

  const fontRank = [...fonts.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
  const topFont = fontRank[0] ?? "—";

  const toPx = (v: string, requireUnit = false): number | null => {
    const m = v.trim().match(/^(-?[\d.]+)(px|rem|em|pt)?$/i);
    if (!m) return null;
    if (requireUnit && !m[2]) return null;
    const n = parseFloat(m[1]);
    if (Number.isNaN(n)) return null;
    const unit = (m[2] ?? "px").toLowerCase();
    if (unit === "rem" || unit === "em") return n * 16;
    if (unit === "pt") return n * (96 / 72);
    return n;
  };
  const fmtPx = (n: number) => `${Math.round(n * 10000) / 10000}px`;

  const detailed: TypeRow[] = [...allVariants.values()]
    .map((v) => {
      const sizePx = toPx(v.size);
      const size = sizePx !== null ? fmtPx(sizePx) : v.size || "—";
      let height = v.height || "—";
      const hPx = toPx(v.height, true);
      if (hPx !== null) height = fmtPx(hPx);
      else if (/^[\d.]+$/.test(v.height) && sizePx !== null)
        height = fmtPx(parseFloat(v.height) * sizePx);
      return {
        element: v.element,
        family: v.family || topFont,
        size,
        weight: v.weight || "—",
        height,
        count: v.count,
      };
    })
    .filter((r) => r.size !== "—" || r.weight !== "—" || r.height !== "—")
    .sort((a, b) => {
      const fa = fontRank.indexOf(a.family);
      const fb = fontRank.indexOf(b.family);
      if (fa !== fb) return (fa < 0 ? 999 : fa) - (fb < 0 ? 999 : fb);
      return (b.count ?? 0) - (a.count ?? 0);
    })
    .slice(0, 60);

  const typography: TypeRow[] = detailed.length
    ? detailed
    : ELEMENTS.filter((el) => byElement.has(el)).map((el) => {
        const v = byElement.get(el)!;
        return {
          element: el,
          family: v.family || topFont,
          size: v.size || "—",
          weight: v.weight || "—",
          height: v.height || "—",
        };
      });

  // internal links
  const links = new Set<string>();
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = attr(tag, "href");
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;
    const abs = absolute(href, pageUrl);
    if (!abs) continue;
    const u = new URL(abs);
    if (u.origin !== origin) continue;
    if (/\.(png|jpe?g|svg|webp|gif|pdf|zip|mp4|css|js)$/i.test(u.pathname)) continue;
    u.hash = "";
    if (u.toString() !== pageUrl) links.add(u.toString());
  }

  const favicon =
    absolute(
      linkTags.find((t) => /icon/i.test(attr(t, "rel")))
        ? attr(linkTags.find((t) => /icon/i.test(attr(t, "rel")))!, "href")
        : "/favicon.ico",
      pageUrl,
    ) ?? "";

  const colorSamples = [...colors.values()].reduce((a, b) => a + b, 0);
  const sheetsFetched = cssSources.filter((s) => s.kind === "stylesheet" && s.ok).length;
  const declarations = cssSources.reduce((a, s) => a + s.rules, 0);

  const colorScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (colorSamples > 0 ? 35 : 0) +
          Math.min(30, (primary.length + neutral.length) * 3) +
          Math.min(25, sheetsFetched * 6) +
          (colorSamples > 200 ? 10 : colorSamples > 40 ? 5 : 0),
      ),
    ),
  );

  const typeFields = typography.length * 3;
  const resolved = typography.reduce(
    (a, t) => a + [t.size, t.weight, t.height].filter((v) => v !== "—").length,
    0,
  );
  const typeScore = typeFields ? Math.round((resolved / typeFields) * 100) : 0;
  const level = (n: number): Accuracy["level"] => (n >= 75 ? "high" : n >= 45 ? "medium" : "low");

  const audit: Audit = {
    sources: cssSources,
    totals: {
      sheetsFound: sheetUrls.length,
      sheetsFetched,
      bytes: cssSources.reduce((a, s) => a + s.bytes, 0),
      declarations,
    },
    colorAccuracy: {
      score: colorScore,
      level: level(colorScore),
      samples: colorSamples,
      note:
        colorSamples === 0
          ? "No literal color values found — the site likely paints via CSS variables or runtime JS."
          : `${colorSamples} literal color declarations parsed from ${sheetsFetched} stylesheet(s) + inline CSS.`,
    },
    typographyAccuracy: {
      score: typeScore,
      level: level(typeScore),
      samples: resolved,
      note: typeFields
        ? `${resolved}/${typeFields} type fields resolved to concrete declared values (size · weight · line-height).`
        : "No element-level typography rules matched; the site may scope type via utility classes only.",
    },
    method:
      "Static parse of the page's real HTML, <style> blocks, style attributes and linked stylesheets. Values are as declared in CSS — not browser-computed, and cascade/media-query overrides are approximated by preferring concrete values.",
  };

  const page: PageResult = {
    url: pageUrl,
    title,
    description,
    favicon,
    screenshot: `https://s.wordpress.com/mshots/v1/${encodeURIComponent(pageUrl)}?w=1280&h=800`,
    primary,
    neutral,
    typography,
    fonts: [...fonts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f]) => f),
    radii: [...radii.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([r]) => r),
    html: "",
    audit,
  };
  page.html = buildHtmlPreview(page);
  return { page, links: [...links] };
}

export function groupTypography(rows: TypeRow[]): Array<[string, TypeRow[]]> {
  const groups = new Map<string, TypeRow[]>();
  for (const r of rows) {
    const key = r.family || "—";
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  return [...groups.entries()];
}

export function buildDesignMd(p: PageResult) {
  const host = new URL(p.url).hostname;
  return [
    `# DESIGN.md — ${host}`,
    "",
    `> Source: ${p.url}`,
    p.description ? `> ${p.description}` : "",
    "",
    "## Colors",
    "",
    "### Primary",
    ...(p.primary.length ? p.primary.map((c) => `- \`${c.hex}\` — used ${c.count}×`) : ["- none detected"]),
    "",
    "### Neutral",
    ...(p.neutral.length ? p.neutral.map((c) => `- \`${c.hex}\` — used ${c.count}×`) : ["- none detected"]),
    "",
    "## Typography Scale",
    "",
    `Fonts: ${p.fonts.join(", ") || "—"}`,
    "",
    ...groupTypography(p.typography).flatMap(([family, rows]) => [
      `### ${family}`,
      "",
      "| element | size | weight | line-height | uses |",
      "| --- | --- | --- | --- | --- |",
      ...rows.map(
        (t) => `| ${t.element} | ${t.size} | ${t.weight} | ${t.height} | ${t.count ?? "—"} |`,
      ),
      "",
    ]),
    "## Radii",
    "",
    p.radii.length ? p.radii.map((r) => `- \`${r}\``).join("\n") : "- none detected",
    "",
    "## Extraction Audit",
    "",
    `- Method: ${p.audit.method}`,
    `- Stylesheets: ${p.audit.totals.sheetsFetched}/${p.audit.totals.sheetsFound} fetched · ${p.audit.totals.declarations} rules · ${Math.round(p.audit.totals.bytes / 1024)} KB CSS`,
    `- Color accuracy: ${p.audit.colorAccuracy.score}% (${p.audit.colorAccuracy.level}) — ${p.audit.colorAccuracy.note}`,
    `- Typography accuracy: ${p.audit.typographyAccuracy.score}% (${p.audit.typographyAccuracy.level}) — ${p.audit.typographyAccuracy.note}`,
    "",
    "### CSS sources",
    "",
    ...p.audit.sources.map(
      (s) =>
        `- \`${s.kind}\` ${s.label} — ${Math.round(s.bytes / 1024)} KB · ${s.rules} rules · ${s.colors} colors · ${s.typeHits} type hits${s.ok ? "" : " (unavailable)"}`,
    ),
    "",

  ]
    .filter((l) => l !== "")
    .join("\n");
}

function buildHtmlPreview(p: PageResult) {
  const bg = p.neutral[0]?.hex ?? "#0D1117";
  const accent = p.primary[0]?.hex ?? "#3B82F6";
  const font = p.fonts[0] ?? "sans-serif";
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${new URL(p.url).hostname} — preview</title>
<style>
  body{margin:0;background:${bg};color:#fff;font-family:"${font}",system-ui,sans-serif;padding:32px}
  .btn{background:${accent};color:#fff;border:0;border-radius:${p.radii[0] ?? "8px"};padding:12px 20px;font-weight:600}
  .sw{display:inline-block;width:56px;height:56px;border-radius:10px;margin:4px}
  h1{font-size:${p.typography.find((t) => t.element === "h1")?.size ?? "40px"}}
</style></head>
<body>
  <h1>${new URL(p.url).hostname}</h1>
  <p>Design tokens extracted from live CSS.</p>
  <div>${[...p.primary, ...p.neutral].map((c) => `<span class="sw" style="background:${c.hex}"></span>`).join("")}</div>
  <p><button class="btn">Primary action</button></p>
</body></html>`;
}

export async function runExtraction(rawUrl: string, multiPage: boolean): Promise<ExtractResult> {
  let target = rawUrl.trim();
  if (!/^https?:\/\//i.test(target)) target = "https://" + target;
  const first = await extractPage(target);
  const pages = [first.page];

  if (multiPage) {
    const candidates = first.links.slice(0, 5);
    const rest = await Promise.all(
      candidates.map((u) =>
        extractPage(u)
          .then((r) => r.page)
          .catch(() => null),
      ),
    );
    for (const p of rest) if (p) pages.push(p);
  }

  return { pages, links: first.links.slice(0, 20) };
}
