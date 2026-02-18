import { ApprovedGuest } from "@/lib/hackathon-data";

type ApprovedGuestsListProps = {
  guests: ApprovedGuest[];
};

export default function ApprovedGuestsList({ guests }: ApprovedGuestsListProps) {
  if (guests.length === 0) {
    return (
      <div className="neo-shadow-sm bg-yellow p-4 text-sm font-bold">
        No approved guests found in the CSV.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {guests.map((guest, index) => (
        <article key={`${guest.firstName}-${guest.lastName}-${index}`} className="neo-shadow-sm bg-white p-4">
          <p className="text-base font-black uppercase">
            {guest.firstName} {guest.lastName}
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed">{guest.buildIdea}</p>
        </article>
      ))}
    </div>
  );
}
