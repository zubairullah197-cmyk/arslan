/*
# Revoke public portfolio writes

1. Modified Table
- `portfolio_videos`: Anonymous users retain SELECT access for the public portfolio.
- Anonymous INSERT, UPDATE, and DELETE table privileges are revoked.

2. Security Changes
- Signed-in authenticated users keep the existing editor write path through the four authenticated policies.
- This complements row-level security by removing anonymous write privileges at the table grant level.

3. Important Notes
- Existing rows are unchanged.
- The public portfolio remains readable without signing in.
*/

REVOKE INSERT, UPDATE, DELETE ON TABLE public.portfolio_videos FROM anon;
GRANT SELECT ON TABLE public.portfolio_videos TO anon;