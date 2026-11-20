# 85 - Starter kit: content model, sources and guide texts

Status: in-progress
Stage: web
Episode: W1 Starter kit
Blocked by: -
Stories: -

## What to build

The marketing website gets a free starter kit for camp organisers: guides to what the law asks of a children's camp, and document templates. It exists to bring organisers to `campie.cz` from search ("bezinfekčnost vzor", "jak uspořádat tábor", "posudek o zdravotní způsobilosti") and to show them what Campie replaces. This issue is its content: the model that makes an unsourced statement impossible to write, the registry of sources, and the texts of the guides.

## Decisions

- **No statement without a source.** A `Fact` carries at least one `Cite`, a `Cite` names a `Source` of the registry (`src/content/kit/sources.ts`). The types enforce it: `cites` is a non-empty tuple and `source` is a key of the registry.
- **Four kinds of statement**, shown to the reader on every Fact: `law` (a regulation says so, or is silent and the Fact says that), `authority` (a ministry or office reads it this way), `practice` (an established organisation recommends it), `advice` (our own recommendation; its citations point at the rule it builds on).
- **Regulations link zakonyprolidi.cz**, whose pages carry an anchor per paragraph (`#p9-3` is § 9 odst. 3). A wording that is not in force yet has its own source entry linking the future version (`z258from2027`); the two are merged once the date has passed.
- **Verbatim quotes only.** `quote` holds the regulation's own words, checked against the consolidated text, never a paraphrase.
- **`since` marks what changed.** A Fact in force from 2026-01-01 or later carries the date; the list of changes on the hub is derived from these Facts, not written twice.
- **`smallToo` marks what also binds a "jiná podobná akce"** (fewer than 30 children, or 5 days and less).
- **Domino's documents are not a source.** Several of them cite sections that say something else or were repealed; the texts here are written from the regulations.
- **Legal state: 1 January 2027**, the first season under the new § 10 odst. 4 of zákon č. 258/2000 Sb. (výpis z rejstříku trestů pro práci s dětmi).

## Acceptance criteria

- [x] `src/content/kit/types.ts`: `Source`, `Cite`, `Fact`, `Guide`, `TimelineStep`; a Fact without a citation does not compile.
- [x] `src/content/kit/sources.ts`: every regulation, authority and organisation the guides cite.
- [x] Eleven guides in `src/content/kit/guides/`: kind of event, organiser's duties, children, leaders, criminal record extract, zdravotník and first-aid kit, accommodation and hygiene, catering, daily regime and bathing, personal data and photos, commercial camps and zájezd.
- [x] `src/content/kit/hub.ts`: the hub's texts, the timeline "what to do when" and the labels of the kit's pages.
- [ ] A person with legal training has read the guides (issue 90).

## Notes

- Research behind the texts (2026-11-19): the consolidated wordings of zákon č. 258/2000 Sb. in force and from 2027-01-01, vyhláška č. 106/2001 Sb. as amended by 400/2025 Sb., and the other regulations in the registry, read from zakonyprolidi.cz; guidance of ÚOOÚ, MZd, MMR, MŠMT and KHS Moravskoslezského kraje.
- What the research could not settle is listed in issue 90, not smoothed over in the texts.

## Comments

2026-11-19 - **Content written.** Types, the registry (36 sources) and the eleven guides are in `apps/web/src/content/kit/`; they pass `check-types` and `lint`. Quotes were checked against the downloaded consolidated texts. The hub's list of changes also names two proposals that are not law (sněmovní tisk 274 on who may be a zdravotník; the bill replacing the KHS), each stated as a proposal.
