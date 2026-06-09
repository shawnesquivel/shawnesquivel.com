import type { Metadata } from "next";
import DuneGame from "@/components/dune/DuneGame";

export const metadata: Metadata = {
  title: "Arrakis: The Crossing — a Dune sandwalking game",
  description:
    "Cross the open desert of Arrakis in your browser. Walk without rhythm, avoid drum sand, plant thumpers — or Shai-Hulud will find you.",
};

export default function DunePage() {
  return <DuneGame />;
}
