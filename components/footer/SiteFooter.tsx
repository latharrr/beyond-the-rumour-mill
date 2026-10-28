import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { Reveal } from "@/components/landing/Reveal";
import { getSessionUser } from "@/lib/auth";
import { SEED_DRIVES_ARE_SAMPLE, SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";

const GITHUB = "https://github.com/latharrr/beyond-the-rumour-mill";

const LINK =
  "inline-flex min-h-11 min-w-11 items-center text-[15px] text-ink-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline";

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className={LINK}>
        {children}
      </Link>
    </li>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noreferrer" className={LINK}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </li>
  );
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  const id = `footer-${title.toLowerCase()}`;
  return (
    <div>
      <h2 id={id} className="type-label text-ink-dim">
        {title}
      </h2>
      <ul aria-labelledby={id} className="mt-2">
        {children}
      </ul>
    </div>
  );
}

// Reads the session, so it renders inside <Suspense>.
async function AccountLinks() {
  const user = await getSessionUser();
  if (user) {
    return (
      <>
        <FooterLink href="/dashboard">Dashboard</FooterLink>
        <FooterLink href="/onboarding">Profile</FooterLink>
      </>
    );
  }
  return (
    <>
      <FooterLink href="/login">Sign in</FooterLink>
      <FooterLink href="/login">Get started</FooterLink>
    </>
  );
}

/** Same two rows the links take, so nothing shifts when the session resolves. */
function AccountLinksFallback() {
  return (
    <>
      <li aria-hidden="true" className="h-11" />
      <li aria-hidden="true" className="h-11" />
    </>
  );
}

function sampleNote() {
  if (SEED_DRIVES_ARE_SAMPLE && SEED_EXPERIENCES_ARE_SAMPLE) return "The drives and senior experiences shown are synthetic sample data for now.";
  if (SEED_DRIVES_ARE_SAMPLE) return "The drives shown are synthetic sample data for now.";
  if (SEED_EXPERIENCES_ARE_SAMPLE) return "The senior experiences shown are synthetic sample data for now.";
  return null;
}

/**
 * The site footer on every public page: link columns, then the brand closing
 * the scroll as a full-width amber wordmark, then the legal line.
 */
export function SiteFooter() {
  const note = sampleNote();
  return (
    <footer className="mt-20 border-t border-line md:mt-32">
      <div className="container-page pt-12 md:pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
          <div className="flex flex-col gap-6">
            <p className="max-w-[34ch] type-body text-pretty text-ink-muted">
              Placement prep from official drives and verified senior experiences. Rumours stay labelled as rumours.
            </p>
            <dl className="grid max-w-[34ch] grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 type-small">
              <dt className="type-label text-ink-dim">Verdicts</dt>
              <dd className="text-ink-muted">Supported, Mixed evidence or Not supported, each citing its experiences.</dd>
              <dt className="type-label text-ink-dim">Rumours</dt>
              <dd className="text-ink-muted">Shown, labelled, and left out of every count.</dd>
            </dl>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            <Column title="Prepare">
              <FooterLink href="/drives">Drives</FooterLink>
              <FooterLink href="/experiences">Experiences</FooterLink>
              <FooterLink href="/rumour-check">Rumour check</FooterLink>
            </Column>
            <Column title="Contribute">
              <FooterLink href="/experiences/new">Share your experience</FooterLink>
            </Column>
            <Column title="Account">
              <Suspense fallback={<AccountLinksFallback />}>
                <AccountLinks />
              </Suspense>
            </Column>
            <Column title="Project">
              <FooterLink href="/privacy">Privacy</FooterLink>
              <ExternalLink href={GITHUB}>Source on GitHub</ExternalLink>
              <ExternalLink href={`${GITHUB}/issues`}>Report an issue</ExternalLink>
            </Column>
          </nav>
        </div>

        {/* The wordmark is a decorative setting of the name; assistive tech reads the plain text. */}
        <Reveal as="div" variant="wordmark" className="@container mt-16 md:mt-24">
          <p className="text-amber">
            <span className="sr-only">Beyond the Rumour Mill</span>
            <span aria-hidden="true" className="block overflow-hidden pb-[0.04em] type-wordmark [--wm-measure:4.376]">
              <span data-line className="block">
                Beyond the
              </span>
            </span>
            <span aria-hidden="true" className="block overflow-hidden pb-[0.04em] type-wordmark [--wm-measure:4.955]">
              <span data-line className="block">
                Rumour Mill
              </span>
            </span>
          </p>
        </Reveal>

        <div className="mt-8 flex flex-col gap-2 border-t border-line py-6 type-small text-ink-dim md:mt-10 md:flex-row md:justify-between md:gap-10">
          <p className="shrink-0 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/deepanshu-labs.svg" alt="" width={24} height={24} />
            <a href="https://deepanshulathar.com/labs" className="hover:text-ink">Deepanshu Labs</a> · 2026
          </p>
          <p className="max-w-[72ch] md:text-right">
            A student course project. Not affiliated with or endorsed by the LPU placement cell.{note && ` ${note}`}
          </p>
        </div>
      </div>
    </footer>
  );
}
