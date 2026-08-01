import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * mshots serves a low-res "Generating Preview..." placeholder (or an HTML
 * error body) while the screenshot is still being rendered. This component
 * warms every slide in parallel as soon as it mounts and keeps retrying with a
 * cache-buster until the real, full-width capture arrives — so slides 2..N are
 * already decoded by the time the user swipes to them.
 */

const MAX_TRIES = 14;
const RETRY_MS = 1200;

function bust(src: string, attempt: number) {
  if (attempt === 0) return src;
  return `${src}${src.includes("?") ? "&" : "?"}_r=${attempt}`;
}

function expectedWidth(src: string) {
  const m = /[?&]w=(\d+)/.exec(src);
  const w = m ? Number(m[1]) : 0;
  return w > 0 ? w : 1280;
}

export function ShotImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [resolved, setResolved] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResolved(null);
    const wantWidth = expectedWidth(src);

    const attempt = (n: number) => {
      if (cancelled) return;
      const img = new Image();
      img.decoding = "async";
      img.src = bust(src, n);

      const retry = () => {
        if (cancelled || n >= MAX_TRIES) return;
        timer.current = setTimeout(() => attempt(n + 1), RETRY_MS);
      };

      img.onload = () => {
        if (cancelled) return;
        // A real capture matches the requested width; the placeholder is smaller.
        if (img.naturalWidth >= wantWidth * 0.9) {
          setResolved(img.src);
        } else {
          if (n === 0) setResolved(img.src); // show placeholder meanwhile
          retry();
        }
      };
      img.onerror = retry;
    };

    attempt(0);

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [src]);

  return (
    <div className={cn("relative w-full shrink-0 snap-center", className)}>
      <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-secondary">
        {resolved ? (
          <img
            src={resolved}
            alt={alt}
            decoding="async"
            className="size-full object-cover object-top"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
