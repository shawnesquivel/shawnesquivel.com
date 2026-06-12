import type { Metadata } from "next";
import { Press_Start_2P, Instrument_Serif } from "next/font/google";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const cursive = Instrument_Serif({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-cursive",
});

export const metadata: Metadata = {
  title: "Boomer Evals | Shawn Esquivel",
  description:
    "Do you need to fix typos in your prompts? We measured it across 2,592 graded responses. Frontier models lost nothing to typos — but some paid for them in compute.",
  openGraph: {
    title: "Boomer Evals",
    description:
      "only boomers fix typos in prompts — true or false? An eval across 8 models and 6 levels of keyboard smash.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boomer Evals",
    description:
      "only boomers fix typos in prompts — true or false? An eval across 8 models and 6 levels of keyboard smash.",
  },
};

export default function BoomerEvalsLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${pixel.variable} ${cursive.variable}`}>{children}</div>;
}
