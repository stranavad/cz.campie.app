# 89 - Starter kit: texts of the four document templates

Status: in-progress
Stage: web
Episode: W1 Starter kit
Blocked by: 85
Stories: -

## What to build

The wording of the first four document templates, written from the regulations: what is printed, which parts an organiser may switch off or reword, and for every optional part the reason it is offered, with its citations.

## Decisions

- **Prohlášení o bezinfekčnosti.** The fixed core repeats § 9 odst. 1 písm. b) and c) of zákon č. 258/2000 Sb. in the law's own words. Optional: no change of health since the posudek, phone numbers for the stay, hair check (off by default; the law does not ask for it), signature by an authorised person. No rodné číslo, no address, no "změna režimu", nothing about covid.
- **Posudek o zdravotní způsobilosti dítěte.** Příloha č. 3 of vyhláška č. 106/2001 Sb. as amended by 400/2025 Sb., word for word, including the two changes in the poučení. Not customisable.
- **Souhlas se zpracováním osobních údajů.** Only what needs consent: photos in a closed gallery for parents, photos on the web and social networks, handing photos to the press and partners, the child's name with photos, rodné číslo for a confirmation of attendance. Each with purpose, place and period. It does not ask consent for the registration data or the health documents: ÚOOÚ calls that a mistake.
- **Souhlasy rodičů k pobytu.** Over-the-counter medicines, regular medication, the person accompanying the child to a doctor (§ 28 odst. 3 písm. e) of zákon č. 372/2011 Sb.), a statement on treatment that repeats § 35 odst. 3 instead of a "consent to treatment on the parent's behalf", transport by car, swimming ability, mixed accommodation (the one consent the decree names), moving without a leader, night game, completeness of health information.
- **Left out on purpose**: a parent's promise to pay for damage, any waiver of the organiser's liability, a consent to drug testing, a blanket power of attorney for medical decisions. None of them does what organisers hope and some are void.
- **No camp data in sentences.** The organiser and the camp appear as "label: value" lines.

## Acceptance criteria

- [x] Four templates in `apps/web/src/content/kit/documents/`, each satisfying `DocumentTemplate`.
- [x] Every optional item carries a `why` Fact with at least one citation.
- [x] The posudek matches the prescribed form.
- [ ] A person with legal training has read the four templates (issue 90).

## Comments

2026-11-19 - **Texts written.** The posudek was transcribed from the form published with vyhláška č. 400/2025 Sb. and its poučení checked against bod 42 of the amendment.
