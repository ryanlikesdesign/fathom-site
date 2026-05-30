import type { Metadata } from "next";
import { FathomLanding } from "@/components/FathomLanding";

export const metadata: Metadata = {
  title: "Fathom — Navigate any building. Your first time in.",
  description:
    "Fathom is an AI companion for blind and low-vision people. It sees what's ahead, guides you where you're going, and helps you do what you came for — using just your iPhone. No maps, no beacons, no setup.",
};

export default function Home() {
  return <FathomLanding />;
}
