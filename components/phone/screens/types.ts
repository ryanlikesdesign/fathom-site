/** What every registered screen takes. */
export interface ScreenProps {
  /**
   * Render as the active screen. The sticky phone renders its first screen
   * active and LandingScroll moves .is-active from there; each phone on a
   * narrow page renders its one screen active.
   */
  active?: boolean;
}
