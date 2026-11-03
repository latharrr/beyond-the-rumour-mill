import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isUuid } from "@/lib/placement/data";
import { getMyPlan } from "@/lib/preparation/data";
import { exportFilename, planToMarkdown } from "@/lib/preparation/export";

// Ownership check (RLS + explicit user_id filter in getMyPlan), then the
// plan as a Markdown download. Mutations stay in Server Actions.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/plans/[id]/export">) {
  const user = await getSessionUser();
  if (!user) return new Response("Please sign in first.", { status: 401 });

  const { id } = await ctx.params;
  // Missing and not-yours are indistinguishable on purpose.
  const plan = isUuid(id) ? await getMyPlan(user.id, id) : null;
  if (!plan) return new Response("Plan not found.", { status: 404 });

  return new Response(planToMarkdown(plan, request.nextUrl.origin), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(plan.drive.title)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
