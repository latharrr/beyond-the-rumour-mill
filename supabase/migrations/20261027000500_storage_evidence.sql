-- §1.6 Storage bucket `evidence`: private, 5 MB, MIME allowlist.
-- Path format: {user_id}/{uuid}.{ext} (uuid generated server-side).
-- Signed URLs (60 s) are issued only by an admin Server Action after a fresh
-- is_admin() check. Retention: evidence is kept for verification only and
-- deleted on request (README).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 5242880,
        array['image/jpeg', 'image/png', 'application/pdf']);

-- insert: authenticated, own folder only
create policy evidence_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

-- select / update / delete: admin only
create policy evidence_admin on storage.objects for all to authenticated
  using (bucket_id = 'evidence' and (select public.is_admin()));
