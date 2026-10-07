/*
# Create portfolio video slots

1. New Tables
- `portfolio_videos`
- `id` (uuid, primary key): Stable identifier for each video slot.
- `position` (integer, unique, not null): Display order in the portfolio carousel.
- `title` (text, not null): Public project label.
- `type` (text, not null): Public project category label.
- `video_url` (text, nullable): Optional YouTube, Google Drive, or other video link.
- `thumbnail_url` (text, nullable): Optional image link for the card preview.
- `created_at` (timestamptz): Creation timestamp.

2. Security
- Row level security is enabled on `portfolio_videos`.
- This is an intentionally shared single-tenant portfolio with no sign-in screen, so the public app can read, add, edit, and remove slots through the anon key.
- Four separate CRUD policies are created for anon and authenticated roles.

3. Important Notes
- The table starts empty; the app creates ten blank slots when none exist.
- The editor validates and stores links as plain text; the public page only links to saved video URLs.
*/

CREATE TABLE IF NOT EXISTS public.portfolio_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position integer NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Untitled project',
  type text NOT NULL DEFAULT 'VIDEO / PLACEHOLDER',
  video_url text,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read portfolio videos" ON public.portfolio_videos;
CREATE POLICY "Public can read portfolio videos"
ON public.portfolio_videos FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can add portfolio videos" ON public.portfolio_videos;
CREATE POLICY "Public can add portfolio videos"
ON public.portfolio_videos FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update portfolio videos" ON public.portfolio_videos;
CREATE POLICY "Public can update portfolio videos"
ON public.portfolio_videos FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can remove portfolio videos" ON public.portfolio_videos;
CREATE POLICY "Public can remove portfolio videos"
ON public.portfolio_videos FOR DELETE
TO anon, authenticated
USING (true);