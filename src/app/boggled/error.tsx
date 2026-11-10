"use client";

import { useEffect } from "react";
import { track } from "@/lib/boggled/analytics";

export default function GameError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    track("crash", { message: error.message.slice(0, 160), digest: error.digest });
  }, [error]);
  return (
    <div className="bg-screen items-center justify-center gap-4 text-center" data-testid="crash">
      <div className="text-6xl">🙈</div>
      <div className="bg-title text-3xl">Oops, that broke</div>
      <p className="max-w-xs text-sm opacity-80">Something went wrong on our side. Your progress is saved on this phone.</p>
      <button
        className="bg-btn bg-btn-primary w-full max-w-xs text-xl"
        onClick={() => {
          history.replaceState(null, "", location.pathname);
          reset();
          location.reload();
        }}
      >
        Reload
      </button>
    </div>
  );
}
