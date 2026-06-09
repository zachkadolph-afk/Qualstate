# Qualstate

**The personal-lines claims quality platform of the future.**

Qualstate puts an AI agent on the first pass of every settled property, auto, and
casualty claim, then lets human reviewers validate, calibrate, and teach the model —
turning claims quality assurance into a continuously improving system.

## The workflow

1. **Review Queue** — every settled/handled claim lands in the queue with an AI
   first-pass already complete. Filter by line of business; low-confidence answers
   are flagged.
2. **File Review (one-pager)** — open a claim and read the whole story on one page:
   a narrative summary, key-fact chips, the file timeline, and the parties involved.
3. **Calibration Questions** — a 10-question quality questionnaire (tailored per line
   — property talks dwellings, auto talks vehicles, casualty talks bodily injury).
   The AI agent has answered each one with a rationale, cited file evidence, and a
   self-reported confidence. The reviewer (R1/R2) **agrees or disagrees** with each
   answer; disagreements capture a corrected value + reason as model training signal.
4. **Scoring** — the reviewer's validated answers produce the **final Quality Score**.
   In parallel the system tracks an **AI Calibration Score** (how often the reviewer
   agreed with the agent), broken out **per question** so we know which questions the
   AI answers reliably and which need work.
5. **Quality Dashboard** — all results roll up: quality trend, score by line, AI
   reliability by question, agreement rate, and prioritized calibration insights.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Any credentials log you in (demo environment). Start on the **Quality Dashboard**,
then open the **Review Queue** and click any claim to run a full review.

Production build: `npm run build && npm run preview`.

## Stack

React + TypeScript + Vite, TailwindCSS (brand: blue/white with orange accents,
Plus Jakarta Sans), Recharts for analytics. All data is self-contained mock data —
no backend or API keys required for the demo. The "AI agent" answers are pre-staged
to showcase the human-in-the-loop calibration loop end to end.

## Notes for productionizing

- Swap the mock `agentAnswers` for live model inference over the claim file.
- Persist `CompletedReview` records and stream disagreement deltas to a training
  pipeline keyed by `questionId` + line of business.
- Wire the queue to the claims system of record; the one-pager summary becomes a
  generated brief so reviewers can eventually score from the summary alone.
