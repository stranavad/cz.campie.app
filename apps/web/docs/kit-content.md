# Writing and checking the starter kit's content

The task brief for whoever writes or re-checks the legal content of Průvodce a vzory (`/pruvodce`, `/vzory`): a person, or a model run on this file. The content is read by people who organise children's camps and act on it. A wrong sentence here sends a camp to an inspection unprepared, so the bar is: **every statement is true on the stated date and anyone can check it in one click.**

To run it with a model, give it this file and one of the tasks of "Tasks" below, for example:

> Read `apps/web/docs/kit-content.md` and do the task "Full re-check" for the season 2027, legal state on 1. 1. 2027.

Use the strongest model available, with web access and enough time. The work is slow reading, not writing.

## What you change

Only `apps/web/src/content/kit/`:

| File                                 | Holds                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `types.ts`                           | the model: `Fact`, `Cite`, `Source`, `Guide`                             |
| `sources.ts`                         | every source that may be cited                                           |
| `cite.ts`                            | `par('z258', '9', '3')` for a paragraph, `at('v106', 'příloha č. 4')`    |
| `guides/*.ts`                        | one guide per file; the order in `guides/index.ts`                       |
| `hub.ts`                             | the hub: the two kinds of event, the timeline, guide cards, what changed |
| `documents/*.ts`, `document-list.ts` | the document templates: printed text, and why each item is there (`why`) |

Templates, components and styles are not part of this task. Read `apps/web/AGENTS.md`, section "Starter kit", before the first edit.

## The model in one paragraph

A page says nothing but `Fact`s. A Fact is one statement (`text`), how binding it is (`basis`), and at least one citation (`cites`) of a source in `sources.ts`. TypeScript refuses a Fact without a citation and a citation of an unknown source. `quote` holds the regulation's own words, `since` the date the rule came into force, `change` what changed on that date, `smallToo` marks a rule that also binds a "jiná podobná akce".

| `basis`     | Means                                                                   | Cites                           |
| ----------- | ----------------------------------------------------------------------- | ------------------------------- |
| `law`       | a regulation in force says so - or says nothing, and the Fact says that | the paragraph, with its anchor  |
| `authority` | a state body reads the regulation this way; not binding                 | the body's own page or document |
| `practice`  | an established organisation recommends it to its camps; not required    | the organisation's own page     |
| `advice`    | our own recommendation                                                  | the rule it builds on           |

## Rules

1. **Read the source, every time.** Never write or confirm a Fact from memory, from another Fact, or from a secondary website. Run `pnpm kit:check --refresh --dump` first: it downloads every cited regulation into `node_modules/.tmp/kit-sources/` as HTML and as plain text (`<id>.txt`). Read the paragraph there, then write.
2. **The wording in force on the target date.** zakonyprolidi.cz shows the consolidated wording in force today; a wording that takes effect later is at `/zneni-YYYYMMDD` and is a separate entry in `sources.ts` (as `z258from2027`). A Fact about a rule not yet in force carries `since` and cites the future wording. When the date passes, merge the two entries.
3. **Secondary sources are leads, not sources.** Articles, forums, an organisation's handbook, a law firm's blog and older camp documents tell you where to look. The citation is the regulation itself. Never cite a text you have not opened in this run.
4. **One Fact, one statement.** If a sentence needs "and" between two rules from two places, it is two Facts.
5. **Say what the text says, not more.** No number, deadline, age, count or word like "always", "must", "every" that the paragraph does not hold. A rule with a condition keeps its condition. Where the regulation is silent on something people believe (a minimum age of a leader, children per leader), write that it is silent, as a `law` Fact citing the paragraphs where it would stand.
6. **Law and interpretation never share a Fact.** What the paragraph says is `law`. What follows from it by reasoning is `authority` if a state body says so on a page you can cite, otherwise `advice` - or it is left out.
7. **`quote` is verbatim.** Copied from the downloaded text, no ellipsis, no "(...)", no correction of the legislator's style. Footnote marks are left out. Use it for the sentences everything hangs on: definitions, deadlines, numbers.
8. **`smallToo` only by § 12.** A rule binds a "jiná podobná akce" only if § 12 of zákon č. 258/2000 Sb. names its paragraph, or the rule stands outside §§ 8-11 and binds everyone (GDPR, občanský zákoník, lesní zákon). When in doubt it is not `smallToo`.
9. **Amending acts are cited for the change, the consolidated text for the rule.** "Since 1. 1. 2026 the posudek has a new form" cites vyhláška č. 400/2025 Sb.; "the posudek is valid two years" cites § 9 of the act.
10. **Names of acts come from the Sbírka.** `title` in `sources.ts` is the act's real name, copied from its page.
11. **Unsure means not written.** A point you cannot settle from the text goes into your report under "Open questions", not onto the page with a hedge. The open legal questions known so far are in `docs/issues/90-kit-legal-review-and-launch.md`.
12. **No real people, no real camps** in any example. Hyphen "-", never an em-dash.

