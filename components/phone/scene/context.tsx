"use client";

import { createContext, useContext } from "react";
import { beatIn } from "./types";

/**
 * The resting beat of the scene a component renders in, or null outside a
 * scene. Screen provides it; Layer, Words and TouchIndicator read it so the
 * server renders each one exactly as the resting frame needs it.
 */
export const SceneRest = createContext<string | null>(null);

/**
 * Whether something that shows during `show` is on in the server-rendered
 * (resting) frame. Outside a scene, or with no beat list, it is simply on.
 */
export function useOnAtRest(show: string | undefined): boolean {
  const rest = useContext(SceneRest);
  if (show === undefined || rest === null) return true;
  return beatIn(show, rest);
}

/** Like useOnAtRest, but off outside a scene: for things that only exist inside one (a tap). */
export function useOnInSceneAtRest(show: string): boolean {
  const rest = useContext(SceneRest);
  return rest !== null && beatIn(show, rest);
}
