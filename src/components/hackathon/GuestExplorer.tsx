"use client";

import { useMemo, useState } from "react";
import { ApprovedGuest } from "@/lib/hackathon-data";

type GuestExplorerProps = {
  guests: ApprovedGuest[];
};

function normalizeValue(value: string): string {
  return value.trim().length > 0 ? value.trim() : "Unknown";
}

function previewIdea(value: string): string {
  const cleaned = value.trim();
  if (cleaned.length <= 140) {
    return cleaned;
  }
  return `${cleaned.slice(0, 140)}...`;
}

function slugHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function calculateStats(guests: ApprovedGuest[]) {
  const inPersonCount = guests.filter((guest) =>
    guest.attendanceMode.toLowerCase().includes("in-person"),
  ).length;
  const remoteCount = guests.filter((guest) =>
    guest.attendanceMode.toLowerCase().includes("remote"),
  ).length;

  const cursorLevelCounts = new Map<string, number>();
  for (const guest of guests) {
    const level = normalizeValue(guest.cursorExperienceLevel);
    cursorLevelCounts.set(level, (cursorLevelCounts.get(level) ?? 0) + 1);
  }

  const topExperience = [...cursorLevelCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  return {
    inPersonCount,
    remoteCount,
    topExperience: topExperience ?? "N/A",
  };
}

export default function GuestExplorer({ guests }: GuestExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("In-Person @ UBC");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "wall">("list");
  const [shuffleTick, setShuffleTick] = useState(0);
  const [selectedGuest, setSelectedGuest] = useState<ApprovedGuest | null>(null);

  const attendanceOptions = useMemo(
    () =>
      Array.from(
        new Set(guests.map((guest) => normalizeValue(guest.attendanceMode))),
      ).sort(),
    [guests],
  );

  const experienceOptions = useMemo(
    () =>
      Array.from(
        new Set(
          guests.map((guest) => normalizeValue(guest.cursorExperienceLevel)),
        ),
      ).sort(),
    [guests],
  );

  const filteredGuests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = guests.filter((guest) => {
      const attendance = normalizeValue(guest.attendanceMode);
      const experience = normalizeValue(guest.cursorExperienceLevel);
      const guestName = `${guest.firstName} ${guest.lastName}`.trim().toLowerCase();
      const idea = guest.buildIdea.toLowerCase();
      const company = guest.jobOrCompany.toLowerCase();
      const major = guest.majorOrSchool.toLowerCase();

      const matchesSearch =
        query.length === 0 ||
        guestName.includes(query) ||
        idea.includes(query) ||
        company.includes(query) ||
        major.includes(query);
      const matchesAttendance =
        attendanceFilter === "all" || attendance === attendanceFilter;
      const matchesExperience =
        experienceFilter === "all" || experience === experienceFilter;

      return matchesSearch && matchesAttendance && matchesExperience;
    });

    if (shuffleTick === 0) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const aScore = slugHash(
        `${a.firstName}-${a.lastName}-${a.buildIdea}-${shuffleTick}`,
      );
      const bScore = slugHash(
        `${b.firstName}-${b.lastName}-${b.buildIdea}-${shuffleTick}`,
      );
      return aScore - bScore;
    });
  }, [guests, searchQuery, attendanceFilter, experienceFilter, shuffleTick]);

  const stats = useMemo(() => calculateStats(filteredGuests), [filteredGuests]);

  if (guests.length === 0) {
    return (
      <div className="neo-shadow-sm bg-yellow p-4 text-sm font-bold">
        No approved guests found in the CSV.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="neo-shadow-sm bg-yellow p-3">
          <p className="text-xs font-black uppercase">Showing</p>
          <p className="mt-1 text-xl font-black">
            {filteredGuests.length} / {guests.length}
          </p>
        </div>
        <div className="neo-shadow-sm bg-pink p-3">
          <p className="text-xs font-black uppercase">In-Person</p>
          <p className="mt-1 text-xl font-black">{stats.inPersonCount}</p>
        </div>
        <div className="neo-shadow-sm bg-blue p-3">
          <p className="text-xs font-black uppercase">Remote</p>
          <p className="mt-1 text-xl font-black">{stats.remoteCount}</p>
        </div>
        <div className="neo-shadow-sm bg-green p-3">
          <p className="text-xs font-black uppercase">Top Cursor Level</p>
          <p className="mt-1 text-sm font-black uppercase">{stats.topExperience}</p>
        </div>
      </div>

      <div className="neo-shadow-sm bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase">Search</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Name or build idea"
              className="border-2 border-foreground bg-surface px-3 py-2 text-sm font-medium outline-none focus:bg-yellow"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase">Attendance</span>
            <select
              value={attendanceFilter}
              onChange={(event) => setAttendanceFilter(event.target.value)}
              className="border-2 border-foreground bg-surface px-3 py-2 text-sm font-medium outline-none focus:bg-yellow"
            >
              <option value="all">All</option>
              {attendanceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase">Cursor Level</span>
            <select
              value={experienceFilter}
              onChange={(event) => setExperienceFilter(event.target.value)}
              className="border-2 border-foreground bg-surface px-3 py-2 text-sm font-medium outline-none focus:bg-yellow"
            >
              <option value="all">All</option>
              {experienceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`neo-btn px-3 py-2 text-xs ${
                viewMode === "list" ? "bg-accent text-white" : "bg-surface"
              }`}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("wall")}
              className={`neo-btn px-3 py-2 text-xs ${
                viewMode === "wall" ? "bg-accent text-white" : "bg-surface"
              }`}
            >
              Wall View
            </button>
            <button
              type="button"
              onClick={() => setShuffleTick(Date.now())}
              className="neo-btn bg-purple px-3 py-2 text-xs"
            >
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredGuests.map((guest) => (
            <button
              key={`${guest.firstName}-${guest.lastName}-${guest.buildIdea}`}
              type="button"
              onClick={() => setSelectedGuest(guest)}
              className="neo-shadow-sm bg-white p-4 text-left neo-hover"
            >
              <p className="text-base font-black uppercase">
                {guest.firstName} {guest.lastName}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="border-2 border-foreground bg-yellow px-2 py-0.5 text-[10px] font-black uppercase">
                  {normalizeValue(guest.attendanceMode)}
                </span>
                <span className="border-2 border-foreground bg-blue px-2 py-0.5 text-[10px] font-black uppercase">
                  {normalizeValue(guest.cursorExperienceLevel)}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium leading-relaxed">
                {previewIdea(guest.buildIdea)}
              </p>
              {guest.jobOrCompany ? (
                <p className="mt-2 text-xs font-bold uppercase text-muted">
                  Work: {guest.jobOrCompany}
                </p>
              ) : null}
              {guest.majorOrSchool ? (
                <p className="mt-1 text-xs font-bold uppercase text-muted">
                  School: {guest.majorOrSchool}
                </p>
              ) : null}
              {guest.linkedinUrl ? (
                <a
                  href={guest.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="mt-4 inline-block border-2 border-foreground bg-green px-2 py-1 text-xs font-black uppercase hover:bg-accent hover:text-white"
                >
                  View LinkedIn
                </a>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filteredGuests.map((guest, index) => {
            const rotation = ((index % 5) - 2) * 0.6;
            return (
              <button
                key={`${guest.firstName}-${guest.lastName}-${guest.buildIdea}`}
                type="button"
                onClick={() => setSelectedGuest(guest)}
                className="neo-shadow-sm mb-4 w-full break-inside-avoid bg-white p-4 text-left neo-hover"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <p className="text-base font-black uppercase">
                  {guest.firstName} {guest.lastName}
                </p>
                <p className="mt-3 text-sm font-medium leading-relaxed">
                  {previewIdea(guest.buildIdea)}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {filteredGuests.length === 0 ? (
        <div className="neo-shadow-sm bg-orange p-4 text-sm font-bold">
          No guests match this filter set.
        </div>
      ) : null}

      {selectedGuest ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="neo-shadow w-full max-w-2xl bg-surface p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-2xl font-black uppercase">
                {selectedGuest.firstName} {selectedGuest.lastName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="neo-btn bg-surface px-3 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="border-2 border-foreground bg-yellow px-2 py-0.5 text-[10px] font-black uppercase">
                {normalizeValue(selectedGuest.attendanceMode)}
              </span>
              <span className="border-2 border-foreground bg-blue px-2 py-0.5 text-[10px] font-black uppercase">
                {normalizeValue(selectedGuest.cursorExperienceLevel)}
              </span>
            </div>

            <p className="mt-4 text-sm font-medium leading-relaxed">
              {selectedGuest.buildIdea}
            </p>
            {selectedGuest.jobOrCompany ? (
              <p className="mt-4 text-xs font-bold uppercase text-muted">
                Work: {selectedGuest.jobOrCompany}
              </p>
            ) : null}
            {selectedGuest.majorOrSchool ? (
              <p className="mt-1 text-xs font-bold uppercase text-muted">
                School: {selectedGuest.majorOrSchool}
              </p>
            ) : null}

            {selectedGuest.linkedinUrl ? (
              <a
                href={selectedGuest.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn mt-6 inline-block bg-green px-4 py-2 text-xs"
              >
                Open LinkedIn
              </a>
            ) : (
              <p className="mt-6 text-xs font-bold uppercase text-muted">
                No LinkedIn profile submitted
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
