# 92 - Starter kit: "what applies to my camp" and the deadline calculator

Status: needs-triage
Stage: web
Episode: W1 Starter kit
Blocked by: 86
Stories: -

## What to build

Two small tools on the hub that turn the guides into an answer for one camp.

- **Co platí pro můj tábor.** Four questions: how many children up to 15, how many days, overnight or not, who organises (association or business). The answer: zotavovací akce or jiná podobná akce, the list of duties that follow, each with its citation and a link to its guide, and the zájezd warning for a business with an overnight camp. The logic is a pure function over the same Facts the guides show (`smallToo` decides what a small event keeps), so the tool cannot say something the guides do not.
- **Kalkulačka termínů.** The first day of the camp in, the dates out: ohlášení hygieně (one month before), the earliest day a výpis z rejstříku trestů and a water analysis may be dated (three months), notice of an event in a forest (30 days), the day the bezinfekčnost may be signed, the day the six months of keeping the records end. Each date with its citation, and a calendar file to download.

## Decisions to take when the issue is triaged

- Whether the answer of the first tool can be shared by URL (query parameters hold no personal data here).
- Whether the tools need the Preact dependency of issue 88 or stay plain scripts.
- Open questions 7 and 8 of issue 90 (how the 30 children are counted; příměstský tábor) decide what the first tool may claim.

## Comments
