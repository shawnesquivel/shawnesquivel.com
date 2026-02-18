import type { Metadata } from "next";
import DiagramBars from "@/components/hackathon/DiagramBars";
import GuestExplorer from "@/components/hackathon/GuestExplorer";
import SectionCard from "@/components/hackathon/SectionCard";
import { loadHackathonPageData } from "@/lib/hackathon-data";

export const metadata: Metadata = {
  title: "Hackathon Vancouver Guests",
  description:
    "Approved attendees and quick visual breakdowns for attendance and Cursor experience.",
};

export default async function HackathonVancouverPage() {
  const data = await loadHackathonPageData();

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="neo-shadow bg-yellow p-6">
          <p className="inline-block bg-foreground px-3 py-1 text-xs font-black uppercase tracking-wide text-surface">
            Cursor Hackathon Vancouver
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">
            Approved Guests Dashboard
          </h1>
          <p className="mt-3 text-sm font-medium sm:text-base">
            Showing a sanitized dataset with only approved guests (
            <code>approval_status</code> = <code>approved</code>).
          </p>
          <p className="mt-1 text-sm font-bold">
            Total approved: {data.approvedGuests.length}
          </p>
        </header>

        <SectionCard
          title="Feature 1: Approved Guest Ideas"
          subtitle="Interactive explorer with filters, search, wall view, and LinkedIn links."
          className="bg-blue"
        >
          <GuestExplorer guests={data.approvedGuests} />
        </SectionCard>

        <section className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Feature 2: In-person vs Remote"
            subtitle="Simple visual diagram for approved guests."
            className="bg-pink"
          >
            <DiagramBars
              data={data.attendanceBreakdown}
              emptyMessage="No attendance values were found for approved guests."
            />
          </SectionCard>

          <SectionCard
            title="Feature 2: Cursor Experience Level"
            subtitle="Simple visual diagram for approved guests."
            className="bg-green"
          >
            <DiagramBars
              data={data.cursorExperienceBreakdown}
              emptyMessage="No Cursor experience values were found for approved guests."
            />
          </SectionCard>
        </section>
      </div>
    </main>
  );
}
