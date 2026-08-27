-- ---------------------------------------------------------------------------
-- Shrink the documents bucket's per-file cap from 25 MB to 5 MB.
--
-- Client-side we already enforce this via MAX_FILE_SIZE_BYTES in
-- @lockkaro/validation. The bucket setting is the server-side backstop: if
-- something bypasses the client (a manually-crafted signed request, an older
-- app build cached in the browser, whatever), Supabase Storage still rejects
-- the upload with 413 Payload Too Large before it ever touches disk.
--
-- Existing files stored under the 25 MB cap are untouched — this only
-- affects new uploads.
-- ---------------------------------------------------------------------------

update storage.buckets
set file_size_limit = 5242880  -- 5 * 1024 * 1024
where id = 'documents';
