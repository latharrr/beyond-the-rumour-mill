import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const label = "block type-small font-medium text-ink";
export const hint = "mt-1 type-small text-ink-dim";
const control =
  "w-full min-w-0 rounded-[10px] border border-line bg-panel px-3.5 text-[15px] text-ink placeholder:text-ink-dim transition-colors duration-200 hover:border-white/16 aria-[invalid=true]:border-rumour/70 disabled:opacity-60";
export const input = cn(control, "h-11");
export const select = cn(control, "h-11 pr-9 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23A3A0A8%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[position:right_14px_center] bg-no-repeat");
export const textarea = cn(control, "min-h-32 py-3 leading-relaxed");
export const checkbox = "size-[18px] shrink-0 accent-amber";

/** Field-level validation message; red glyph + text, never colour alone. */
export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-2 type-small text-ink">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-rumour" />
      {children}
    </p>
  );
}

/** Form-level result line (role=alert on failure, role=status on success). */
export function FormMessage({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p role={ok ? "status" : "alert"} className="flex items-center gap-2 type-small text-ink">
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", ok ? "bg-verified" : "bg-rumour")} />
      {children}
    </p>
  );
}
