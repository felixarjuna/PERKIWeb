import type { ReactNode } from "react";
import type { LanguageCode } from "~/lib/library";
import { cn } from "~/lib/utils";

/**
 * The three flags drawn as SVG, 3:2, so they look the same on every device:
 * Windows has no flag emoji and shows the letters "DE" instead (#145).
 */
const FLAGS: Record<LanguageCode, ReactNode> = {
  de: (
    <>
      <rect fill="#000" height="40" width="60" />
      <rect fill="#d00" height="27" width="60" y="13" />
      <rect fill="#ffce00" height="14" width="60" y="26" />
    </>
  ),
  en: (
    <>
      <rect fill="#012169" height="40" width="60" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="3" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="13" />
      <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7" />
    </>
  ),
  id: (
    <>
      <rect fill="#fff" height="40" width="60" />
      <rect fill="#ce1126" height="20" width="60" />
    </>
  ),
};

/**
 * A language's flag. Decorative: the language's name always stands beside
 * it, so screen readers skip the picture.
 */
export function Flag({
  code,
  className,
}: {
  code: LanguageCode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "inline-block h-3 w-[18px] shrink-0 rounded-[3px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]",
        className
      )}
      focusable="false"
      viewBox="0 0 60 40"
    >
      {FLAGS[code]}
    </svg>
  );
}
