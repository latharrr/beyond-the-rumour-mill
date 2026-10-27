-- Team decision: evidence limit 5 MB → 4 MB. Vercel caps function request
-- bodies at 4.5 MB, and submitExperience receives the file in a Server Action
-- body (multipart overhead included), so 5 MB uploads could never succeed in
-- production. Bucket, Zod schema and next.config bodySizeLimit agree.
update storage.buckets set file_size_limit = 4194304 where id = 'evidence';
