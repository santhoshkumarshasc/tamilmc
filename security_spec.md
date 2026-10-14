# Security Specification: TMC Awards

## Data Invariants
1. Profiles:
   - A profile cannot be deleted by a public user; only administrators can delete profiles.
   - Profile owners can update their own profile details (bio, channel name, accent, etc.) but cannot change ownerId or delete their account directly.
   - Profile display_name and channel_name must be non-empty strings.
2. Certificates:
   - Certificates are issued only by administrators.
   - Users may redeem valid certificates matching tokens.
   - Deletion and revocation of certificates are restricted to administrators.
3. Votes:
   - 1-person-1-vote: Each voter_id maps to a single creator target.
   - Only the voter can change or toggle their vote.

## The Dirty Dozen Payloads
1. Delete profile as non-admin -> PERMISSION_DENIED.
2. Impersonate another owner_id during profile creation -> PERMISSION_DENIED.
3. Overwrite certificate status from redeemed to unused without admin privileges -> PERMISSION_DENIED.
4. Inject arbitrary large payload (>500KB) into bio -> PERMISSION_DENIED.
5. Create certificate without admin privileges -> PERMISSION_DENIED.
6. Delete certificate as public user -> PERMISSION_DENIED.
7. Update another user's profile -> PERMISSION_DENIED.
8. Set negative votes or integer overflow -> PERMISSION_DENIED.
9. Mutate immutable fields (created_at, owner_id) -> PERMISSION_DENIED.
10. Unauthenticated write to certificates -> PERMISSION_DENIED.
11. Cast vote with empty creator_id -> PERMISSION_DENIED.
12. Create admin role or modify admins collection as regular user -> PERMISSION_DENIED.
