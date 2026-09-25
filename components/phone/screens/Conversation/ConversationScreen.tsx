import "./Conversation.css";
import { EXAMPLES, STAGE, STARTERS } from "@/lib/app-facts";
import {
  AppHeader,
  Composer,
  defineScene,
  Layer,
  Orb,
  Screen,
  Stack,
  Stage,
  StageHeadline,
  StatusBar,
  StopControl,
  SuggestionRow,
  Suggestions,
  TAP_MS,
  Transcript,
  TranscriptTurn,
} from "@/components/phone";
import type { ScreenProps } from "../types";

/* ================================================================
   The conversation screen (ConversationScreen.swift): the header, the
   stage (orb and headline) or the transcript, and the composer. Three
   uses: the hero (a still, the orb breathing), step 1 "Just ask" and
   step 9 "Skills". Every string is an app fact or an EXAMPLES string.
   ================================================================ */

/**
 * Step 1, "Just ask": ask by voice and hear the answer.
 *   idle        Ready, "Ask by voice, type, or tap More to look now.", three starters
 *   tap-mic     a finger taps the mic
 *   listening   Listening, "Tap again to send"; the mic turns to send and its glow
 *               pulses; the starters fold away and the stage re-centers
 *   tap-send    a finger taps again to send
 *   thinking    Thinking; the orb holds its rings and spins its dot
 *   speaking    Speaking, "Tap anywhere to stop", the stop control
 *   tap-transcript  a finger opens the transcript
 *   answer      (rests) the transcript on the composer: the question, then
 *               fathom's answer, arriving whole as the app appends a turn
 */
export const JUST_ASK = defineScene([
  { id: "idle", ms: 1600, set: { mic: "idle", orb: "idle", glow: "none", transcript: "closed" } },
  { id: "tap-mic", ms: TAP_MS },
  { id: "listening", ms: 2400, set: { mic: "listening", orb: "listening", glow: "listening" } },
  { id: "tap-send", ms: TAP_MS },
  { id: "thinking", ms: 1400, set: { mic: "idle", orb: "working", glow: "none" } },
  { id: "speaking", ms: 1900, set: { orb: "speaking", glow: "speaking" } },
  { id: "tap-transcript", ms: TAP_MS },
  { id: "answer", ms: 0, set: { glow: "none", transcript: "open" } },
]);

/**
 * Step 9, "Skills": fathom mentions a routine, and nothing is kept until you
 * ask. The offer is spoken, never written (AssistantOrchestrator.swift:1262,
 * AudioService.speak), so the phone shows fathom speaking and the step
 * quotes the words. Saying "save this as a skill" is the only yes
 * (ConversationController.swift:815); the answer is written to the
 * transcript, and the next suggestions lead with the new skill.
 *   offer           Speaking, "Tap anywhere to stop"; the starters from the last answer
 *   ready           the line ends: Ready
 *   tap-mic         a finger taps the mic
 *   listening       Listening, "Tap again to send"; the starters fold away
 *   tap-send        a finger taps again to send
 *   reply           Speaking again; the strip comes back with "Run the laundry"
 *                   sliding in on top, its Plus badge, and the others move down
 *   tap-transcript  a finger opens the transcript
 *   saved           (rests) the transcript: "Save this as a skill.", then
 *                   "Saved the laundry, 4 steps. Say run the laundry any time.";
 *                   "Run the laundry" first in the suggestions
 */
export const SKILLS_OFFER = defineScene([
  { id: "offer", ms: 2600, set: { mic: "idle", orb: "speaking", glow: "speaking", transcript: "closed", strip: "starters" } },
  { id: "ready", ms: 800, set: { orb: "idle", glow: "none" } },
  { id: "tap-mic", ms: TAP_MS },
  { id: "listening", ms: 1600, set: { mic: "listening", orb: "listening", glow: "listening" } },
  { id: "tap-send", ms: TAP_MS },
  { id: "reply", ms: 1700, set: { mic: "idle", orb: "speaking", glow: "speaking", strip: "skills" } },
  { id: "tap-transcript", ms: TAP_MS },
  { id: "saved", ms: 0, set: { glow: "none", transcript: "open" } },
]);

const STAGE_BEATS = "idle tap-mic listening tap-send thinking speaking tap-transcript";

/** The hero's phone: the idle stage, the orb breathing. No scene. */
export function ConversationHero() {
  return (
    <Screen name="hero" active className="cv cv-hero">
      <StatusBar />
      <AppHeader />
      <div className="ph-body">
        <Stage>
          <Orb />
          <StageHeadline eyebrow={STAGE.idle.eyebrow.value} headline={STAGE.idle.headline.value} />
        </Stage>
      </div>
      <Composer />
    </Screen>
  );
}

