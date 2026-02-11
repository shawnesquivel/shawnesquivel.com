"use client";

import { useState } from "react";

export default function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="neo-shadow-sm mx-1.5 inline-block bg-accent px-3 py-1 text-white font-black cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    >
      {copied ? "COPIED!" : code}
    </button>
  );
}
