import { ChevronDownIcon } from "@/components/icons";

/** Same footprint as the claim bar while companies and topics load. */
export function ClaimBarFallback() {
  return (
    <div role="status" aria-label="Loading the claim check" className="w-full">
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-3 rounded-[var(--radius-bar)] bg-paper p-3 text-paper-ink/65 shadow-bar md:h-[88px] md:flex-row md:items-center md:gap-4 md:py-0 md:pr-[22px] md:pl-4">
        <div className="flex min-h-[98px] min-w-0 flex-1 flex-wrap content-center items-center gap-x-1 gap-y-0.5 text-[20px] font-medium md:min-h-0 md:text-[22px]">
          <span className="inline-flex h-12 items-center gap-1.5 px-2.5 md:h-14">
            Company <ChevronDownIcon className="size-5" />
          </span>
          <span className="px-1 font-normal">heavily asks</span>
          <span className="inline-flex h-12 items-center gap-1.5 px-2.5 md:h-14">
            Topic <ChevronDownIcon className="size-5" />
          </span>
        </div>
        <span className="inline-flex h-11 items-center justify-center rounded-full bg-amber/60 px-6 text-[15px] font-medium text-paper-ink">
          Check claim
        </span>
      </div>
      <div className="mt-4 min-h-[72px] md:min-h-10" />
      <div className="mt-5 h-11 md:h-8" />
    </div>
  );
}
