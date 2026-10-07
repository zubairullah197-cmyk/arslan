/*
# Protect portfolio video editing

1. Modified Table
- `portfolio_videos`: Public visitors may still read the published video slots.
- Insert, update, and delete operations now require an authenticated Supabase session.

2. Security Changes
- Replaces the previous public write policies with authenticated-only write policies.
- Keeps a public read policy so the portfolio remains visible without signing in.
- Row level security remains enabled.

3. Important Notes
- The Edit panel signs in with the configured admin account before allowing changes.
- Existing video rows are not deleted or changed by this migration.
*/

ALTER TABLE public.portfolio_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read portfolio videos" ON public.portfolio_videos;
CREATE POLICY "Public can read portfolio videos"
ON public.portfolio_videos FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can add portfolio videos" ON public.portfolio_videos;
CREATE POLICY "Signed-in admins can add portfolio videos"
ON public.portfolio_videos FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update portfolio videos" ON public.portfolio_videos;
CREATE POLICY "Signed-in admins can update portfolio videos"
ON public.portfolio_videos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can remove portfolio videos" ON public.portfolio_videos;
CREATE POLICY "Signed-in admins can remove portfolio videos"
ON public.portfolio_videos FOR DELETE
TO authenticated
USING (true);