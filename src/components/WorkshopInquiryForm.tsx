"use client";

import { FormEvent, useState } from "react";

type SubmissionPreview = {
  firstName: string;
  trackInterest: string;
};

export default function WorkshopInquiryForm({
  googleFormUrl,
}: {
  googleFormUrl: string;
}) {
  const [submissionPreview, setSubmissionPreview] =
    useState<SubmissionPreview | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const trackInterest = String(formData.get("trackInterest") ?? "").trim();

    setSubmissionPreview({
      firstName: firstName || "there",
      trackInterest: trackInterest || "your selected track",
    });

    event.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-black uppercase"
            >
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              placeholder="Ada"
              className="w-full border-3 border-foreground bg-surface px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-black uppercase"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              className="w-full border-3 border-foreground bg-surface px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="trackInterest"
            className="mb-2 block text-sm font-black uppercase"
          >
            Track / Experience You&apos;re Interested In
          </label>
          <select
            id="trackInterest"
            name="trackInterest"
            required
            defaultValue=""
            className="w-full border-3 border-foreground bg-surface px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-foreground"
          >
            <option value="" disabled>
              Select a track
            </option>
            <option value="Cursor (No experience to first app)">
              Cursor (No experience to first app)
            </option>
            <option value="Claude Code (Some coding experience)">
              Claude Code (Some coding experience)
            </option>
            <option value="Codex (SWE / advanced workflow)">
              Codex (SWE / advanced workflow)
            </option>
            <option value="Not sure yet (help me choose)">
              Not sure yet (help me choose)
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="reason"
            className="mb-2 block text-sm font-black uppercase"
          >
            Brief Reason for Joining
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            rows={5}
            placeholder="I want to learn how to build and deploy an internal tool for my team."
            className="w-full border-3 border-foreground bg-surface px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-foreground"
          />
        </div>

        <button
          type="submit"
          className="inline-block rounded-full border-3 border-foreground bg-accent px-8 py-4 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1a1a1a] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          Submit Interest (Stub)
        </button>
      </form>

      <p className="text-xs font-bold uppercase text-muted">
        Form submission is stubbed for now. No data is saved yet.
      </p>

      {submissionPreview && (
        <div className="neo-shadow bg-green p-5">
          <p className="text-sm font-bold leading-relaxed">
            Thanks {submissionPreview.firstName}! We noted your interest in{" "}
            {submissionPreview.trackInterest}.
          </p>
          <p className="mt-2 text-sm font-medium">
            Continue to the inquiry form to share final details.
          </p>
        </div>
      )}

      <a
        href={googleFormUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full border-3 border-foreground bg-surface px-8 py-4 text-sm font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1a1a1a] active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        Continue to Inquiry Form
      </a>
    </div>
  );
}
