import Link from "next/link";
import { Press } from "@/components/motion/Press";
import { CheckClaimLink } from "./CheckClaimLink";
import { pillPrimary, pillSecondary, SECTION_SPACE } from "./parts";
import { Reveal } from "./Reveal";

const HEADING_ID = "close-title";

export function ClosingCta() {
  return (
    <Reveal variant="close" labelledBy={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <div className="flex flex-col items-center border-t border-line pt-20 text-center md:pt-28">
        <h2 id={HEADING_ID} data-rise className="type-section max-w-[11ch] text-ink md:max-w-[640px]">
          Prep for what&rsquo;s asked, not what&rsquo;s said.
        </h2>
        <p data-rise className="mt-6 max-w-[46ch] type-body text-ink-muted md:mt-8">
          Check the claim you heard, see the drive&rsquo;s rules, and leave with a week-by-week plan.
        </p>
        <div data-rise className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Press>
            <Link href="/login" className={pillPrimary}>
              Get started
            </Link>
          </Press>
          <Press>
            <CheckClaimLink className={pillSecondary}>Check a claim</CheckClaimLink>
          </Press>
        </div>
      </div>
    </Reveal>
  );
}
