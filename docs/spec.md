# Campie - multi-tenant camp registration platform (v1)

Status: ready-for-agent

This spec describes a **new, separate platform**, not a change to Tábor Domino. Tábor Domino is the source of domain knowledge and of code to port, and is not the first tenant.

Decision source: the scoping session of 2026-10-07/08 (29 questions) and the stage 1 grilling of 2026-10-15 (18 questions; glossary in `CONTEXT.md`, decisions in `docs/adr/`). Divergences from Tábor Domino's glossary and ADRs are listed under Further Notes.

## Problem Statement

A Czech camp organiser who wants online registration today has two kinds of choice. The camp-specific products (ChciNaTábor.cz, iChytrák, Přihláškový systém) cover a configurable form, bank payment matching and a parent portal, but treat consent as a fixed generated document or as "submitting means agreeing", offer no parent-filled digital health record, and give little for running the camp itself. The systems built for leisure centres (IS Domeček, Leprikón) are designed around year-round kroužky. None is a modern open-source system a camp could host itself.

Tábor Domino has built exactly the missing parts for its own use: Consents with granular items and a stored signed PDF, a digital Health record with an audit trail, a Camp health log with Ticks, Oddíly, Vedoucí records and print-ready Printouts. But every layer hardcodes one camp: fixed Participant columns, seven anonymous Registration declarations, two Consent types, one payment merchant, one legal identity in the PDF templates, one email sender. Another camp cannot use it, and adding a second camp to it would mean a fork.

## Solution

A hosted, multi-tenant platform where any camp organisation signs up, describes itself, and runs its own registration:

- An **Organisation** signs up, picks a subdomain, accepts the terms and data processing agreement, and waits for the platform operator's approval before it can publish.
- It owns one or more **Camps**. A Camp owns the registration form, the Registration declarations, the Consents, the Document types, the Health record setup, the email texts and the branding.
- A Camp has **Turnusy**. Each Turnus has its dates, place, capacity, age limits, Registration window and price list.
- Guardians register on a hosted, branded page on the Organisation's subdomain, choosing one Turnus for their children, and come back through a magic-link portal to pay, sign Consents, upload documents and fill in the Health record.
- Admins invited by the Organisation's Owner work with Participants, payments, documents, Consents, health data, Oddíly and Vedoucí according to per-area read or write permissions, with every change audited.
- Money goes straight to the camp: bank transfer with a QR code, or card payment through the camp's own Comgate keys.
- The code is public under AGPL-3.0 from the first commit. Self-hosting is a later version, but the design keeps it a packaging job.

Delivery is in three stages tied to the 2027 camp season:

| Stage | Ready by | Contents |
|---|---|---|
| 1a | Registration opening, February 2027 | Signup and approval, admin auth, permissions and invitations, Organisation settings and branding, Camp and Turnus setup, pricing, form engine and builder, Registration declarations, email texts, public registration with placement, Přihláška PDF with QR platba, confirmation emails, manual payment ledger, guardian portal (login, Registrations, balance, contact edits), admin Registration list, detail, manual create, edit and cancel, a simple export, audit log, encryption |
| 1b | April 2027 | Comgate card payments, Consents, Documents, checklist, payment and open-item reminders, export presets and payments export, Turnus overview and filters, support access, feedback routing, audit log browser, erasure |
| 2 | Around May 2027 | Configurable Health record, Potvrzení o účasti, Posudek o zdravotní způsobilosti, Prohlášení o bezinfekčnosti, free-form message to guardians |
| 3 | Late June 2027 | Oddíly, Vedoucí, Camp health log with Ticks, Nástupní listina, Declined item overview, Oddíly overview, health summary, Bezinfekčnost vedoucích |
| After the season | Autumn 2027 | Post-Turnus cleanup and its reminder, the Owner's full export, platform usage counts |

Stage 1 is split by when a feature is first needed: bank transfer alone carries the opening, and Consents and documents are due weeks after registration. Built by one developer with agents.

The data model is designed for all three stages from the start, so later modules need no rework of earlier ones.

## User Stories

### Platform operator (stage 1)

1. As the platform operator, I want to be notified when a new Organisation signs up, so that I can review it promptly.
2. As the platform operator, I want a list of Organisations with their status (pending approval, approved, suspended), so that I can see what is waiting for me.
3. As the platform operator, I want to approve an Organisation, so that it can publish its registration pages.
4. As the platform operator, I want to suspend an Organisation, so that a fake or abusive camp's pages and emails stop immediately.
5. As the platform operator, I want to see usage per Organisation (registered Participants per Turnus and which modules are on), so that I can set prices after the pilot.
6. As the platform operator, I want to have no access to an Organisation's participant data by default, so that I can truthfully tell camps I cannot read their children's data unprompted.
7. As the platform operator, I want to enter an Organisation in support mode only while its Owner's time-limited grant is active, so that I can help when asked.
8. As the platform operator, I want feedback and problem reports from admins to arrive with the Organisation, user and page attached, so that I can reproduce issues.
9. As the platform operator, I want technical problem reports from guardians to reach me separately from questions about the camp, so that I am not answering questions about packing lists.
10. As the platform operator, I want a public page stating where data is stored and which providers process it, so that camps are informed before they sign up.
11. As the platform operator, I want reserved subdomain names to be unavailable to Organisations, so that nobody can register a name that impersonates the platform.
12. As the platform operator, I want sign-up, login-link and form-submission requests to be rate limited, so that the platform cannot be used to flood mailboxes or the database.

### Owner: signup and organisation (stage 1)