/** Step 1. */
export function ConversationJustAsk({ active }: ScreenProps) {
  return (
    <Screen name="conversation" scene={JUST_ASK} active={active} className="cv cv-just-ask">
      <StatusBar />
      <AppHeader transcriptTouch="tap-transcript" />
      <div className="ph-body">
        <Stack>
          <Layer show={STAGE_BEATS}>
            <Stage>
              <Orb />
              <Stack className="cv-lines">
                <Layer show="idle tap-mic">
                  <StageHeadline eyebrow={STAGE.idle.eyebrow.value} headline={STAGE.idle.headline.value} />
                </Layer>
                <Layer show="listening tap-send">
                  <StageHeadline eyebrow={STAGE.listening.eyebrow.value} headline={STAGE.listening.headline.value} />
                </Layer>
                <Layer show="thinking">
                  <StageHeadline headline={STAGE.thinking.headline.value} />
                </Layer>
                <Layer show="speaking tap-transcript">
                  <StageHeadline headline={STAGE.speaking.headline.value} subline={STAGE.speaking.subline.value} />
                </Layer>
              </Stack>
              <StopControl show="speaking tap-transcript" />
            </Stage>
          </Layer>
          <Layer show="answer">
            <Transcript>
              <TranscriptTurn who="user" time={EXAMPLES.time} text={EXAMPLES.justAsk.request} />
              <TranscriptTurn who="fathom" time={EXAMPLES.time} text={EXAMPLES.justAsk.answer} />
            </Transcript>
          </Layer>
        </Stack>
      </div>
      <Composer
        micTouch="tap-mic tap-send"
        suggestions={
          <Suggestions show="idle tap-mic">
            {STARTERS.firstRun.map((starter) => (
              <SuggestionRow key={starter.value} label={starter.value} />
            ))}
          </Suggestions>
        }
      />
    </Screen>
  );
}

/** The starters on screen while fathom makes its offer: two free, one fathom plus (STARTERS.pool). */
const SKILL_STARTERS = [
  { label: STARTERS.pool[0].value, plus: false },
  { label: STARTERS.pool[3].value, plus: false },
  { label: STARTERS.pool[5].value, plus: true },
] as const;

/** The strip is up before you speak and after fathom answers; a new turn clears it. */
const STRIP_BEATS = "offer ready tap-mic reply tap-transcript saved";
const SKILL_STAGE = "offer ready tap-mic listening tap-send reply tap-transcript";
const SPEAKING = "offer reply tap-transcript";

/** Step 9. */
export function ConversationSkills({ active }: ScreenProps) {
  return (
    <Screen name="conversation-skills" scene={SKILLS_OFFER} active={active} className="cv cv-skills">
      <StatusBar />
      <AppHeader transcriptTouch="tap-transcript" />
      <div className="ph-body">
        <Stack>
          <Layer show={SKILL_STAGE}>
            <Stage>
              <Orb />
              <Stack className="cv-lines">
                <Layer show={SPEAKING}>
                  <StageHeadline headline={STAGE.speaking.headline.value} subline={STAGE.speaking.subline.value} />
                </Layer>
                <Layer show="ready tap-mic">
                  <StageHeadline eyebrow={STAGE.idle.eyebrow.value} headline={STAGE.idle.headline.value} />
                </Layer>
                <Layer show="listening tap-send">
                  <StageHeadline eyebrow={STAGE.listening.eyebrow.value} headline={STAGE.listening.headline.value} />
                </Layer>
              </Stack>
              <StopControl show={SPEAKING} />
            </Stage>
          </Layer>
          <Layer show="saved">
            <Transcript>
              <TranscriptTurn who="user" time={EXAMPLES.time} text={EXAMPLES.laundry.skill.save} />
              <TranscriptTurn who="fathom" time={EXAMPLES.time} text={EXAMPLES.laundry.skill.saved} />
            </Transcript>
          </Layer>
        </Stack>
      </div>
      <Composer
        micTouch="tap-mic tap-send"
        suggestions={
          <Suggestions show={STRIP_BEATS} className="cv-skill-strip">
            <SuggestionRow label={EXAMPLES.laundry.skill.row} plus show="reply tap-transcript saved" className="cv-skill-new" />
            <SuggestionRow label={SKILL_STARTERS[0].label} className="cv-skill-row" />
            <SuggestionRow label={SKILL_STARTERS[1].label} className="cv-skill-row" />
            <SuggestionRow
              label={SKILL_STARTERS[2].label}
              plus={SKILL_STARTERS[2].plus}
              show="offer ready tap-mic listening tap-send"
              className="cv-skill-row cv-skill-out"
            />
          </Suggestions>
        }
      />
    </Screen>
  );
}
