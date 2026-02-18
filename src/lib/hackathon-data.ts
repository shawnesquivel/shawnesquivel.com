import approvedGuestsJson from "@/lib/hackathon-vancouver-approved.json";

export type ApprovedGuest = {
  firstName: string;
  lastName: string;
  buildIdea: string;
  linkedinUrl: string;
  jobOrCompany: string;
  majorOrSchool: string;
  attendanceMode: string;
  cursorExperienceLevel: string;
};

export type DiagramDatum = {
  label: string;
  count: number;
  percentage: number;
};

export type HackathonPageData = {
  approvedGuests: ApprovedGuest[];
  attendanceBreakdown: DiagramDatum[];
  cursorExperienceBreakdown: DiagramDatum[];
};

function buildBreakdown(values: string[]): DiagramDatum[] {
  const nonEmptyValues = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const total = nonEmptyValues.length;
  if (total === 0) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const value of nonEmptyValues) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: Number(((count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
}

export async function loadHackathonPageData(): Promise<HackathonPageData> {
  const approvedGuests = approvedGuestsJson as ApprovedGuest[];

  if (approvedGuests.length === 0) {
    return {
      approvedGuests: [],
      attendanceBreakdown: [],
      cursorExperienceBreakdown: [],
    };
  }

  return {
    approvedGuests,
    attendanceBreakdown: buildBreakdown(
      approvedGuests.map((guest) => guest.attendanceMode),
    ),
    cursorExperienceBreakdown: buildBreakdown(
      approvedGuests.map((guest) => guest.cursorExperienceLevel),
    ),
  };
}