13. As an Owner, I want to sign up by myself with my organisation's legal identity, contact details and billing details, so that I can start without talking to anyone.
14. As an Owner, I want to choose a unique subdomain at signup, so that my camp has a recognisable address.
15. As an Owner, I want to accept the terms and the data processing agreement at signup with the accepted version recorded, so that my organisation's legal basis for using the platform is documented.
16. As an Owner, I want to read how and where the data is stored before I sign up, so that I can meet my own obligations as the data controller.
17. As an Owner, I want to set everything up and preview my registration page before approval, so that I am ready to publish the moment I am approved.
18. As an Owner, I want to be told clearly that publishing is waiting for approval, so that I do not think something is broken.
19. As an Owner, I want one Camp to be created for me automatically, so that I never see a level I do not need.
20. As an Owner, I want to edit my organisation's legal name, IČO, address, statutory representative and bank account, so that generated documents and payment instructions are correct.
21. As an Owner, I want to set a logo, an accent colour and a display name, so that pages, emails and PDFs look like my camp.
22. As an Owner, I want readable text colours to be chosen automatically against my accent colour, so that I cannot make my own form illegible.
23. As an Owner, I want to invite admins by email so that they set their own passwords, so that nobody knows another person's password.
24. As an Owner, I want to give each admin none, read or write for each area (Registrations, Camp settings, Health, Oddíly, Vedoucí), so that people see only what their job needs.
25. As an Owner, I want to change or remove an admin's access at any time, so that former helpers lose access.
26. As an Owner, I want to enter my Comgate keys and never have them shown again, so that they cannot be copied from my screen.
27. As an Owner, I want to run my camp with bank transfer only when I have no card gateway, so that a gateway contract is not a precondition.
28. As an Owner, I want to grant the platform operator support access for a limited time and revoke it early, so that help is possible without standing access.
29. As an Owner, I want to see everything the platform operator did during support access in my audit log, so that I can account for it.
30. As an Owner, I want to browse and filter the full audit log, so that I can answer who changed or viewed what.
31. As an Owner, I want to permanently erase a Registration with all its files, so that I can honour a guardian's deletion request.
32. As an Owner, I want to clear health data and uploaded files of a finished Turnus in one action while keeping names, payments and totals, so that I do not hold sensitive data longer than needed.
33. As an Owner, I want to be reminded a few months after a Turnus ends that its health data can be cleared, so that cleanup does not depend on my memory.
34. As an Owner, I want to download everything my organisation holds as Excel files plus an archive of all PDFs and uploads, so that I can leave the platform or keep my own archive.
35. As an Owner, I want to switch modules on and off per Camp with their data kept, so that I only see the features I use and lose nothing by hiding one.

### Admin with Camp settings: camp, turnus, form, pricing (stage 1)

36. As an admin, I want to create a second Camp with its own form and documents, so that two different programmes do not share a registration form.
37. As an admin, I want to create a Turnus with a name, dates, place, capacity, age limits and a Registration window, so that guardians can only register when and where I intend.
38. As an admin, I want to set a Base price, an optional Early bird price with its last day, an optional Deposit and a balance due date per Turnus, so that each run has its own price list.
39. As an admin, I want a manual switch that stops a Turnus accepting Registrations, so that I can close it regardless of dates and capacity.
40. As an admin, I want a website link on the Camp and optionally on a Turnus, so that hosted pages can send guardians back to my site.
41. As an admin, I want to start from a preset registration form and publish it unchanged, so that a typical camp needs no form design.
42. As an admin, I want to set each standard field (gender, rodné číslo, zdravotní pojišťovna, addresses, t-shirt size, health note, Camp friend, transport, how did you hear) to off, optional or required, so that I collect only what I need.
43. As an admin, I want to add my own fields (short text, long text, single choice, multiple choice, yes/no, number, date) with a label, a hint and a required flag, so that I can ask what is specific to my camp.
44. As an admin, I want each custom field to be asked either once per child or once per Registration, so that family-level questions are not repeated for every sibling.
45. As an admin, I want to reorder my custom fields, so that the form reads sensibly.
46. As an admin, I want to define my own boarding places for transport, so that guardians choose from places my buses actually stop.
47. As an admin, I want a choice option or a yes/no field to carry a fixed surcharge per child, so that paid transport or a t-shirt is added to the price.
48. As an admin, I want to set how many children one Registration may hold, so that I can allow siblings together or require one child per Registration.
49. As an admin, I want to preview the form before publishing, so that I see what guardians will see.
50. As an admin, I want publishing a form change to create a new version that leaves existing Registrations untouched, so that I can improve the form mid-season safely.
51. As an admin, I want to configure the list of Registration declarations, each with its text, an optional link to a page or uploaded PDF, and a mandatory or optional flag, so that guardians agree to my terms and not someone else's.
52. As an admin, I want the declarations preset (personal data notice, binding registration, terms and storno, truthfulness), so that I start from a complete set.
53. As an admin, I want a Sibling discount amount with a choice between "every child" and "from the second child", so that it matches how my camp has always done it.
54. As an admin, I want Discount codes as a percentage or a fixed amount with a usage limit and optional expiry, so that I can run offers.
55. As an admin, I want to set the date until which guardians may edit their contact details, so that lists are stable before camp.
56. As an admin, I want to edit the subject and text of each email using placeholders, so that messages sound like my camp.
57. As an admin, I want to switch individual emails off, so that guardians do not get messages I send another way.
58. As an admin, I want to set which addresses are notified of each new Registration, so that the right people in my team know.

### Guardian: registering (stage 1)

59. As a guardian, I want to open the camp's registration page on its own address with its logo and colours, so that I trust I am in the right place.
60. As a guardian, I want to see the open Turnusy with dates, price, age range and remaining places, so that I can choose.
61. As a guardian, I want to see when registration opens if it has not yet, so that I know when to come back.
62. As a guardian, I want a full or closed Turnus shown as unavailable, so that I do not fill in a form for nothing.
63. As a guardian, I want to choose a Turnus and register several children for it in one Registration, so that siblings going together are handled together.
64. As a guardian, I want to be told clearly when my child is outside the age range and to contact the camp, so that I know what to do next.
65. As a guardian, I want the price to update as I fill in the form, showing Early bird price, Sibling discount, Discount code and paid extras, so that the total is no surprise.
66. As a guardian, I want to enter a Discount code and see whether it applied, so that I get the offer I was promised.
67. As a guardian, I want to choose between paying in full and paying the Deposit when the camp offers one, so that I can spread the cost.
68. As a guardian, I want to choose bank transfer or card when the camp offers both, so that I pay the way I prefer.
69. As a guardian, I want to add a second guardian on the form, so that the other parent is on record from the start.
70. As a guardian, I want to read each Registration declaration and open the linked document before ticking it, so that I know what I agree to.
71. As a guardian, I want my child's place to be mine the moment I submit, so that I do not lose it while arranging payment.
72. As a guardian, I want never to be told I have a place when another parent took the last one a second earlier, so that confirmations are reliable.
73. As a guardian, I want a confirmation email with the Přihláška PDF, payment instructions and a QR code, so that I have proof and can pay from my banking app.
74. As a guardian, I want to pay by card straight after submitting and land on a thank-you page with a link back to the camp's website, so that the process has a clear end.
75. As a guardian, I want validation messages in Czech next to the field they concern, so that I can fix mistakes quickly.
76. As a guardian, I want the form to work well on a phone, so that I can register without a computer.
77. As a guardian, I want an accidental double submit not to create two Registrations, so that I am not charged twice.

### Guardian: portal (stage 1)