## How the texts read

Czech, for a volunteer camp leader, not for a lawyer. Second person plural ("ohlaste", "musíte"). The verb carries the force: "musí" only where the regulation obliges, "smí", "doporučujeme" for advice. The number that matters is in `**bold**`. Use the regulation's terms where a reader will meet them on a form (zotavovací akce, pořádající osoba, posudek o zdravotní způsobilosti, prohlášení o bezinfekčnosti) and plain words elsewhere. No sentence explains that the law is complicated.

## Tasks

### Full re-check (before every season, and after any amendment)

1. **Fix the date.** The season and the "legal state on" date. They appear in `kitLabels.legalState`, in the `seoTitle`s (the year) and in `sources.ts` (future wordings).
2. **Download.** `pnpm kit:check --refresh --dump`. It must end with 0 problems before you start; fix what it reports.
3. **Look for what changed since the last `verified` date.** For each regulation in `sources.ts`: its page on zakonyprolidi.cz lists the amending acts and the wordings with their dates - compare with the wording the content was written from. Then look for what is coming: the Sbírka zákonů for acts published but not yet in force, psp.cz for bills that touch zákon č. 258/2000 Sb., vyhláška č. 106/2001 Sb., zákon o zdravotních službách, the registers act, and the Ministry of Health's and the hygiene stations' pages for new guidance. Write the list of changes down before editing anything.
4. **Walk every Fact.** For each: open the cited place in the downloaded text, read the whole paragraph and its neighbours, and decide: stands / reword / wrong / place moved. Check the anchor, `at`, `since`, `smallToo` and `quote` with the same care as the text. Do this guide by guide, then `hub.ts`, then each template's `explain.facts` and every item's `why`.
5. **Walk every source the other way.** Read §§ 7-12 of zákon č. 258/2000 Sb. and the whole of vyhláška č. 106/2001 Sb. with its annexes from the first word to the last, and for each obligation name the Fact that states it. An obligation with no Fact is a gap: add the Fact, or note why the kit leaves it out. This step finds what step 4 cannot.
6. **Templates.** The posudek (`documents/posudek.ts`) is příloha č. 3 of the vyhláška word for word, in its order: compare line by line with the downloaded text. The other templates: every sentence a guardian signs must be one the organiser may lawfully ask for, and each item's `why` must say what it rests on. A consent the law does not need is not offered as needed.
7. **The hub.** The timeline's deadlines and their `offset`s, the two columns of `decision`, the `chips` of `hub.guides.groups` (each chip is a statement its guide makes, with its source), `changes` (every Fact that changed carries `since` and a `change` sentence that stands on its own) and `pending` (what is proposed but not law, said as such, with the bill's number and its stage on the day of the check).
8. **Second reader.** Hand each changed or new Fact, alone with the text of its cited place, to an independent reader (another model run with no access to your reasoning) with one question: does the text support this statement, fully, partly, or not? Anything but "fully" goes back to step 4. Do the same for a random tenth of the unchanged Facts.
9. **Dates.** Set `verified` to the day of the check on every guide and template you walked. It is the "Ověřeno" date on the page, the sitemap's `lastmod` and the article's date in search results.
10. **Checks.** In `apps/web`: `pnpm kit:check --refresh`, `pnpm check-types`, `pnpm lint`, `pnpm build`, `pnpm test`.
11. **Report** (below).

### A new guide or a new template

Steps 2, 4-6 and 8-11 for the new file only. A guide starts from the regulation, not from an outline: list the obligations the regulation holds on the topic, then order them as an organiser meets them. A new source goes into `sources.ts` first. A new guide joins `guides/index.ts`, a group in `hub.guides.groups`, the `related` lists of its neighbours, and `GuideSlug`.

### One amendment

Step 3 for that act, then steps 4-11 for every Fact that cites a paragraph it touches (search the content for the paragraph's anchor).

## What `pnpm kit:check` proves, and what it does not

It proves that every cited anchor exists on its source's page, that every `quote` stands word for word in a regulation its Fact cites, and that the other sources' addresses answer. It lists quotes from sources that are not regulations (check those by hand) and sources never cited.

It does not prove that a statement says what its paragraph says. Only reading does. A run with 0 problems is the start of the check, not its end.

## The report

Finish with a report in the conversation (not a file), in this order:

1. **Legal state** checked, and the day of the check.
2. **Changed Facts**: where, the old sentence, the new one, the paragraph, and why.
3. **New Facts** and **removed Facts**, with the reason.
4. **Changes in the law since the last check**, each with the act's number and date of effect, and the Facts it touched.
5. **Open questions**: what the text does not settle, with the two readings and what would settle it. These are for a lawyer; add them to issue 90 under `## Comments`.
6. **Not checked**: anything you could not open or read, by name.

Do not report a check you did not make. "All Facts verified" is true only if each one was opened beside its source in this run.
