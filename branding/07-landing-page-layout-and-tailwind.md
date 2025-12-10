# 07 – Landing Page Layout and Tailwind Structure (Data Confessional)

This file defines the landing page layout, content sections, and a suggested Tailwind layout structure.

It is meant for a Next.js app (App Router) but can be adapted to any React setup.

---

## 1. Layout Overview

The landing page should feel like:

- A **quiet, warm room**, not a noisy SaaS marketing circus.

- Clear vertical flow, with obvious "this is what it is / how it works / why you care / what to do next".

Recommended sections (top to bottom):

1. Hero – "Where your data goes to tell the truth."

2. "How it works" – three-step visual.

3. Benefits – why this is different from dashboards / generic AI.

4. Use cases – concrete scenarios.

5. Screens / walkthrough – visual explanation.

6. Closing CTA – "Begin a confession."

---

## 2. Color / Layout Notes (Design Hints)

**Page frame:**

- Background: warm, very light neutral (e.g., `#f7f2ea` / `#f5f0e8` feel).

- Main content: centered, max width ~`max-w-5xl` or `max-w-6xl`.

- Use a slightly darker band at the very top or bottom to hint at wood.

**Hero:**

- Two-column on desktop (text left, visual right), stacked on mobile.

- Visual: a booth / interview room / laptop with charts glowing softly.

**Spacing:**

- Generous vertical rhythm: `py-16` to `py-24` for major sections.

- Plenty of whitespace around charts/screens.

---

## 3. Section-by-Section Content + Layout

### 3.1 Hero Section

**Goal:**

Explain the product in one breath, make the metaphor obvious, provide a single clear CTA.

**Content:**

- Title:

  > Where your data goes to tell the truth.

- Subtitle:

  > Drop in exports, spreadsheets, and links.

  > Walk out with honest dashboards, clear reports, and decks you can actually take into the room.

- Primary CTA button: **Begin a confession**

- Secondary CTA link (optional): **See an example briefing**

- Microcopy under CTAs:

  > No account gymnastics. Start with a single project and a couple of files.

**Layout:**

- Left: text block (title, subtitle, CTAs).

- Right: hero visual placeholder (Sora/video/image).

Suggested Tailwind structure (pseudo):

- `section` with `bg-[warm-neutral] py-16`

- Container: `mx-auto max-w-6xl px-4`

- Flex: `flex flex-col-reverse gap-10 md:flex-row md:items-center`

---

### 3.2 "How It Works" Section

**Goal:**

Communicate the 3-step flow clearly.

Section title:

> A quiet booth between spreadsheets and the boardroom.

Three steps:

1. **Bring in the mess**

   > Upload CSVs and Excel files, paste URLs, or drop in text.

   > Data Confessional profiles your tables and pulls out the useful bits.

2. **Interview the data**

   > The app generates dashboards and first-draft reports, then lets you ask questions in plain language.

   > It always shows which numbers and sources it used.

3. **Leave with a story**

   > Export executive summaries, board decks, or detailed reports.

   > Everything is structured, readable, and ready to share.

**Layout:**

- Background: still light, maybe a slightly darker tint than hero.

- 3 cards in a responsive grid (`grid-cols-1 md:grid-cols-3`).

- Each card has:

  - Small icon (placeholder).

  - Step title.

  - Short copy.

---

### 3.3 Benefits Section

**Goal:**

Differentiate this from generic "AI dashboards" and BI tools.

Section title:

> Not another dashboard. A room where the story comes together.

Benefits (as cards or stacked):

- **Honest insights, not vanity metrics**

  > See what's really happening, with clear caveats and context.

- **From raw exports to ready-to-share decks**

  > Turn messy inputs into slides and reports without living in presentation software.

- **A workspace you actually want to open**

  > Calm, warm, focused — more like a quiet office than a control center.

- **Answers that show their receipts**

  > Every AI answer explains which tables, columns, and links it drew from.

**Layout:**

- `section` with `py-16`

- Grid with 2 columns on desktop; stacked on mobile.

---

### 3.4 Use Cases Section

**Goal:**

Show where Data Confessional earns its keep.

Section title:

> When should you send your data to confession?

Use case cards:

1. **Quarterly sales briefings**

   > Bring in CRM exports and pipeline snapshots.

   > Leave with funnels, conversion charts, and a summary you can walk through in ten minutes.

2. **Market research snapshots**

   > Mix public links with internal numbers.

   > Let the booth pull out what's growing, who's winning, and where the gaps are.

3. **Marketing performance reviews**

   > Upload channel reports and landing page URLs.

   > See the story across channels without spending all day formatting slides.

4. **Consulting and client reporting**

   > Use consistent templates to turn client data into polished deliverables, project after project.

**Layout:**

- Grid of 2x2 cards on desktop; vertical stack on mobile.

- Each card: small heading + 2–3 lines of copy.

---

### 3.5 Screens / Walkthrough Section

**Goal:**

Visually show the flow with minimal text.

Section title:

> A quick confession, step by step.

Sequence of 3–4 screenshot tiles (or Sora stills):

1. "Start a new confession and define your question."

2. "Add files and links — we listen and profile."

3. "See suggested dashboards with honest commentary."

4. "Review the briefing and export it as a deck or report."

**Layout:**

- Could be a vertical "timeline" on mobile and a horizontal scroll / grid on desktop.

- Keep text short; the screens do the work.

---

### 3.6 Closing CTA Section

**Goal:**

Remind them what this does, and ask for a simple action.

Title:

> Ready to hear what your data has been trying to tell you?

Subtitle:

> Start a project, drop in a few files, and see what comes out of the booth.

Primary button:

- **Begin a confession**

Secondary (optional):

- **Browse example briefings**

Simple footer tagline:

> Data Confessional — bring the mess, leave with the story.