78. As a guardian, I want to log in through a link sent to my email without a password, so that there is nothing to remember.
79. As a guardian, I want my login to be valid for this organisation only, so that one camp's portal has nothing to do with another's.
80. As a guardian, I want to see all my Registrations at this organisation, past ones included, so that I have a history.
81. As a guardian, I want to see what I owe, what I have paid and the QR code, so that I can pay the balance.
82. As a guardian, I want to pay the rest by card when the camp has a gateway, so that I am not limited to how I started.
83. As a guardian, I want to download my child's Přihláška PDF, so that I have my copy.
84. As a guardian, I want to edit contact and address details until the camp's lock date, so that the camp has current information.
85. As a guardian, I want to add a second guardian later, so that the other parent can pay and sign too.
86. As a second guardian, I want the same rights as the first, so that either of us can act.
87. As a guardian, I want one checklist per child showing what is still open (payment, each Consent, the Health record, each required document), so that I know when I am done.
88. As a guardian, I want an email when a payment is recorded, so that I know it arrived.
89. As a guardian, I want the camp's contact shown for questions and a separate link for technical problems, so that my message reaches someone who can answer it.
90. As a guardian, I want it to be impossible to reach another family's data even by guessing identifiers, so that my child's data is safe from other parents.

### Guardian: Consents (stage 1)

91. As a guardian, I want to read a Consent in full, including any attached PDF, before signing, so that I know what I am signing.
92. As a guardian, I want to answer yes or no to individual items with my signature still valid, so that I can decline photo publication without refusing everything.
93. As a guardian, I want to be unable to sign without agreeing to the items the camp requires, so that I am not left with an invalid signature.
94. As a guardian, I want to sign by typing my name and place, so that signing takes a minute.
95. As a guardian, I want the signed PDF by email and in the portal, so that I have proof of what I signed.
96. As a guardian, I want to withdraw a withdrawable Consent, so that I can exercise my right under GDPR.
97. As a guardian, I want to sign a Consent again to change my answers, so that a change of mind is recorded properly.
98. As a guardian, I want either of us to be able to sign for our child, so that it does not depend on who submitted the form.

### Guardian: documents (stage 1)

99. As a guardian, I want to download the files the camp published, so that I have the propozice and the packing list.
100. As a guardian, I want to upload a PDF, JPG or PNG for each required document per child, so that I can hand things in from my phone.
101. As a guardian, I want to see whether an upload is Pending, Approved or Returned, with the note when returned, so that I know if I need to act.
102. As a guardian, I want to upload again after a document was returned, so that I can fix an unreadable scan.
103. As a guardian, I want to open what I uploaded, so that I can check what I sent.

### Admin: Registrations and payments (stage 1)

104. As an admin, I want a list with one row per Participant for the Selected Turnus, so that I work with one run at a time.
105. As an admin, I want to search by child's name, guardian's name, email or Variable symbol, so that I find a family quickly on the phone.
106. As an admin, I want to filter by payment status and by unsigned Consents, missing documents and an unfinished Health record, so that I can chase what is missing.
107. As an admin, I want an overview per Turnus of places filled against capacity and money expected, received and outstanding, so that I know where the camp stands.
108. As an admin, I want a Registration detail with everything submitted, the guardians, the price breakdown, payments, documents, Consents and change history, so that one screen answers a guardian's question.
109. As an admin, I want to create a Registration by hand, bypassing the Registration window, capacity and age limits, so that I can enter phone and paper registrations and exceptions.
110. As an admin with write access, I want to edit a Registration, including moving it to another Turnus and changing paid extras, so that changes agreed by phone are recorded.
111. As an admin with read access, I want to see Registrations without being able to change them, so that helpers cannot alter data by accident.
112. As an admin, I want to cancel a Participant so that the place is freed and the record kept, so that capacity is correct and history is preserved.
113. As an admin, I want to record a payment with amount, date and note, so that bank transfers are reflected.
114. As an admin, I want to record a refund or correction as a correcting payment, so that the balance is right without deleting history.
115. As an admin, I want to add a price adjustment with a note to a Registration, so that one-off discounts need no new rule.
116. As an admin, I want card payments to be recorded automatically, so that I do not reconcile the gateway by hand.
117. As an admin, I want to send a reminder to every guardian with an unpaid balance with one action, so that chasing payments takes a minute.
118. As an admin, I want to add further access emails to a Registration, so that a grandparent or the other household can log in.
119. As an admin, I want to regenerate and download a Participant's Přihláška PDF, so that I can reissue it after a correction.
120. As an admin, I want to see the change history of a record I can read, so that I know who changed what.
121. As an admin, I want to export Participants to Excel choosing columns built from my Camp's form, so that the spreadsheet contains my fields and not someone else's.
122. As an admin, I want to save named export presets shared with my colleagues, so that the bus list and the t-shirt order are one click each.
123. As an admin, I want a payments export, so that my accountant gets what they need.
124. As an admin without the Health permission, I want health columns to be absent from exports, so that I cannot leak what I am not allowed to see.

### Admin: Consents (stage 1)

125. As an admin, I want to write a Consent with a title, an introduction and items that are information only, must-agree or yes/no, so that my legal text becomes signable.
126. As an admin, I want to start from the starter Consents, so that I adapt a working text instead of facing a blank page.
127. As an admin, I want to mark a Consent as withdrawable or not, so that GDPR consents and contractual ones behave correctly.
128. As an admin, I want to attach my own PDF to a Consent, so that guardians agree to my existing táborový řád.
129. As an admin, I want editing a published Consent to create a new version with existing signatures tied to what was signed, so that proof is never rewritten.
130. As an admin, I want to see per Participant which Consents are signed, unsigned or Withdrawn, so that I know who is missing.
131. As an admin, I want to download any signed Consent PDF, so that I can show it if challenged.
132. As an admin, I want to send a reminder to guardians with unsigned Consents or missing documents, so that I do not write to each one.

### Admin: documents (stage 1)

133. As an admin, I want to publish download Document types, optionally limited to chosen Turnusy, so that each run's guardians see the right files.
134. As an admin, I want to define requirement Document types with a name, a description, an optional blank form and an optional due date, so that guardians know what to hand in.
135. As an admin, I want to approve a Parent-uploaded document, so that the requirement is marked done.
136. As an admin, I want to return an upload with a note that is emailed to the guardian, so that an unreadable scan gets replaced.
137. As an admin, I want to upload on a guardian's behalf or mark a requirement as handed in on paper, so that paper does not leave the checklist open.
138. As an admin, I want to attach Internal documents to a Participant that guardians never see, so that my own paperwork about a child lives with the child.

### Health record (stage 2)

