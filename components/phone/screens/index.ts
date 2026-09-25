import type { ComponentType } from "react";
import type { ScreenKey } from "@/lib/copy-13";
import type { Scene } from "../scene";
import type { ScreenProps } from "./types";
import { ConversationJustAsk, ConversationSkills, JUST_ASK, SKILLS_OFFER } from "./Conversation/ConversationScreen";
import { LOOK_NOW_SHEET, LookNowScreen } from "./LookNow/LookNowScreen";
import { READ_ALONG, ReadoutScreen } from "./Readout/ReadoutScreen";
import { ActivityLookoutScreen, LOOKOUT_WALK } from "./ActivityLookout/ActivityLookoutScreen";
import { MemoryReviewScreen, REMEMBER_KEYS } from "./MemoryReview/MemoryReviewScreen";
import { ActivityGoScreen, GO_ARRIVAL } from "./ActivityGo/ActivityGoScreen";
import { PLAN_REVIEW, PlanReviewScreen } from "./PlanReview/PlanReviewScreen";
import { ActivityLiveScreen, LIVE_TALK } from "./ActivityLive/ActivityLiveScreen";
import { CONSENT_ASK, CloudConsentScreen } from "./CloudConsent/CloudConsentScreen";

/**
 * Every step's screen, by the ScreenKey its step names (lib/copy-13.ts).
 * The homepage renders SCREENS[step.screen] twice: in the sticky phone and
 * in the step's own phone on narrow widths. A screen's folder exports the
 * component named here; a build replaces the folder and keeps the name.
 */
export const SCREENS: Readonly<Record<ScreenKey, ComponentType<ScreenProps>>> = {
  conversation: ConversationJustAsk,
  "look-now": LookNowScreen,
  readout: ReadoutScreen,
  "activity-lookout": ActivityLookoutScreen,
  "memory-review": MemoryReviewScreen,
  "activity-go": ActivityGoScreen,
  "plan-review": PlanReviewScreen,
  "activity-live": ActivityLiveScreen,
  "conversation-skills": ConversationSkills,
  "cloud-consent": CloudConsentScreen,
};

/**
 * The scene each step's screen plays, by the same key. The page never
 * reads this (a screen plays its own); the tests do, to hold every step to
 * the same rules: a resting frame, taps of one length, a short story.
 */
export const SCENES: Readonly<Record<ScreenKey, Scene>> = {
  conversation: JUST_ASK,
  "look-now": LOOK_NOW_SHEET,
  readout: READ_ALONG,
  "activity-lookout": LOOKOUT_WALK,
  "memory-review": REMEMBER_KEYS,
  "activity-go": GO_ARRIVAL,
  "plan-review": PLAN_REVIEW,
  "activity-live": LIVE_TALK,
  "conversation-skills": SKILLS_OFFER,
  "cloud-consent": CONSENT_ASK,
};

export { ConversationHero } from "./Conversation/ConversationScreen";
export type { ScreenProps } from "./types";
