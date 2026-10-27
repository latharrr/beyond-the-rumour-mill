"use client";

import { useGSAP } from "@gsap/react";
import { AnimatePresence, m } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, type Ref, useActionState, useMemo, useRef, useState } from "react";
import { checkClaim, type ClaimCheck } from "@/app/_actions/rumour";
import { ChevronDownIcon } from "@/components/icons";
import type { ActionState } from "@/lib/action-result";
import { cn } from "@/lib/cn";
import type { ClaimExample } from "@/lib/data/claims";
import { type ChipData, VerdictChip } from "./VerdictChip";

type CompanyOption = { id: string; name: string };
type TopicOption = { id: string; label: string; category: string };

const CHAR_SECONDS = 0.045;
const HOLD_SECONDS = 2.8;
// The demo starts typing once the bar has risen into place.
const START_SECONDS = 0.9;

const claimKey = (companyId: string, topicId: string) => `${companyId}:${topicId}`;
const toChip = (r: ClaimCheck): ChipData => ({ verdict: r.verdict, cited: r.cites.length, total: r.total, lowSample: r.lowSample });

/**
 * The hero's claim bar: "[Company] heavily asks [Topic]" with two real selects,
 * submitted to the same `checkClaim` action as /rumour-check. While idle it
 * types real example claims into itself; the first focus or press stops that
 * for good. The verdict chip always describes the claim currently in the bar.
 */
