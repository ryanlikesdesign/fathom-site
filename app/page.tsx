import type { Metadata } from "next";
import { FathomLanding } from "@/components/FathomLanding";

export const metadata: Metadata = {
  // absolute: the layout template would otherwise append "| Fathom" twice over.
  title: { absolute: "Fathom: AI companion for blind and low-vision iPhone users" },
  description:
    "Free iPhone app for blind and low-vision users. AI describes what's ahead, guides you through indoor spaces, and helps with tasks. No maps, beacons, or setup.",
};

export default function Home() {
  return <FathomLanding />;
}