139. As an admin with Camp settings, I want to configure the Health record from Domino's preset by setting each known field to off, optional or required, so that I ask for what my zdravotník needs.
140. As an admin with Camp settings, I want to add my own questions to the Health record, so that camp-specific concerns are covered.
141. As an admin with Camp settings, I want to set a complete-by date, so that guardians know the deadline.
142. As an admin with Camp settings, I want to be warned before publishing a Health record change after guardians have started, so that I understand who is affected.
143. As a guardian, I want to fill in my child's Health record in the portal, save it In progress and come back, so that I can look things up between sittings.
144. As a guardian, I want to list medications with dosage, purpose and whether my child takes them unaided, so that the zdravotník can administer them correctly.
145. As a guardian, I want to attach medical files, so that the camp has the reports.
146. As a guardian, I want to mark the Health record complete, so that the camp knows it is final.
147. As a guardian, I want to keep editing until the Turnus starts, so that a new allergy is not missed.
148. As an admin with Health read, I want to see each Participant's Health record, so that I can prepare.
149. As an admin with Health write, I want to fill in a Health record or mark it as handed in on paper, so that paper families are not left open.
150. As an admin with Health write, I want to reopen a child's Health record, so that a new question gets answered.
151. As an admin without the Health permission, I want to see no health data anywhere, so that sensitive data stays with those who need it.
152. As an Owner, I want every view and change of a Health record logged with who and when, so that access to health data is accountable.
153. As an admin with Camp settings, I want the registration form's health note switched off by default when the Health record module is on, and treated as health data if I do use it, so that health information is never held unprotected.
154. As a guardian, I want the reminder email to mention an unfinished Health record, so that I get one message about everything open.

### Generated documents and messages (stage 2)

155. As a guardian, I want to download a Potvrzení o účasti once the Registration is paid in full, so that I can claim a contribution from my employer or insurer.
156. As a guardian, I want a Posudek o zdravotní způsobilosti pre-filled with my child's details, so that the doctor only fills in their part.
157. As a guardian, I want a Prohlášení o bezinfekčnosti pre-filled for my child, so that I only sign and date it on departure day.
158. As an admin, I want to generate any of these for a Participant, so that I can hand one to a guardian who asks.
159. As an admin, I want generated documents to carry my organisation's legal identity, logo and colour, so that they are my camp's documents.
160. As an admin, I want to send a free-form message to the guardians of a Turnus, optionally only to those with an unpaid balance or unsigned Consents, so that I can send pre-departure information.

### Oddíly (stage 3)

161. As an admin with Oddíly write, I want to create, rename, reorder and delete Oddíly within a Turnus, so that grouping matches this year's plan.
162. As an admin with Oddíly write, I want to move Participants between Unassigned and an Oddíl, so that every child ends up placed.
163. As an admin with Oddíly, I want to see each Participant's Age on start and each Oddíl's gender split and age range, so that groups are balanced.
164. As an admin with Oddíly write, I want to link two Participants as a Friend preference and see whether they are together or apart, so that I honour friendships.
165. As an admin with Oddíly, I want to see the Camp friend typed on the form beside the Friend preferences when the camp collects it, so that I know what the guardian asked for.
166. As an admin with Oddíly write, I want one private Oddíly note per Participant, so that planning remarks stay in this module.
167. As an admin with Oddíly write, I want to assign Vedoucí to an Oddíl, so that everyone knows who leads which group.
168. As an admin with Oddíly read, I want to view the board without changing it, so that leaders can look without breaking the plan.
169. As an admin switching Oddíly on, I want to be told that gender must be collected on the form, so that balancing works.

### Vedoucí (stage 3)

170. As an admin with Vedoucí write, I want to keep a record per Vedoucí with name, role as free text, birth date, rodné číslo, address, contacts and bank account, so that staff evidence is in one place.
171. As an admin with Vedoucí write, I want to tick which Turnusy each Vedoucí works at, so that staff carry over between years without re-entry.
172. As an admin with Vedoucí write, I want to upload Leader documents with a display name, so that certificates and extracts are filed with the person.
173. As an admin with Vedoucí write, I want deleting a Leader document to erase the stored file, so that a criminal-record extract does not linger.
174. As an admin with Vedoucí, I want to export the Vedoucí list to Excel, so that I can share a staff roster.
175. As an admin, I want a Vedoucí record to be separate from a login, so that listing a cook does not give them access.

### Camp health log (stage 3)

176. As an admin with Health write, I want to record a Health incident with what happened, what was done, who signed it and when it occurred, so that the camp has a proper log.
177. As an admin with Health write, I want a separate wording for guardians and a switch for whether guardians see the entry, so that I control what is shared.
178. As an admin with Health write, I want to record a Tick as a point on the body diagram, so that its location is unambiguous.
179. As an admin with Health, I want Ticks numbered per Participant in the order found, so that I can refer to them.
180. As an admin with Health, I want the Camp health log as one list, newest first, with the Participant's Health record at hand, so that I see allergies and medication while writing an entry.
181. As an admin with Health read, I want to read the Camp health log without adding to it, so that leaders can be informed without becoming authors.
182. As a guardian, I want to see the Health incidents the camp chose to share, so that I know what happened to my child.
183. As a guardian, I want Ticks never shown to me in the portal, so that the camp's working records stay internal as intended.

### Printouts (stage 3)

184. As an admin, I want a Nástupní listina per Turnus grouped by boarding place, so that check-in on departure day runs from one sheet.
185. As an admin, I want an overview of Declined items grouped by item, so that leaders know which children must not be photographed.
186. As an admin with Oddíly, I want an Oddíly overview on one landscape sheet, so that it can hang on the noticeboard.
187. As an admin with Health, I want a health summary highlighting life-threatening conditions, EpiPen, allergies and medication, so that the zdravotník has the critical facts on paper.
188. As an admin with Health, I want a Bezinfekčnost vedoucích sheet listing the Vedoucí of a Turnus, so that staff sign their declaration on one page.

### Developer, contributor, future self-hoster

189. As a developer, I want to start the whole platform locally with one command and no cloud accounts, so that I can work offline and safely.
190. As a developer, I want emails written to the log locally instead of sent, so that testing never mails a real address.
191. As a developer, I want to switch the database and file storage providers by configuration, so that the same code runs on Neon and Tigris in production and on standard PostgreSQL and S3 locally.
192. As a contributor, I want to read and run the code under AGPL-3.0, so that I can trust and improve it.
193. As a future translator, I want every interface string in translation files, so that adding Slovak or English is not a rewrite.
194. As a future self-hoster, I want the local setup to be the basis of a self-hosted deployment, so that hosting it myself needs no special build.

## Implementation Decisions

### Architecture

