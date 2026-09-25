"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "../phone.css";
import { SceneRest } from "./context";
import { runScene } from "./engine";
import { channelAttributes, channelsAt, type Scene } from "./types";

export interface ScreenRootProps {
  /** data-screen: the step's ScreenKey for scrolly screens (LandingScroll pairs them), or "hero". */
  name: string;
  /** Play this scene. Without one the screen is a still. */
  scene?: Scene;
  /** Render as the active screen: the first sticky screen, every phone screen, the hero. */
  active?: boolean;
  /** The screen's own class (its folder's CSS hangs off it). */
  className?: string;
  children: ReactNode;
}

/**
 * The root of every phone screen: the `.screen` LandingScroll switches, and
 * the element a scene plays on. The server renders the resting frame (the
 * scene's last beat and its channels); the engine takes over on the client.
 */
export function Screen({ name, scene, active = false, className, children }: ScreenRootProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !scene) return;
    return runScene(el, scene);
  }, [scene]);

  const rest = scene?.rest ?? null;
  const channels = scene ? channelAttributes(channelsAt(scene, scene.beats.length - 1)) : {};
  const classes = ["screen", "ph-screen", className, active ? "is-active" : null].filter(Boolean).join(" ");

  return (
    <SceneRest.Provider value={rest}>
      <div
        ref={ref}
        className={classes}
        data-screen={name}
        data-beat={rest ?? undefined}
        data-scene={scene ? "rest" : undefined}
        {...channels}
      >
        {children}
      </div>
    </SceneRest.Provider>
  );
}
