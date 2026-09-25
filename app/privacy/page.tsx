import Link from "next/link";
import { LEGAL_PROSE, Section } from "@/components/Section";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta(
  "Privacy",
  "What fathom sends to Google's Gemini AI and when, what stays on your phone, and the usage data and screen recordings it collects. No account, no tracking across other apps, and we never sell your data.",
  "/privacy",
);

// Evidence for every claim on this page is kept in the private app repo,
// docs/privacy/SITE-PRIVACY-SOURCES.md. Update it when a claim here changes.
export default function PrivacyPage() {
  return (
    <Section labelledBy="pp-h" className={LEGAL_PROSE}>
      <p className="eyebrow">Legal</p>
      <h1 id="pp-h" className="font-display text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: September 24, 2026</p>

      <p>
        fathom is made by Unruly Vision, LLC. This policy explains what fathom collects, where it
        goes, and what happens to it. We&apos;ve written it plainly, because you deserve to
        understand it.
      </p>
      <p>
        The short version: fathom needs no account. Obstacle alerts always run on your phone. fathom
        asks before anything goes to Google. When Cloud AI is on, fathom sends Google&apos;s Gemini
        AI pictures from your camera, the text of what you say, and what it remembers about you, so
        it can answer you. While Lookout, Go, or a task is running, it sends a picture every few
        seconds. In Live mode, your voice is sent too, while the microphone is on. With On-device
        AI, nothing goes to Google. In both modes, fathom sends usage data and recordings of its
        menu screens to PostHog, unless you turn that off in Settings. We never sell your data or
        use it for advertising.
      </p>

      <h2>What fathom collects</h2>
      <h3 className="mt-6 font-medium">No account</h3>
      <p>
        There is no sign-up, no sign-in, and no login of any kind. You never give us your name,
        email, or any other personal identity to use fathom.
      </p>

      <h3 className="mt-6 font-medium">Two AI modes, and you choose</h3>
      <p>
        fathom has two AI modes. With Cloud AI, Google&apos;s Gemini AI answers you. With On-device
        AI, fathom&apos;s AI runs on your phone and nothing is sent to Google. You can switch
        between them any time: in Settings under AI Mode, or on the main screen, open Menu and
        choose AI mode.
      </p>

      <h3 id="to-google" className="mt-6 font-medium">What goes to Google when Cloud AI is on</h3>
      <p>When Cloud AI is on, fathom sends these to Google&apos;s Gemini AI to answer you:</p>
      <ul>
        <li>
          Pictures from your camera. While Lookout, Go, or a task is running, fathom sends one
          every few seconds, even when you haven&apos;t asked anything.
        </li>
        <li>
          The text of what you say or type. What you say is turned into text on your phone, and
          only the text is sent.
        </li>
        <li>
          In Live mode, your voice, while the microphone is on. That includes the times fathom
          turns the microphone on by itself after asking you a question. Your voice is not sent at
          any other time.
        </li>
        <li>If your iPhone has a depth sensor, how far away nearby obstacles are.</li>
        <li>
          What you&apos;ve told fathom about yourself, such as your sight, how you get around, who
          you live with, and any notes you added.
        </li>
        <li>
          What fathom remembers for you, such as your saved rooms, where you keep things, notes you
          gave a skill, and landmarks from routes you&apos;ve walked.
        </li>
        <li>Whether you are at home, and which saved room you are in.</li>
        <li>
          If you set up your profile by talking, the text of what you say during setup, including
          your name if you give it. fathom uses the answer to fill in your profile.
        </li>
      </ul>
      <p>
        fathom leaves your own name out of what it sends with each request. Other names can be
        sent, such as your guide dog&apos;s name, the names of people you live with, or a name
        saved in a memory. It never sends your GPS location. It works out on your phone whether you
        are home and which room you are in, and sends only that.
      </p>
      <p>
        To stop sending what you&apos;ve told fathom about yourself: in Settings, open More
        options, then Memory, then About you, and turn off the switch called Send profile to AI.
        Your saved rooms, what fathom remembers, and whether you are home are still sent while
        Cloud AI is on.
      </p>
      <p>
        Everything except Live mode goes from your phone to fathom&apos;s own backend, which passes
        it to Google. For Live mode, fathom&apos;s backend gives your phone a short-lived key that
        works for one connection, and your phone then talks to Google directly. Every connection is
        encrypted.
      </p>

      <h3 className="mt-6 font-medium">What stays on your phone</h3>
      <ul>
        <li>
          Turning speech into text. fathom uses Apple&apos;s speech recognition on your phone, and
          your voice is not sent to Apple.
        </li>
        <li>Obstacle alerts. They run on your phone in both AI modes and never use the cloud.</li>
        <li>
          On-device AI. Reading text works on every iPhone. On iOS 27 with Apple Intelligence, Look
          Now can also describe what is around you. Both run on your phone.
        </li>
        <li>
          Your profile, memories, places, skills, routes, and history. They are stored on your
          phone. fathom does not copy them to its backend or sync them to iCloud. Like other
          apps&apos; data, they are included in your iPhone&apos;s own backup if you use iCloud
          Backup or back up to a computer.
        </li>
      </ul>

      <h3 className="mt-6 font-medium">What fathom&apos;s backend keeps</h3>
      <p>
        fathom&apos;s backend stores none of the pictures, text, or audio you send. For each request
        it passes to Google, it keeps a usage record: a random install number made on your phone,
        which AI model answered, how long the request and the answer were, what it cost, and when.
        It also counts how often each install number asks, to keep usage within limits.
      </p>
      <p>
        To tell that requests come from the real fathom app, the backend keeps a security key from
        Apple&apos;s App Attest, made for your copy of the app, and a pass made from that key that
        lasts 30 days. While your phone gets a new pass, the backend briefly keeps a one-time code
        with your install number. It also logs each attempt to set up the security key, and the log
        can include the key&apos;s identifier. How long each of these is kept is under{" "}
        <a href="#how-long">How long we keep it</a>.
      </p>

      <h3 className="mt-6 font-medium">Usage data and screen recordings</h3>
      <p>
        fathom uses PostHog to learn how the app is used and to fix problems. This is on when you
        first open fathom, in both AI modes. To turn it off: in Settings, under Subscription &amp;
        Privacy, turn off the switch called Share anonymous usage data. That stops everything
        described here, including the screen recordings. The Send feedback button works only while
        usage data is on.
      </p>
      <p>PostHog receives:</p>
      <ul>
        <li>Which features you use, how long they take, and whether they worked.</li>
        <li>
          Your iPhone model and screen size, your iOS version and fathom version, your language and
          time zone, whether you are on Wi-Fi or cellular, whether your phone has LiDAR, and
          whether VoiceOver is on.
        </li>
        <li>
          Some of your words: the goal you give a task, the place you ask Go to take you, and any
          feedback you send. It also receives some of what fathom says while guiding a task, such
          as why a step can&apos;t go ahead.
        </li>
        <li>
          Text you type. When you finish typing in one of fathom&apos;s text boxes, PostHog can
          receive what you typed, such as your name or notes in About you, a memory you edit, or a
          request you type.
        </li>
        <li>
          Screen recordings of fathom&apos;s menu screens, such as Settings, History, and Memory.
          Recording pauses on the main conversation screen. The recordings are not masked, so they
          show whatever is on those screens, including the name in your profile, your memories, and
          answers fathom saved.
        </li>
      </ul>
      <p>
        PostHog does not receive pictures from your camera, audio, or your GPS location. What it
        gets is labeled with a random number made on your phone, not with your name, email, or
        Apple ID. PostHog does store your phone&apos;s internet address with it, and a rough
        location worked out from that address, such as your city. The screen recordings and the
        text you type can still show your name if you added it to your profile. fathom does not use
        Apple&apos;s advertising identifier, and it does not track you across other apps or
        websites.
      </p>

      <h3 className="mt-6 font-medium">Purchases</h3>
      <p>
        fathom plus is a subscription handled by Apple through the App Store. We never receive or
        store your payment details.
      </p>

      <h3 className="mt-6 font-medium">Notifications</h3>
      <p>
        Notifications are optional, and there are three kinds you can switch on or off separately
        in Settings. Tips &amp; new features and AI usage updates are scheduled on your phone and
        involve no server. The third, News from fathom, uses Apple&apos;s push service. While it is
        on, fathom&apos;s backend stores your phone&apos;s notification token, so an announcement
        can reach you. With the token, it stores the install number from its usage records (not
        the one PostHog uses), whether you have fathom plus, your fathom and iOS versions, and your
        language and region setting. None of it is linked to your name. Turning News from fathom
        off stops announcements and deletes the token and those details. If your phone is offline
        at the time, fathom deletes them the next time it&apos;s open and online. Your phone keeps
        its install number, because fathom&apos;s other cloud features use it too. If you remove
        fathom without turning News from fathom off, the token and those details stay on the
        backend until Apple reports that fathom is no longer on that phone. The backend learns that
        the next time it sends that phone an announcement, and then deletes them.
      </p>
      <p>
        Notifications never carry safety information. Obstacles and hazards always reach you inside
        the app, out loud and through touch, as they happen.
      </p>

      <h3 className="mt-6 font-medium">This website</h3>
      <p>
        Vercel hosts fathomvision.app, so it sees your internet address and your browser&apos;s
        details when you visit. The site uses PostHog to count which pages are visited and what is
        clicked. To do that, PostHog stores a random number in your browser. With each visit and
        click, it receives your browser and device details, such as which browser and version you
        use, your operating system, screen size, language, and time zone, and the page you came
        from.
        It stores your internet address, and a rough location worked out from that address, such
        as your city. The site does not record your screen.
      </p>
      <p>
        If you use the feedback form, what you write, the topic you choose, and the name and email
        you give, if any, are sent to our email through Resend.
      </p>
      <p>
        If someone sent you a link to a fathom plus code, the site records when the link is opened,
        with your browser&apos;s details, such as its name and version, and when you choose to
        redeem the code, so the person who sent it can see that it reached you. If they noted who
        the code is for, that note is stored with the code. PostHog also receives which code the
        link is for, both when you open it and when you choose to redeem it.
      </p>

      <h2>Who we share data with</h2>
      <ul>
        <li>
          <strong>Google (Gemini AI)</strong> receives the things listed under{" "}
          <a href="#to-google">What goes to Google when Cloud AI is on</a>, only to answer you.
        </li>
        <li>
          <strong>Supabase</strong> hosts fathom&apos;s backend, which passes requests to Google,
          gives your phone its Live mode keys, and keeps the usage records, the App Attest security
          keys, and, if you turn on News from fathom, your notification token. It also stores the
          records of fathom plus code links.
        </li>
        <li>
          <strong>PostHog</strong> receives the app&apos;s usage data, typed text, and screen
          recordings described above, unless you turn them off, and the visits and clicks on this
          website.
        </li>
        <li>
          <strong>Vercel</strong> hosts this website, including the feedback form and fathom plus
          code links.
        </li>
        <li>
          <strong>Resend</strong> delivers what you send with the website&apos;s feedback form to our
          email.
        </li>
        <li>
          <strong>Apple</strong> handles App Store purchases and delivers News from fathom
          notifications.
        </li>
      </ul>
      <p>
        Google, Supabase, and Resend handle this data for us under data processing terms that are
        part of our agreement with each of them. PostHog and Vercel handle it under their own terms
        of service. Apple handles purchases and notifications under its own privacy policy.
      </p>
      <p>
        Like any internet service, fathom&apos;s backend and PostHog see your phone&apos;s internet
        address (its IP address) when fathom connects to them, and in Live mode so does Google.
        PostHog stores the address with the usage data, and uses it to estimate roughly where you
        are, such as your city.
      </p>
      <p>We do not sell your data. We do not use it for advertising or share it with data brokers.</p>

      <h2 id="how-long">How long we keep it</h2>
      <p>
        Everything fathom stores on your phone, including what you&apos;ve told it about yourself,
        what it remembers, and the goals you gave tasks, stays there until you delete it or remove
        the app.
      </p>
      <p>
        fathom&apos;s backend stores none of the pictures, text, or audio sent to Google. What it
        does keep, it deletes on a schedule:
      </p>
      <ul>
        <li>
          Usage records are kept for the current month and the month before, then deleted. No
          usage record is more than about two months old.
        </li>
        <li>
          The counts of how often each install number asks, and the one-time codes, are deleted
          within two hours.
        </li>
        <li>The 30-day pass is deleted within a day after it runs out.</li>
        <li>
          The log of attempts to set up the App Attest security key, which can include the
          key&apos;s identifier, is deleted after 30 days.
        </li>
        <li>
          The App Attest security key has no end date, because the backend can&apos;t tell when
          fathom has been removed from a phone. It is stored without your install number.
        </li>
        <li>
          Your notification token is kept while News from fathom is on. If you remove fathom
          without turning it off, the token is deleted the next time we send that phone an
          announcement, when Apple reports that fathom is gone.
        </li>
        <li>
          Supabase&apos;s own logs of each connection to the backend, which include your
          phone&apos;s internet address, are kept for one day.
        </li>
      </ul>
      <p>
        What Google does with what fathom sends, in the words of fathom&apos;s consent pop-up:
        &ldquo;Google uses this to answer you, and doesn&apos;t use it to improve its products.
        Google keeps it for a limited time, only to check for misuse.&rdquo; Google&apos;s{" "}
        <a href="https://ai.google.dev/gemini-api/terms">Gemini API terms</a> also let it keep this
        data when the law requires it.
      </p>
      <p>
        PostHog keeps usage data, including text you typed and your internet address, for seven
        years. That period is set by
        fathom&apos;s PostHog plan, and fathom can&apos;t make it shorter. PostHog keeps screen
        recordings for 30 days.
      </p>
      <p>
        For this website: PostHog keeps visit and click data, including your browser and device
        details and your internet address, for seven years. That includes opening a fathom plus
        code link. Resend keeps a copy of a feedback message for 30 days, and keeps its backups for
        7 days. The message stays in our email until we delete it, and you can ask us to delete it.
        Vercel keeps the logs of the site&apos;s server code for up to a day. For a fathom plus code
        link, fathom&apos;s own record of your browser&apos;s details, and any note about who the
        code is for, are deleted 30 days after the offer ends.
      </p>

      <h2>Asking before anything reaches Google</h2>
      <p>
        fathom asks before anything is sent to Google. fathom starts in Cloud AI. The first time you
        open it, a pop-up asks: Allow cloud AI? It lists what is sent, and nothing is sent until you
        choose the Allow cloud AI button. If you choose the Keep fathom on-device button instead,
        Cloud AI is off, nothing goes to Google, and fathom tells you so. If you later choose Cloud
        AI, or ask for a task, without having agreed, the same pop-up appears first.
      </p>
      <p>
        Nothing is read aloud when the pop-up appears. With VoiceOver on, VoiceOver starts at its
        title, and you move through it like any other screen. Without VoiceOver, choose the Read it to me button
        to hear the whole text. The pop-up also links to this policy.
      </p>
      <p>
        fathom asks again when what it sends, or what the pop-up says about it, changes. fathom 1.3
        asks everyone who uses Cloud AI once more, because the pop-up now lists everything that is
        sent, including what fathom remembers about you. To read the same text again: in Settings,
        under Subscription &amp; Privacy, open Cloud AI &amp; Privacy. To switch to On-device AI: in
        Settings, under AI Mode, choose On-device AI.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          To use On-device AI, so nothing is sent to Google: in Settings, under AI Mode, choose
          On-device AI.
        </li>
        <li>
          To stop sending your profile: in Settings, open More options, then Memory, then About
          you, and turn off the switch called Send profile to AI.
        </li>
        <li>
          To stop usage data and screen recordings: in Settings, under Subscription &amp; Privacy,
          turn off the switch called Share anonymous usage data.
        </li>
        <li>
          To stop fathom keeping its answers in History: in Settings, under Subscription &amp;
          Privacy, turn off the switch called Store what fathom says. The button below it, Delete
          conversation history, deletes the conversations already stored.
        </li>
        <li>
          To turn notifications off: in Settings, under Subscription &amp; Privacy, open
          Notifications.
        </li>
        <li>
          To save a copy of your data: in Settings, open More options, then Your data, and choose
          Export all my data. The file holds your profile, memories, skills, and routes. Pinned
          spots and conversation history aren&apos;t included.
        </li>
        <li>
          To delete what fathom has learned: on the Your data screen, choose Delete all memories.
          It removes your memories, places, skills, pinned spots, and routes, and keeps your
          profile. To delete one memory, use Forget on its row in Memory.
        </li>
        <li>
          To delete everything: on the Your data screen, choose Delete everything. It also removes
          your profile and your conversation and task history. Your settings stay. Deleting on your
          phone does not remove usage data PostHog already has.
        </li>
      </ul>
      <p>
        Because fathom has no account, there is no profile on our side for us to look up, correct,
        or delete. What fathom stores on your phone is yours to export or delete. Usage data is
        labeled with a random number, not your name, email, or Apple ID, so we can&apos;t look it
        up by your name or email. You are always welcome to email us with a privacy question.
      </p>

      <h2>Children</h2>
      <p>fathom is not directed at children under 13, and we do not knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we&apos;ll update the date above and, for significant changes, let
        you know in the app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a href="mailto:privacy@fathomvision.app">privacy@fathomvision.app</a>{" "}
        or visit <Link href="/">fathomvision.app</Link>.
      </p>
      <p className="mt-6 text-sm text-[var(--text-muted)]">Unruly Vision, LLC</p>
    </Section>
  );
}