- A new pnpm monorepo: one backend, one frontend, and a shared schema package of validation schemas and types used by both.
- Backend: NestJS 12, Drizzle v1, PostgreSQL, a Redis-backed job queue, server-side React for emails and PDFs.
- Frontend: a single React app built with the latest Vite and React Compiler, Tailwind, TanStack Router and TanStack Query. No Vue.
- The one frontend decides by hostname what it is: on an Organisation's subdomain it is the public registration pages and the guardian portal; on the main address it is signup, the admin interface and the platform console.
- Public addresses on an Organisation's subdomain: `/` is the Organisation landing (straight to the Camp when there is only one, Camp cards otherwise); `/{camp-slug}` lists the Camp's Turnusy; `/{camp-slug}/prihlaska?turnus={id}` opens the form with the Turnus preselected, as the deep link for the camp's website; `/portal` is the guardian portal across all the Organisation's Camps. The Camp slug is unique within the Organisation and editable, and old slugs keep redirecting. Admin pages live only on the main host.
- Frontend deploys to Vercel with a wildcard domain. Backend hosting is undecided and must not be assumed.
- Docker Compose runs the full stack locally: PostgreSQL, RustFS as the S3 server, Redis, Gotenberg, the API and the frontend.
- Identifiers are UUIDv7. Money is whole CZK as integers. Calendar-date rules (Early bird price, Age on start, Registration window) use the Europe/Prague calendar.

### Ports and adapters

Every external service sits behind a port with two implementations chosen by configuration:

| Port | Production | Local and tests |
|---|---|---|
| Database | Neon adapter (WebSocket driver, since transactions are required) | Standard `pg` driver |
| File storage | Tigris library | AWS SDK against RustFS |
| Mail | Resend | Log-only sender |
| Payment gateway | Comgate | Fake provider |
| PDF renderer | Gotenberg | Gotenberg locally, fake in tests |
| Key provider | Master key from a deployment secret | Fixed test key |
| Clock | System | Controllable |

The file storage port needs only put, get, delete and existence; see Files below for why no presigning is required.

### Tenancy

