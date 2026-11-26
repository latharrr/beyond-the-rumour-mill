"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export type SearchCompany = { name: string; href: string; hint: string };

/**
 * The hero's company search: one paper form field with the oxblood button
 * attached. Typing filters the companies in a listbox (ARIA combobox: arrows
 * move, Enter picks, Escape closes). "Get my plan" opens the best match:
 * its prep brief if it has a drive, else its company guide.
 */
export function CompanySearch({ companies }: { companies: SearchCompany[] }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const query = q.trim().toLowerCase();
  const matches = query ? companies.filter((c) => c.name.toLowerCase().includes(query)) : companies;
  const go = (c: SearchCompany | undefined) => {
    setOpen(false);
    router.push(c ? c.href : "#companies");
  };

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        go(query ? (matches[active] ?? matches[0]) : undefined);
      }}
    >
      <label htmlFor={`${id}-q`} className="sr-only">
        Search a company
      </label>
      <div className="flex h-14 items-stretch rounded-full border border-ink/25 bg-surface shadow-[var(--shadow-card)] focus-within:border-ink">
        <input
          id={`${id}-q`}
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${id}-${active}` : undefined}
          autoComplete="off"
          value={q}
          placeholder="Search a company: TCS, Infosys, Amazon…"
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              const step = e.key === "ArrowDown" ? 1 : -1;
              setActive((a) => (matches.length ? (a + step + matches.length) % matches.length : 0));
            } else if (e.key === "Escape") setOpen(false);
          }}
          className="min-w-0 flex-1 rounded-l-full border-0! bg-transparent! py-0! pr-2 pl-6 text-[16px] text-ink outline-none placeholder:text-ink-2"
        />
        <button type="submit" className="group/pill m-1 inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-medium text-on-accent transition-colors duration-150 hover:bg-accent-hover">
          Get my plan
          <ArrowRightIcon className="size-4 transition-transform duration-200 ease-[var(--ease-out-3)] group-hover/pill:translate-x-1" />
        </button>
      </div>
      {open && matches.length > 0 && (
        <ul id={`${id}-list`} role="listbox" aria-label="Companies" className="absolute inset-x-0 top-[calc(100%+6px)] z-20 max-h-[264px] overflow-auto rounded-[4px] border border-line bg-surface py-1 shadow-[var(--shadow-object)]">
          {matches.map((c, i) => (
            <li
              key={c.name}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: it fires before the input's blur closes the list.
              onMouseDown={(e) => {
                e.preventDefault();
                go(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-4 px-5", i === active && "bg-bg-alt")}
            >
              <span className="font-serif text-[19px] text-ink">{c.name}</span>
              <span className="type-label text-ink-2">{c.hint}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
