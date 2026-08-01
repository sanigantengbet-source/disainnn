import { useEffect, useState } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  PlugZap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { testAiKey } from "@/lib/ai-test.functions";
import { cn } from "@/lib/utils";


export type AiProvider = "openai" | "gemini" | "anthropic";

export type AiSettings = {
  provider: AiProvider;
  apiKey: string;
  model: string;
  enabled: boolean;
  autoFallback: boolean;
};

const STORAGE_KEY = "designsf.ai-settings";

export const PROVIDERS: {
  id: AiProvider;
  label: string;
  hint: string;
  placeholder: string;
  models: string[];
}[] = [
  {
    id: "openai",
    label: "OpenAI",
    hint: "platform.openai.com → API keys",
    placeholder: "sk-...",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "o3-mini", "gpt-5"],
  },
  {
    id: "gemini",
    label: "Gemini",
    hint: "aistudio.google.com → API key",
    placeholder: "AIza...",
    models: [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
    ],
  },
  {
    id: "anthropic",
    label: "Claude",
    hint: "console.anthropic.com → API keys",
    placeholder: "sk-ant-...",
    models: [
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-7-sonnet-latest",
      "claude-sonnet-4-0",
      "claude-opus-4-0",
    ],
  },
];

export const EMPTY_SETTINGS: AiSettings = {
  provider: "openai",
  apiKey: "",
  model: "",
  enabled: false,
  autoFallback: true,
};

export function loadAiSettings(): AiSettings {
  if (typeof window === "undefined") return EMPTY_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SETTINGS;
    return { ...EMPTY_SETTINGS, ...(JSON.parse(raw) as Partial<AiSettings>) };
  } catch {
    return EMPTY_SETTINGS;
  }
}

function saveAiSettings(s: AiSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: AiSettings;
  onSave: (s: AiSettings) => void;
}) {
  const [draft, setDraft] = useState<AiSettings>(settings);
  const [reveal, setReveal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setReveal(false);
      setTesting(false);
      setTestResult(null);
    }
  }, [open, settings]);

  const active = PROVIDERS.find((p) => p.id === draft.provider)!;

  const commit = (next: AiSettings) => {
    saveAiSettings(next);
    onSave(next);
    onOpenChange(false);
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testAiKey({
        data: {
          provider: draft.provider,
          apiKey: draft.apiKey.trim(),
          model: draft.model.trim(),
        },
      });
      setTestResult({ ok: res.ok, message: res.message });
    } catch (e) {
      setTestResult({ ok: false, message: (e as Error).message || "Connection failed." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </span>
            AI DESIGN.md
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Bring your own API key to generate a polished, agent-ready DESIGN.md. Optional — without a
            key you still get the standard extraction and a template DESIGN.md.
          </DialogDescription>

        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Provider
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, provider: p.id, model: "" }))}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
                    draft.provider === p.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Get a key: {active.hint}</p>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              API key
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2">
              <KeyRound className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                type={reveal ? "text" : "password"}
                value={draft.apiKey}
                onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                placeholder={active.placeholder}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? "Hide key" : "Show key"}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Stored only in this browser (localStorage) and sent straight to {active.label}.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Model
            </label>
            <input
              list="ai-model-options"
              value={draft.model}
              onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
              placeholder={active.models[0]}
              spellCheck={false}
              className="w-full rounded-xl border border-border bg-secondary px-3 py-2 font-mono text-xs outline-none placeholder:text-muted-foreground"
            />
            <datalist id="ai-model-options">
              {active.models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {active.models.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, model: m }))}
                  className={cn(
                    "rounded-lg border px-2 py-1 font-mono text-[10px] transition-colors",
                    draft.model === m
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Any model version this key supports. Leave empty for {active.models[0]}.
            </p>

            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-secondary px-3 py-2">
              <input
                type="checkbox"
                checked={draft.autoFallback}
                onChange={(e) => setDraft((d) => ({ ...d, autoFallback: e.target.checked }))}
                className="mt-0.5 size-3.5 accent-[hsl(var(--primary))]"
              />
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Auto-switch model</span> — kalau model
                utama kehabisan kuota (429) atau tidak tersedia, coba model {active.label} lain
                secara otomatis.
              </span>
            </label>
          </div>

          <div>
            <button
              type="button"
              onClick={runTest}
              disabled={testing || !draft.apiKey.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium transition-colors hover:border-primary disabled:opacity-40"
            >
              {testing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PlugZap className="size-3.5" />
              )}
              {testing ? "Testing connection…" : "Test connection"}
            </button>
            {testResult && (
              <div
                className={cn(
                  "mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] leading-relaxed",
                  testResult.ok
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-destructive/40 bg-destructive/10 text-destructive-foreground",
                )}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="mt-px size-3.5 shrink-0 text-primary" />
                ) : (
                  <XCircle className="mt-px size-3.5 shrink-0" />
                )}
                <span className="break-words">
                  {testResult.ok ? `Key is valid — ${testResult.message}` : testResult.message}
                </span>
              </div>
            )}
          </div>
        </div>


        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <button
            type="button"
            onClick={() => commit(EMPTY_SETTINGS)}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-destructive/50 hover:text-foreground"
          >
            <Trash2 className="size-3.5" /> Clear
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => commit({ ...draft, enabled: false })}
              className="rounded-xl border border-border px-3 py-2 text-xs transition-colors hover:border-primary"
            >
              Without AI
            </button>
            <button
              type="button"
              disabled={!draft.apiKey.trim()}
              onClick={() => commit({ ...draft, enabled: true })}
              className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40"
            >
              Save & enable AI
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
