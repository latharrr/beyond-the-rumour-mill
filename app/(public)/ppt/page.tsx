import type { Metadata } from "next";
import { pageMain } from "@/components/ui/surface";
import { SlideViewer } from "./viewer";

export const metadata: Metadata = {
  title: "Viva deck",
  description: "Slides for the Beyond the Rumour Mill viva, with an editable PowerPoint download.",
  alternates: { canonical: "/ppt" },
};

export default function PptPage() {
  return (
    <main className={`${pageMain} pb-12`}>
      <header className="pb-8">
        <p className="type-label text-ink-dim">Viva deck</p>
        <h1 className="mt-4 type-section text-ink">Beyond the Rumour Mill</h1>
        <p className="mt-4 max-w-[56ch] type-body text-ink-muted">
          Use the buttons or the left and right arrow keys. The editable PowerPoint is the download button.
        </p>
      </header>
      <SlideViewer />
      <p className="mt-4 type-body text-ink-muted">
        <a className="underline" href="/viva/beyond-the-rumour-mill-viva.pdf">
          Open as PDF
        </a>
      </p>
    </main>
  );
}
