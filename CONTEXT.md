# Campie

A hosted, multi-tenant platform on which camp organisations run their own registration, payments, consents and camp-time records.

## Language

### Tenancy

**Organisation**:
A camp-running legal entity that signed up to the platform; the unit of tenancy, data ownership and billing.
_Avoid_: Tenant, account, client

**Camp**:
A programme an Organisation runs, owning its registration form, declarations, Consents, Document types and branding.
_Avoid_: Event, programme

**Turnus**:
One run of a Camp with its own dates, place, capacity, age limits, Registration window and price list.
_Avoid_: Session, term, běh

**Owner**:
A member of an Organisation holding every permission plus organisation settings, users, payment keys, support access and erasure; there may be several, never none.
_Avoid_: Admin (an admin is any member), statutár, superuser

**Platform operator**:
The person running the platform, who approves and suspends Organisations and reaches their data only through a support grant.
_Avoid_: Superadmin, root, platform admin

### Registration

**Registration**:
One submission by guardians to one Turnus, holding one or more Participants who all attend it.
_Avoid_: Application, přihláška (that is the PDF), order

**Participant**:
One child within a Registration; either Registered or Cancelled.
_Avoid_: Child (in data), camper, attendee

**Cancelled**:
A Participant whose place was released by an admin; the record and its money stay untouched.
_Avoid_: Deleted, withdrawn, storno

**Erased**:
A Registration reduced by the Owner to an anonymous accounting tombstone: personal data and files gone, price lines and payment ledger kept.
_Avoid_: Deleted, removed, GDPR delete

### Money

**Variable symbol** (VS):
The 8-digit number identifying a Registration's bank payments within its Organisation: two digits of the submission year, six random.
_Avoid_: Registration number, payment ID

**Deposit**:
A per-child part of the price, set per Turnus, that a guardian may pay first with the rest due by the balance due date; zero means the Turnus has none.
_Avoid_: Záloha (in code), advance, down payment

**Overdue**:
A Registration whose amount due now is unpaid past its due date.
_Avoid_: Late, unpaid (unpaid is a payment status)

**Paid extra**:
A form answer that adds a fixed amount per child, such as transport or a t-shirt.
_Avoid_: Add-on, příplatek (in code)

**Claimed discount**:
A form answer that takes a fixed amount off per child and that the camp may need to verify, such as a returning-camper discount.
_Avoid_: Discount type, věrnostní sleva (in code)

**Sibling discount**:
A fixed per-child amount off when one Registration holds more than one Participant, applied to every child or from the second child as the Camp chooses.
_Avoid_: Family discount

**Discount code**:
A Camp-defined code giving a percentage or fixed amount off, with a usage limit and optional expiry.
_Avoid_: Coupon, voucher, promo code

**Price adjustment**:
A manual plus or minus amount with a note that an admin adds to a Registration, used for one-off discounts, storno fees and removing a Cancelled Participant's price.
_Avoid_: Correction, manual discount

**Correcting payment**:
A ledger entry that reverses or reduces an earlier payment, used for refunds; payments are never deleted.
_Avoid_: Refund entry, negative payment

### Availability

**Registration window**:
The period, as Prague date and time, during which a Turnus accepts Registrations from guardians; either end may be open.
_Avoid_: Signup period, deadline

**Age on start**:
A child's completed years on the Turnus start date, the age that limits, Oddíly and printouts use.
_Avoid_: Current age, age at registration