export function ClaimBar({
  companies,
  topics,
  examples,
  sample,
}: {
  companies: CompanyOption[];
  topics: TopicOption[];
  examples: ClaimExample[];
  sample: boolean;
}) {
  const first = examples[0];
  const [companyId, setCompanyId] = useState(first?.companyId ?? companies[0]?.id ?? "");
  const [topicId, setTopicId] = useState(first?.topicId ?? topics[0]?.id ?? "");
  const [typing, setTyping] = useState(false);
  const [chipShown, setChipShown] = useState(true);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [state, action, pending] = useActionState(checkClaim, null as ActionState<ClaimCheck>);

  const rootRef = useRef<HTMLDivElement>(null);
  const companyTyped = useRef<HTMLSpanElement>(null);
  const topicTyped = useRef<HTMLSpanElement>(null);
  const stopDemo = useRef<() => void>(() => {});

  const known = useMemo(() => {
    const map = new Map<string, ChipData>();
    for (const ex of examples) map.set(claimKey(ex.companyId, ex.topicId), ex);
    return map;
  }, [examples]);

  const groupedTopics = useMemo(() => {
    const groups = new Map<string, TopicOption[]>();
    for (const t of topics) groups.set(t.category, [...(groups.get(t.category) ?? []), t]);
    return [...groups];
  }, [topics]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const companyEl = companyTyped.current;
      const topicEl = topicTyped.current;
      if (!root || !companyEl || !topicEl || examples.length < 2) return;
      const q = gsap.utils.selector(root);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const [companyCaret, topicCaret] = [q("[data-caret=company]"), q("[data-caret=topic]")];
        const typeInto = (tl: gsap.core.Timeline, el: HTMLElement, text: string) => {
          const p = { n: 0 };
          tl.to(p, {
            n: text.length,
            duration: text.length * CHAR_SECONDS,
            ease: `steps(${text.length})`,
            onUpdate: () => {
              el.textContent = text.slice(0, Math.round(p.n));
            },
          });
        };

        // With motion on, the bar arrives empty and types its first claim
        // rather than holding a finished one.
        companyEl.textContent = "";
        topicEl.textContent = "";
        setChipShown(false);
        setTyping(true);

        const tl = gsap.timeline({ repeat: -1, delay: START_SECONDS });
        for (const ex of examples) {
          tl.call(() => {
            companyEl.textContent = "";
            topicEl.textContent = "";
            setChipShown(false);
            setTyping(true);
            setCompanyId(ex.companyId);
            setTopicId(ex.topicId);
          });
          tl.set(companyCaret, { opacity: 1 });
          typeInto(tl, companyEl, ex.company);
          tl.set(companyCaret, { opacity: 0 }, "+=0.12");
          tl.set(topicCaret, { opacity: 1 });
          typeInto(tl, topicEl, ex.topic);
          tl.set(topicCaret, { opacity: 0 }, "+=0.3");
          tl.call(() => {
            setTyping(false);
            setChipShown(true);
          });
          tl.to({}, { duration: HOLD_SECONDS });
        }

        // Only run while the bar is on screen.
        const visibility = ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? tl.resume() : tl.pause()),
        });

        stopDemo.current = () => {
          tl.kill();
          visibility.kill();
          gsap.set([companyCaret, topicCaret], { opacity: 0 });
          setTyping(false);
          setChipShown(true);
          stopDemo.current = () => {};
        };

        return () => {
          tl.kill();
          visibility.kill();
        };
      });
    },
    { scope: rootRef },
  );

  const stop = () => stopDemo.current();

  const key = claimKey(companyId, topicId);
  const live = state?.ok && submitted === key ? toChip(state.data) : null;
  const chip = live ?? known.get(key) ?? null;
  const error = state && !state.ok && submitted === key ? state.message : null;
  const companyLabel = companies.find((c) => c.id === companyId)?.name ?? "Company";
  const topicLabel = topics.find((t) => t.id === topicId)?.label ?? "Topic";
  const href = `/rumour-check?company_id=${encodeURIComponent(companyId)}&topic_id=${encodeURIComponent(topicId)}`;

  let status: { key: string; node: ReactNode } | null = null;
  if (pending) status = { key: "pending", node: <p className="type-small text-ink">Counting verified experiences…</p> };
  else if (error) status = { key: `error-${key}`, node: <p role="alert" className="type-small text-ink"><span className="text-rumour">Couldn&rsquo;t check that.</span> {error}</p> };
  else if (chip && chipShown) status = { key, node: <VerdictChip data={chip} href={href} sample={sample} /> };
  else if (!typing && chipShown) status = { key: "hint", node: <p className="type-small text-ink">Check it to count the verified experiences behind it.</p> };

  return (
    <div ref={rootRef} onPointerDownCapture={stop} onFocusCapture={stop} onKeyDownCapture={stop} className="w-full">
      <form
        action={action}
        onSubmit={() => setSubmitted(key)}
        data-surface="paper"
        className="mx-auto flex w-full max-w-[920px] flex-col gap-3 rounded-[var(--radius-bar)] bg-paper p-3 text-paper-ink shadow-bar md:h-[88px] md:flex-row md:items-center md:gap-4 md:py-0 md:pr-[22px] md:pl-4"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5 text-[20px] md:flex-nowrap md:text-[22px]">
          <ClaimSelect
            id="hero-company"
            name="company_id"
            label="Company"
            value={companyId}
            onChange={setCompanyId}
            display={companyLabel}
            typing={typing}
            typedRef={companyTyped}
            caret="company"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </ClaimSelect>
          <span className="px-1 whitespace-nowrap text-paper-ink/65">heavily asks</span>
          <ClaimSelect
            id="hero-topic"
            name="topic_id"
            label="Topic"
            value={topicId}
            onChange={setTopicId}
            display={topicLabel}
            typing={typing}
            typedRef={topicTyped}
            caret="topic"
          >
            {groupedTopics.map(([category, list]) => (
              <optgroup key={category} label={category}>
                {list.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </ClaimSelect>
        </div>
        <m.button
          type="submit"
          disabled={pending}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-amber px-6 text-[15px] font-medium text-paper-ink disabled:cursor-wait"
        >
          {pending ? "Checking…" : "Check claim"}
        </m.button>
      </form>

      <div aria-live="polite" className="mt-4 flex min-h-[72px] items-start justify-center md:min-h-10">
        <AnimatePresence mode="wait" initial={false}>
          {status && (
            <m.div key={status.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>
              {status.node}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {companies.length > 0 && (
        <div role="group" aria-label="Companies" className="mt-5 flex flex-wrap justify-center gap-2">
          {companies.map((c) => {
            const selected = c.id === companyId;
            return (
              <m.button
                key={c.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCompanyId(c.id)}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "hit-44 inline-flex h-11 items-center rounded-full border border-line px-4 type-small text-ink md:h-8",
                  selected ? "bg-panel-2" : "bg-ground/40 hover:bg-panel",
                )}
              >
                {c.name}
              </m.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClaimSelect({
  id,
  name,
  label,
  value,
  onChange,
  display,
  typing,
  typedRef,
  caret,
  children,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  display: string;
  typing: boolean;
  typedRef: Ref<HTMLSpanElement>;
  caret: string;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex h-12 min-w-0 items-center gap-1.5 rounded-xl px-2.5 font-medium hover:bg-paper-ink/[0.05] has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-paper-ink md:h-14">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span className={cn("truncate", typing && "hidden")}>{display}</span>
      <span aria-hidden="true" className={cn("items-center whitespace-nowrap", typing ? "inline-flex" : "hidden")}>
        <span ref={typedRef} />
        <span data-caret={caret} className="ml-px h-[1.05em] w-0.5 bg-paper-ink opacity-0" />
      </span>
      <ChevronDownIcon className="size-5 shrink-0 text-paper-ink/60" />
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer appearance-none rounded-xl border-0 bg-transparent p-0 text-base opacity-0"
      >
        {children}
      </select>
    </span>
  );
}
