export interface Release {
  version: string;
  date: string; // ISO yyyy-mm-dd
  added?: string[];
  improved?: string[];
  fixed?: string[];
}

// Newest first. To add a release, prepend a new object.
export const RELEASES: Release[] = [
  {
    version: "0.9.0",
    date: "2026-03-15",
    added: [
      "Lookout, Go, and Task modes",
      "Snapshot spatial descriptions on the Action Button",
      "On-device LiDAR step and drop-off detection",
    ],
    improved: ["Quieter alerts — Fathom speaks only when something matters"],
    fixed: ["Reduced false hazard alerts in cluttered spaces"],
  },
];
