import type { Metadata } from "next";
import DuneGame from "@/components/dune/DuneGame";

export const metadata: Metadata = {
  title: "Worm Sandbox — Arrakis: The Crossing",
  description: "Isolated proving ground for Shai-Hulud: wormsign approach and sand eruption.",
  robots: { index: false },
};

export default function DuneSandboxPage() {
  return <DuneGame sandbox />;
}
