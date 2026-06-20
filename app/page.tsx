import type { Metadata } from "next";
import { FathomLanding } from "@/components/FathomLanding";

export const metadata: Metadata = {
  title: "Fathom — AI Navigation for Blind & Low-Vision iPhone Users",
  description:
    "Free iPhone app for blind and low-vision users. AI describes what's ahead, guides you through indoor spaces, and helps with tasks. No maps, beacons, or setup.",
};

export default function Home() {
  return <FathomLanding />;
}