- Hierarchy: Organisation → Camp → Turnus. Registration belongs to one Turnus, and through it to the Camp; Participant belongs to a Registration.
- Every table carries the Organisation. PostgreSQL row-level security rejects any access outside the current Organisation, as a second line behind application checks. The application connects with a role that cannot bypass it.
- All organisation data access happens inside a unit of work that sets the current Organisation. It is resolved from the admin's membership, the guardian session, the hostname for public pages, the address of a gateway notification, or the payload of a background job.
- The platform console has its own narrow access to organisation-level records only (identity, approval status, usage counts, feedback). It has no path to participant data except through an active support grant.
- Sessions are httpOnly, Secure, SameSite=Lax cookies. The frontend reaches the API through a same-origin `/api/*` proxy, so a guardian cookie is scoped to its Organisation's subdomain and an admin cookie to the main host. Mutations also require a custom header against CSRF. See ADR-0001.
- The Organisation of a request comes from: the forwarded original host for public pages and guardian requests (a guardian session's Organisation must match it); an explicit header checked against membership for admin requests; the URL path for gateway notifications; the payload for jobs.
- Admin identity is global (one email, one account) with a membership per Organisation holding the permissions. V1 shows one Organisation per login; the model allows several.
- Organisation status is pending approval, approved or suspended. Publishing is blocked unless approved. Suspension takes public pages offline and stops outgoing email.
- Subdomains are lowercase letters, digits and hyphens, checked against a reserved list (`www`, `app`, `api`, `admin`, `mail`, `static`, `cdn`, `status`, `help`, `docs`, `blog`, `campie`), and fixed after approval. While an Organisation is pending, the operator may change its subdomain or reject it; rejection deletes the Organisation and frees the subdomain.
- The product is **Campie** at `campie.cz` (repository `cz.campie.app`). Name and domain are still configuration, not code, so a self-hoster can change them. Locally the platform runs on `*.localhost`.

### Form engine

One engine serves both the registration form and the Health record.

- A form definition is an ordered set of fields in three tiers: locked core, standard fields with a state of off, optional or required, and custom fields.
- Locked core of the registration form: the child's first name, last name and birth date; the guardian's first name, last name, email and phone.
- Standard fields carry platform-known meaning and validation (rodné číslo format, the insurer code list, boarding places defined by the camp).
- Custom field types: short text, long text, single choice, multiple choice, yes/no, number, date. Each has a label, a hint, a required flag and a scope of per Participant or per Registration. Choice options and yes/no fields may carry a fixed per-child surcharge, positive (paid extra) or negative (Claimed discount).
- A field with a negative surcharge can be marked as needing verification. Admins filter Registrations with unverified Claimed discounts, confirm them, or reverse them with a Price adjustment. Returning-camper, sibling-in-another-Registration and similar discounts are built this way; the platform has no fixed discount types beyond the Sibling discount and Discount codes. Exclusivity between discounts is expressed by putting them in one single-choice field.
- Sections have a fixed order; only custom fields are reorderable. There is no conditional logic.
- Publishing produces an immutable form version. A Registration records the version it was submitted under; the version preserves all labels and declaration wording.
- Fields added in a later version are offered on existing Registrations: guardians fill them in the portal until the Camp's contact-edit lock date, admins in the Registration detail at any time. Unanswered required new fields form one checklist item per Participant ("Doplnit údaje"), included in reminders.
- Fields removed in a later version stay on Registrations that answered them, read-only, marked as removed, visible to guardians and admins.
- Price list and surcharge changes never reprice existing Registrations. Answering a newly added surcharge field adds a price line at the amount shown at that moment, which is then frozen; changing that answer afterwards is admin only.
- Core answers are typed columns. Standard answers are stored under stable platform keys and custom answers under their field identifiers. Sensitive standard fields are stored encrypted.
- The same definition drives rendering, server-side validation, the export column catalogue and the Přihláška PDF.

### Registration, placement and declarations

- A Registration is one submission to one Turnus with up to two guardians of equal rights, shared by all its Participants, plus admin-added access emails.
- A Camp setting limits the number of Participants per Registration. The guardian chooses one Turnus first; every child on the form goes to it and must fit its age limits. Siblings at different Turnusy need separate Registrations, each with its own Variable symbol and payments; a Sibling discount never spans Registrations.
- An admin may move a whole Registration to another Turnus of the same Camp, bypassing capacity and age limits; price lines stay and money is fixed with Price adjustments. Moving one child out means cancelling it and creating a new Registration.
- Participant states are Registered and Cancelled. Payment status (unpaid, deposit paid, paid, overpaid) is derived from the balance.
- Only an admin can cancel a Participant; guardians contact the camp. Cancelling frees the place and changes no money: price lines stay as they are, and the admin settles any storno fee, removed price or refund manually with Price adjustments and correcting payments. The cancellation email states the current balance.
- Cancelling a whole Registration means cancelling each of its Participants; a Registration has no state of its own.
- A place is taken at submission. The capacity check and the insert are serialised per Turnus so the last place cannot be given twice. Capacity counts Registered Participants.
- A Turnus accepts Registrations when it is inside its Registration window, not manually closed and not full. There is no waitlist.
- Age limits are checked as completed years on the Turnus start date, inclusive at both ends, either side optional, and block submission with a message at the birth date and the camp's contact.
- The Registration window opens and closes at a date and time in Europe/Prague (close exclusive, either side optional), checked by the server at submission; the public page counts down to the opening. A rejected submission keeps the form data.
- Admin-created and admin-edited Registrations bypass window, capacity and age limits.
- Submissions are protected against double submit.
- Registration declarations are a per-Camp list, each mandatory or optional, each with optional link or uploaded PDF. Answers are stored with time and IP address; wording is preserved through the form version. No typed name, place or date.

### Pricing

- A pure pricing module computes a breakdown from the Turnus price list, the Camp's discount settings, the answers and the submission time. It is the single source for the live price on the form, the stored price and the Přihláška PDF.
- Rules: Base price or Early bird price per Participant by submission date; paid extras per Participant; Sibling discount per the Camp's switch; one Discount code as percentage or fixed amount; Deposit per Participant when chosen; admin price adjustments with a note.
- The breakdown is stored as lines on the Registration at submission. Later price list changes never reprice it.
- The total never goes below zero.
- A Discount code use is one Registration, taken at submission in the same serialised step as placement, so the limit cannot be exceeded. A code that ran out or expired (inclusive, Prague calendar date) since the price preview rejects the submission with a message at the code field and the form data kept. Cancellation and erasure do not return a use. Admin-created Registrations may apply a code past its limit or expiry and still count as a use.

### Payments

- Bank transfer is always available. Each Registration has an 8-digit Variable symbol: the last two digits of the Prague year of submission followed by six random digits, unique within the Organisation, regenerated on a clash, not configurable and never changed afterwards. QR platba appears in the confirmation email, the portal and the Přihláška PDF.
- Payments are a ledger on the Registration: manual entries by admins, automatic entries from the gateway, and correcting entries for refunds. Entries are never deleted.
- Comgate is optional per Organisation through its own keys, stored encrypted and never returned by the API. Each Organisation has its own notification address. A notification is verified by fetching the payment's status from Comgate with that Organisation's keys, and is idempotent per transaction.
- Card payment is offered on submission and later from the portal for the outstanding balance.
- Reminders are admin-triggered for all Registrations with a balance, optionally only the Overdue ones.
- The Deposit is a per-child amount set per Turnus; 0 means no Deposit and hides the choice on the form. A Turnus also sets "Deposit due within N days of submission" (default 14).
- Amount due now: while deposits are not covered, the deposits minus payments, due by the deposit date; afterwards the total minus payments, due by the balance due date. With full payment chosen, the total minus payments is due by the earlier of the deposit date and the balance due date. Registrations submitted after the balance due date owe the full amount within N days and are not offered a Deposit.
- The QR code and the portal show the amount due now with its date, and the full outstanding balance as a second option.
- Overdue is derived when an amount due now is unpaid past its date. It drives a list filter, the reminder target and the Turnus overview, and never cancels anything automatically.

### Identity, permissions and audit

- Admins: invitation by email, self-set password, reset by email, minimum strength, limit on failed attempts.
- Two-step login with TOTP: any admin may turn it on for their own account, with one-time recovery codes. An Owner may enforce it for the Organisation, in which case members without it must set it up at their next login. An Owner can reset a member's TOTP; a locked-out Owner is reset by the platform operator after an identity check outside the platform. Opt-in and enforcement ship in stage 1b.
- The platform operator is a global admin identity with an operator flag that can only be set from the command line. The console is on the main host and checks the flag on every request. TOTP is mandatory for operators from stage 1a. The flag gives nothing inside an Organisation beyond an active support grant.
- Support access is a time-limited, revocable grant by an Owner, read-only unless the Owner allows changes when granting it. Operator actions under it are written to the Organisation's audit log.
- A guardian may change either guardian's email and add a second guardian. A changed email takes effect only after the link sent to the new address is confirmed; the old address receives a notice naming the change and the camp's contact. An added guardian receives an invitation email. Removing a guardian is admin only. Admins change emails without verification; the old address still gets the notice. Every change is audited.
- Guardians: a login link by email valid for 30 minutes, producing a session bound to one Organisation. Access is derived from the guardian emails and access emails on Registrations in that Organisation. A guardian session is rejected by every other Organisation.
- Owner is a role on a membership; an Organisation may have several Owners and always keeps at least one. Any Owner can promote a member or demote another Owner; every change is audited and emailed to all Owners. The person who signs up is the first Owner. Owner is unrelated to the statutory representative, which is a field of the Organisation's legal identity.
- Permission areas are Registrations, Camp settings, Health, Oddíly and Vedoucí, each with none, read or write. The Owner has everything plus organisation settings, users, payment keys, support access and erasure. Permissions apply across the whole Organisation.
- Without Health read, no health data is returned anywhere, exports included.
- The audit log is append-only and records actor (admin, guardian, platform operator, system), action, target, time and IP address. It covers every change, every view of health data and every export containing sensitive columns. For encrypted fields it records which fields changed, not their values.
- The Owner sees the full log; anyone with read access to a record sees that record's history. Erasure leaves an entry without personal content.
- The audit log stores old and new values for unencrypted fields and only field names for encrypted ones.

### Post-Turnus cleanup

- After a Turnus ends, the Owner runs a cleanup and chooses which categories to clear: Health records with attachments, the registration form's health note, Parent-uploaded document files, Internal documents, stored generated PDFs, Participants' rodné číslo, signed Consents, and the Camp health log. The first six are preselected; signed Consents (proof) and the Camp health log (liability) are not.
- Cleanup can run again later to clear more categories. The Turnus records what was cleared, when and by whom; cleared document requirements show as Cleared rather than open.
- The reminder email goes to the Owner three months after the Turnus ends.

### Removing a Registration

- Removing a Registration offers two choices. **Cancel all** cancels every Participant and keeps all data (Registrations write). **Erase** anonymises it (Owner only).
- Erasure deletes every stored file (uploads, Přihlášky, signed Consent PDFs, Internal documents) and all form answers, declarations, Consent signatures, health data, guardians, access emails and notes. Registered Participants are cancelled first, freeing their places.
- Erasure keeps a tombstone for accounting: the Registration's Turnus, Variable symbol, Participant count, price lines, Price adjustments with blanked notes and the full payment ledger including gateway transaction identifiers. Names read "Smazáno" with the erasure date.
- Audit entries about an erased Registration stay, with value diffs and IP addresses scrubbed and the guardian actor shown as an erased guardian; the erasure itself is a new entry.

### Encryption

- Each Organisation has its own data key, stored wrapped by the master key from the key provider.
- Encrypted from stage 1: payment gateway keys, rodné číslo of Participants, the registration form's health note if used, and all uploaded and generated files.
- Encrypted from stage 2 and 3: every Health record answer and attachment, the Camp health log, and rodné číslo and Leader documents of Vedoucí.
- Names, emails, addresses and payments stay unencrypted at this level because lists, search and payment matching need them. Encrypted fields are never filtered or sorted in the database.
- Destroying an Organisation's key makes its encrypted data unreadable everywhere, backups included.
- The platform operator's lack of access is an application rule backed by the Owner's grant and the audit log, not a cryptographic guarantee. The public data page says so.

### Files

- Files are encrypted by the application with the Organisation's key before they reach storage, so storage holds only ciphertext.
- A download is requested through the API, which checks permission and returns a short-lived link to its own download endpoint. That endpoint decrypts and streams the file. This keeps click-to-open behaviour (including on phones) while never exposing a storage address.
- Uploads go through the API with type and size checks: PDF, JPG and PNG, with Domino's size limit.
- Erasing a Registration or deleting a Leader document removes the stored objects.

### Consents

- A Camp has any number of Consents. Each has versions; a version has a title, an introduction, items of three kinds (information only, must agree, yes/no), a withdrawable flag and an optional attached PDF whose fingerprint is recorded.
- Signing stores the Participant, the Consent version, the signer's typed name and place, the answers, the time, IP address, browser and the verified email, and produces a signed PDF with the full wording, the answers, the evidence and the Organisation's legal identity.
- Per Participant and Consent the state is unsigned, signed or Withdrawn. The current signature is the latest; earlier ones are superseded and kept. Withdrawal keeps the signed PDF.
- A new version never invalidates existing signatures and nobody is forced to re-sign.
- Declined items are read from current signatures only.
- This is a simple electronic signature. No drawn signature, SMS code or certificate.
- Starter Consents derived from Domino's GDPR consent and Operational consent ship as editable presets.

### Documents

- Document types belong to a Camp and are either downloads (optionally limited to chosen Turnusy) or requirements (name, description, optional blank form, optional due date).
- A Parent-uploaded document is Pending, Approved or Returned with a note; returning emails the guardians. An admin may upload on a guardian's behalf or mark a requirement as handed in on paper.
- Internal documents attach to a Participant and are never visible to guardians.
- A per-Participant checklist aggregates the status reported by each module: payment, missing required form answers, each Consent, the Health record, each requirement.

### Health record and Camp health log

- The Health record is configured per Camp through the form engine. Known fields come from Domino's record: insurer, doctor, life-threatening conditions, EpiPen, allergies by kind, diet, medications as a built-in repeating field, chronic conditions, psychological notes, swimmer level, bedwetting, attachments.
- States are Not done, In progress and Filled. It is created on first save, editable by either guardian until the Turnus starts, and can be filled, reopened or marked as handed in on paper by an admin with Health write.
- A change published after guardians have started applies to records not yet Filled.
- The Camp health log is ported from Domino: Health incidents with a guardian wording and a visibility switch, and Ticks as points on the body diagram numbered per Participant, never shown to guardians.

### Oddíly and Vedoucí

- Oddíly belong to a Turnus and are ported from Domino: free creation and ordering, Unassigned as the holding state, symmetric Friend preferences, one Oddíly note per Participant, Age on start. Switching the module on requires gender to be collected.
- Vedoucí belong to a Camp and are assigned to Turnusy, replacing Domino's Active flag. Within a Turnus a Vedoucí may be assigned to an Oddíl; an Oddíl may have several.
- A Vedoucí record is not a login.

### Generated documents and printouts

- One rendering pipeline: a React template to static markup to the PDF renderer. Branding and the Organisation's legal identity are inputs to every template.
- Wording is fixed by the platform. Templates are phrased so that the camp's data never needs Czech declension.
- The Přihláška PDF is core and generated per Participant after submission and on admin request.
- The Potvrzení o účasti is offered once the Registration is paid in full.

### Emails

- Sent from the platform's domain with the Camp's name as sender name and the Camp's contact as reply address.
- Types: registration confirmation, login link, payment received, payment reminder, signed Consent copy, reminder for open items, document returned, cancellation notice, new Registration notification to the camp, and from stage 2 the free-form message.
- Per Camp, each type has an editable subject and text with placeholders and an on or off switch. The login link cannot be switched off. Functional parts (payment details with QR, the login button, attachments) are fixed.
- Guardian emails go to both guardians. Access emails receive nothing automatically.
- Two sending subdomains: one for login links, email verification and invitations, one for everything else, so bulk reputation never affects login mail.
- Bounce and complaint notifications from the mail provider mark an address undeliverable: admins see it on the Registration, guardians see a portal banner, and only login links keep being attempted to it. Admin-triggered bulk mail is throttled per Organisation; the operator console shows each Organisation's bounce rate.
- A login-link request never reveals whether the address has Registrations.
- The free-form message can only target guardians of existing Registrations.
- Sending, PDF generation, exports and archives run as background jobs; a form submission does not wait for them.

### Export

- The column catalogue is derived from all published versions of the Camp's form: core, switched-on standard fields, custom fields (those removed in a later version marked as removed), prices, payments, statuses and Oddíl. Stage 1a ships one fixed export of every column the admin may see; presets follow in 1b.
- Named presets are shared within the Organisation and tied to a Camp. The last selection is remembered per user.
- Separate exports exist for payments and for Vedoucí.
- The Owner's full export is an asynchronous job producing Excel files and an archive of all files.

### Other

- Modules are switched per Camp: Consents, Documents, generated documents, Health record, Camp health log, Oddíly, Vedoucí. Switching one off hides it and keeps its data.
- Branding is a logo, one accent colour and a display name per Camp with the Organisation's as default. Layout and font are fixed, light theme only.
- All interface strings go through a translation layer. Czech is the only language. Camp-authored content is single-language.
- Signup records the accepted terms and data processing agreement version with time and user.
- The repository is public from the first commit under AGPL-3.0, with no secrets and no Domino-specific names or texts.

## Testing Decisions

A good test here exercises behaviour a camp or guardian could observe and would survive a rewrite of the internals. It does not assert on query shapes, mocked call sequences or private functions.

**Two seams, as agreed:**

1. **The backend's HTTP API against a real PostgreSQL with row-level security active**, with fakes at the ports: mail (captures messages), file storage, payment gateway, PDF renderer, key provider and clock. This is the main seam and covers almost everything.
2. **Pure domain modules tested directly**: pricing, the form engine's validation and versioning, placement rules, and checklist status.

There is no browser-level seam in v1.

**What the API seam must cover:**

- **Tenant isolation.** For every endpoint, a session of one Organisation cannot read or change another's data, including by guessed identifiers. A deliberately unscoped query returns nothing.
- **Permissions.** Each area at none, read and write; absence of health data without Health read, exports included.
- **Guardian access.** Sessions bound to one Organisation; equal rights of both guardians; access emails; no reach into other families.
- **Placement.** Concurrent submissions for the last place yield exactly one success; window, manual close and age limits; admin bypass.
- **Price freeze and form versions.** Changing a price list or publishing a new form leaves existing Registrations untouched.
- **Payments.** Ledger and derived status; gateway notification verified with the right Organisation's keys and idempotent; keys never returned.
- **Consents.** Must-agree enforcement, yes/no items, version binding, superseding, withdrawal, stored evidence, generated PDF handed to storage.
- **Documents.** Pending, Approved, Returned and the email on return; Internal documents invisible to guardians.
- **Encryption.** The sensitive list is ciphertext in the database and in storage; downloads work only through an authorised short-lived link.
- **Lifecycle.** Approval gating of publishing, suspension, support access expiry, erasure removing rows and objects, post-Turnus cleanup.
- **Emails.** The right recipients, per-email switches, the login link always sent.
- **Audit.** Changes, health views and sensitive exports produce entries; encrypted values are absent from them.

**Prior art in Domino:**

- The pricing module's tests are the model for the pure-module seam, as are the helper tests for the přihláška, the Potvrzení o účasti, the health journal and object keys.
- Domino's service tests mock the database connection. That approach is deliberately not carried over, because row-level security and isolation can only be proven against a real database.
- Domino has no HTTP-level tests, so the API seam is new and its harness (application bootstrap, organisation fixtures, port fakes) is part of stage 1.

## Out of Scope

- Kalendář
- Waitlist (náhradníci) and automatic cancellation of unpaid Registrations
- Embedding the form in the camp's own website, custom domains, a WordPress plugin, custom CSS
- Billing of Organisations: subscriptions, invoices to camps, plan limits
- A second payment gateway, bank statement import, and automatic bank matching (Fio matching is the first candidate after the pilot)
- Invoices (faktury) to guardians and accounting exports
- Conditional logic in forms, free layout, file-upload fields in the registration form, per-Turnus form or requirement differences
- Prices by age, instalment plans beyond Deposit plus balance, currencies other than CZK, VAT handling
- A properly modelled child attending several Turnusy; the child is entered twice
- Day camps with week-by-week attendance as a first-class case
- Editable wording of generated documents, a template editor, online signing of bezinfekčnost
- Staff agreements and DPP paperwork
- Restricting an admin to one Camp or Turnus
- One guardian account across Organisations, social login
- Scheduled automatic reminders, SMS, a camp's own sending domain
- Scheduled automatic data deletion
- Virus scanning of uploads
- Keys held only by the camp (browser-side encryption)
- Any language other than Czech
- Self-hosting documentation and packaging (v2)
- Migrating Tábor Domino's data onto the platform
- Domino's public website features: blog, gallery, team members, sponsors, CRM

## Further Notes

### Divergences from Tábor Domino's glossary and ADRs

The new platform needs its own CONTEXT.md and ADRs. Until it has them, these are the deliberate differences from Tábor Domino's:

- **Camp is an entity.** Domino's glossary avoids "Camp" for the Turnus row and states there is no parent entity above Turnus. ADR-0007 rejected a Camp → Turnus model "for now" and expected it could be added later; here it is required because the Camp owns the form and documents.
- **A form builder replaces per-variant forms in code.** This contradicts ADR-0007's consequence that differing registration flows are handled in code. That was right for one operator with two camps and is wrong for many organisations.
- **No Current Turnus.** Several Turnusy accept Registrations at once, each governed by its Registration window, its manual switch and its capacity. Selected Turnus is kept as the admin's viewing choice.
- **An admin may move a Registration to another Turnus.** Domino forbids moving and requires deleting and resubmitting.
- **Variable symbols are unique within an Organisation**, not across the platform.
- **Discount codes belong to a Camp**, not globally.
- **Registration declarations** are configurable, may be optional, and carry no typed name, place or date.
- **Parent-uploaded documents gain a Returned state.** Domino has no reject flow.
- **The checklist replaces linked features** (ADR-0001). Each module reports its own status.
- **Vedoucí are assigned to Turnusy**, replacing the Active flag, and may be assigned to an Oddíl.
- **Downloads are streamed through the API.** ADR-0008 and ADR-0006 rejected this in favour of presigned storage links because it added latency for no security gain. Here files are encrypted with per-organisation keys, so storage holds only ciphertext and the API must decrypt. The click-to-fetch, short-lived-link behaviour of ADR-0008 is kept.
- **One PDF pipeline** instead of ADR-0003's separate documents and printouts packages, since branding is now an input everywhere.

### Assumptions made without explicit confirmation

- Guardians belong to the Registration and are shared by its children.
- The operator notification on "registrations" means new Organisation signups.
- An Oddíl can have several Vedoucí.
- Export presets are shared within the Organisation, per Camp.
- A website link exists on the Camp, with an optional one per Turnus.
- A percentage Discount code applies to the per-child prices before the Sibling discount and not to paid extras; a fixed-amount code comes off the Registration total.
- When an admin adds a Participant or changes paid extras, only the affected price lines are recalculated from the price list in force at that moment, and shown before saving.
- The Potvrzení o účasti amount is the Participant's own price lines with Registration-level discounts and adjustments split evenly across its Participants.

### Dependencies that are not code

- **Pilot camps.** Two overnight camps, with a paper exercise mapping their přihláška, consent texts, price list and document list onto this design. It must finish before the standard field catalogue and the pricing rules are frozen; its result may change them.
- **Legal texts.** Terms and the data processing agreement, written by a lawyer, are needed before the first Organisation is approved.
- **Starter Consent texts.** Confirm that the author of Domino's texts agrees to their publication under an open licence.
- **Contribution policy.** Decide how outside contributions are accepted before the first one arrives.

### To verify at project setup

- That NestJS 12 and Drizzle v1 are released and usable; fall back to the latest stable of each if not.
- That the chosen Neon driver mode supports the transactions row-level security relies on.
- That RustFS behaves as a drop-in S3 server for the AWS SDK adapter.

### Code to port from Tábor Domino

The pricing function, the React to PDF pipeline, the Consent signing flow and its evidence, magic-link login, QR platba generation, the Comgate create-payment and notification verification, the token encryption service, Oddíly, Vedoucí with Leader documents, the Health record with its audit, the Camp health log with Ticks, the Participant PDF archive job, and the Printout templates listed in the stages.

### Open product questions

- The pricing model, including whether modules are priced separately.
- Whether Fio payment matching joins v1, which depends on the pilot camps' banks.
- Backend hosting.
