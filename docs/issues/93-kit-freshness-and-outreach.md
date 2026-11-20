# 93 - Starter kit: keeping it current, and getting it found

Status: needs-triage
Stage: web
Episode: W1 Starter kit
Blocked by: 90
Stories: -

## What to do

A legal guide is worth what its date is worth. The kit's promise is that it is current; this issue is the routine that keeps the promise, and the work of telling the people who would link to it.

## Keeping it current

- **Twice a year**: in January (laws usually take effect on 1 January) and in April (before the season), every guide and template is re-read against its sources and its `verified` date moved. A source whose wording changed gets its Facts corrected first.
- **Future wordings.** `z258from2027` and any later entry of its kind is merged into the main source once its date has passed. A test may fail the build when a source named "from <year>" is older than today.
- **Dead links.** A script that requests every `Source.url` and reports what does not answer; run before each deploy of the kit, by hand until it earns automation.
- **Years in titles, never in URLs.** The season's year lives in `seoTitle` and the texts; slugs and PDF file names stay.
- **A change log per page**, short, shown under "Ověřeno": what changed and when. Derived from the content if a clean way exists, written by hand otherwise.
- **IndexNow** to Seznam and Bing on each deploy that changes a kit page.

## Getting it found

From the research of 2026-11-19; none of it is done.

- Paediatricians' and schools' "forms to download" pages rank for the posudek and still host the pre-2026 form. A short note with the current one is the most honest link request there is.
- Camps that host their own outdated bezinfekčnost.
- poradna.crdm.cz and the regional youth councils; A-TOM, Pionýr, Sokol, DDM and SVČ.
- Providers of the zdravotník course and of the hlavní vedoucí course, for the first-aid kit list and the deník.
- Camp directories with free listings.
- The old Tábor Domino website, which still ranks for bezinfekčnost.
- The open-source angle for technical media.

## Measuring

- Umami: visits to `/pruvodce*` and `/vzory*`, `kit-download` by template and by blank or custom, and `signup` with a place that tells the kit from the rest of the website.
- Search Console and Seznam Webmaster: the queries the kit pages are shown for, monthly through the first season.

## Comments
