# 90 - Starter kit: legal review and launch checklist

Status: ready-for-human
Stage: web
Episode: W1 Starter kit
Blocked by: 86, 87, 88
Stories: -

## What to do

The starter kit is built from the regulations' texts, but it was written without a lawyer. Before it is published under Campie's name, a person with legal training reads the guides and the templates, the open questions below get an answer or are worded as open, and the search assumptions are checked on Google.

## Open legal questions

Each is either stated carefully in the texts today or left out. None is settled.

1. **Health data beyond the statute** (a camp's own health questionnaire): which exception of čl. 9 odst. 2 GDPR the organiser relies on, and whether explicit consent is needed. The guide says to have it assessed.
2. **Who is "činná při zotavovací akci"** under the new § 10 odst. 4 of zákon č. 258/2000 Sb.: instructors under 18, kitchen help, one-day visitors, external lecturers; how a foreigner proves a clean record. Junák reads it as everyone over 15.
3. **Keeping the výpis z rejstříku trestů**: the law does not list it among the documents kept for six months. The guide advises to record the check and not keep copies (čl. 10 GDPR).
4. **Sanction for a missing výpis at a "jiná podobná akce"**: § 92d odst. 4 písm. a) still names only § 10 odst. 1 and 3 in the 2027 wording.
5. **Information to the accompanying person** in "Doprovod k lékaři": whether the parent's written designation under § 28 odst. 3 písm. e) also lets the doctor share information with that person, or a further provision is needed.
6. **A posudek on the pre-2026 form** issued before 2026: the texts say it stays valid for its two years; the amendment has no transitional rule for forms.
7. **How the 30 children are counted**: per běh or per event, registered or present.
8. **Příměstský tábor** (no overnight stay): whether it is an "organizovaný pobyt" under § 12. The guides do not claim either way.
9. **Občanský zákoník from 2027-01-01**: the cited § 2920 and § 2921 were read in the wording in force to 2026-12-31; check the 2027 wording.
10. **Pending bills**: sněmovní tisk 274 (who may be a zdravotník) and the bill replacing the KHS. Update the hub when either passes.

## Launch checklist

- [ ] Guides and templates read by a lawyer; corrections applied in `apps/web/src/content/kit/`.
- [ ] The first Google.cz results checked by hand for the fifteen main queries (the research saw Seznam only): "prohlášení o bezinfekčnosti", "bezinfekčnost vzor", "posudek o zdravotní způsobilosti dítěte", "jak dlouho platí posudek o zdravotní způsobilosti", "souhlas s fotografováním dětí vzor", "souhlas s ošetřením dítěte vzor", "jak uspořádat tábor", "ohlášení zotavovací akce", "výpis z rejstříku trestů pro práci s dětmi", "zdravotník zotavovacích akcí", "lékárnička na tábor", "vyhláška 106/2001", "táborový řád vzor", "přihláška na tábor vzor", "potvrzení o účasti na táboře".
- [ ] Every external link of the kit answers (regulations, authorities, organisations).
- [ ] After the production deploy: sitemap resubmitted to Google Search Console, Bing Webmaster Tools and Seznam Webmaster.

## Notes

- Research of 2026-11-19: the Czech results are held by schools, single camps, paediatricians and news pages with forms from 2017 to 2024; one free generator exists (sepsano.cz), generic, without the organiser's identity; no camp registration system publishes templates.
- The kit states its own limits on every page (`hub.disclaimer`). The review does not replace that line.

## Comments
