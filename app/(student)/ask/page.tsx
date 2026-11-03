import type { Metadata } from "next";
import { AskBox } from "@/components/ask/AskBox";
import { PageHeader, pageMain } from "@/components/ui/surface";

export const metadata: Metadata = { title: "Ask about this project" };

// Signed-in only: the proxy sends visitors without a session to /login.
export default function AskPage() {
  return (
    <main className={`${pageMain} pb-20`}>
      <PageHeader
        label="Ask"
        title="Ask about this project"
        lede="Claude Haiku 5.5 has read every source file and doc in this repo. Ask how something works and it answers with the exact file, in seconds."
      />
      <AskBox />
    </main>
  );
}
