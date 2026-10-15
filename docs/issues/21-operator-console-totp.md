# 21 - Platform operator console with mandatory TOTP

Status: ready-for-agent
Stage: 1a
Episode: E1 Organisations and identity
Blocked by: 19
Stories: 1, 2, 3, 4, 6

## What to build

The platform operator is a global admin identity with an operator flag that can only be set from the command line. The console on the main host checks the flag on every request and requires TOTP for every operator login. It lists Organisations with status (pending approval, approved, suspended), lets the operator approve, change the subdomain of a pending Organisation, reject a pending Organisation (deleting it and freeing the subdomain), and suspend an approved one. Approval fixes the subdomain and allows publishing. Suspension takes public pages offline and stops outgoing email. The console has access only to organisation-level records, never participant data.

## Acceptance criteria

- [ ] Only a CLI command sets or clears the operator flag; no API endpoint does
- [ ] An operator without TOTP set up must enrol before reaching the console
- [ ] Approve, reject, rename subdomain (pending only) and suspend work and are audited
- [ ] A suspended Organisation's public pages return a suspended page and no mail is sent
- [ ] Console endpoints cannot return Registrations, Participants or any participant data (test)

## Notes

- Spec sections: Tenancy, Identity, permissions and audit
- Approving the first real Organisation also needs the legal texts (non-code dependency)
- Usage counts are after the season; feedback is issue 64; support access is issue 63
