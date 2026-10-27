-- Local/dev seed (runs on `supabase db reset`; never pushed to production).
-- Seed users, 3 drives with rounds, and 28 experiences (24 verified, 3 pending, 1 rejected).
--
-- THE EXPERIENCES ARE SYNTHETIC. The team wrote them to match the shape of
-- real submissions (§4) so the engine, trust scores, topic table and
-- rumour-check have data to work on. They are not real people's interviews.
-- Real senior-sourced experiences replace them in Phase 3, via
-- scripts/import-experiences.ts or /experiences/new.
--
-- Rows are shaped exactly like real rows: experiences reference real auth
-- users whose profiles were created by the handle_new_user trigger.

-- ---------------------------------------------------------------------------
-- Seed users (local only). Password for all: password123
--   admin@seed.test   → promoted to admin below (the documented procedure)
--   alumni1@seed.test … alumni6@seed.test → alumni (batches 2024–2026)
--   student@seed.test → student (trigger default)
-- ---------------------------------------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
       u.email, extensions.crypt('password123', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{}', now(), now(),
       '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'admin@seed.test'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'alumni1@seed.test'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'alumni2@seed.test'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'student@seed.test'),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 'alumni3@seed.test'),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'alumni4@seed.test'),
  ('a0000000-0000-4000-8000-000000000007'::uuid, 'alumni5@seed.test'),
  ('a0000000-0000-4000-8000-000000000008'::uuid, 'alumni6@seed.test')
) as u(id, email);

insert into auth.identities
  (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.email like '%@seed.test';

-- Admin promotion = service-role / migration SQL only (README).
update public.profiles set role = 'admin'
  where id = 'a0000000-0000-4000-8000-000000000001';
update public.profiles p set role = 'alumni', grad_year = x.grad_year
from (values
  ('a0000000-0000-4000-8000-000000000002'::uuid, 2025),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 2025),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 2024),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 2024),
  ('a0000000-0000-4000-8000-000000000007'::uuid, 2026),
  ('a0000000-0000-4000-8000-000000000008'::uuid, 2025)
) as x(id, grad_year)
where p.id = x.id;

-- Taxonomy (companies, roles, branches, topics, starter resources) lives in
-- migration 20261028000600_base_taxonomy.sql.

-- ---------------------------------------------------------------------------
-- Drives (+ eligible branches, rounds, round topics)
-- ---------------------------------------------------------------------------
insert into public.drives
  (company_id, role_id, title, eligibility_cgpa, max_backlogs, min_10th_pct,
   min_12th_pct, grad_years, drive_date, location, status, created_by)
select c.id, r.id, d.title, d.cgpa, d.backlogs, d.p10, d.p12, d.years,
       current_date + d.days_out, d.location, 'upcoming',
       'a0000000-0000-4000-8000-000000000001'
from (values
  ('TCS',     'Systems Engineer',  'TCS NQT 2026 — Ninja & Digital', 6.00, 1, 60.00, 60.00, '{2026,2027}'::int[], 21, 'On campus'),
  ('Infosys', 'Systems Engineer',  'Infosys SP/DSE Hiring 2026',     6.50, 0, 60.00, 60.00, '{2026}'::int[],      35, 'Virtual'),
  ('Amazon',  'Software Engineer', 'Amazon SDE-1 New Grad',          7.50, 0, null,  null,  '{}'::int[],          56, 'Bengaluru')
) as d(company, role, title, cgpa, backlogs, p10, p12, years, days_out, location)
join public.companies c on c.name = d.company
join public.roles r on r.label = d.role;

-- TCS and Infosys: circuit branches only. Amazon: no rows = all branches.
insert into public.drive_branches (drive_id, branch_id)
select dr.id, b.id
from public.drives dr
join public.companies c on c.id = dr.company_id
join public.branches b on b.code in ('CSE', 'IT', 'ECE', 'EE')
where c.name in ('TCS', 'Infosys');

insert into public.rounds (drive_id, name, position, description)
select dr.id, r.name, r.position, r.description
from (values
  ('TCS',     1, 'NQT Online Test',     'Numerical, verbal, reasoning, programming logic, coding'),
  ('TCS',     2, 'Technical Interview', 'Projects, OOP, DBMS, one coding question'),
  ('TCS',     3, 'HR Interview',        'Relocation, shifts, behavioural'),
  ('Infosys', 1, 'Online Assessment',   'Three coding problems of increasing difficulty'),
  ('Infosys', 2, 'Technical + HR',      'DSA discussion, SQL, project deep dive'),
  ('Amazon',  1, 'Online Assessment',   'Two coding problems + work-style survey'),
  ('Amazon',  2, 'Technical Round 1',   'DSA, Leadership Principles'),
  ('Amazon',  3, 'Technical Round 2',   'DSA + basic system design, Leadership Principles')
) as r(company, position, name, description)
join public.companies c on c.name = r.company
join public.drives dr on dr.company_id = c.id;

insert into public.round_topics (round_id, topic_id)
select ro.id, t.id
from (values
  ('TCS', 1, 'Quantitative Aptitude'), ('TCS', 1, 'Logical Reasoning'),
  ('TCS', 1, 'Verbal Ability'),        ('TCS', 1, 'Pseudocode'),
  ('TCS', 1, 'Arrays'),                ('TCS', 2, 'OOP'),
  ('TCS', 2, 'DBMS'),                  ('TCS', 2, 'Project Discussion'),
  ('TCS', 3, 'Behavioural Questions'),
  ('Infosys', 1, 'Dynamic Programming'), ('Infosys', 1, 'Greedy Algorithms'),
  ('Infosys', 1, 'Strings'),             ('Infosys', 2, 'SQL'),
  ('Infosys', 2, 'Project Discussion'),
  ('Amazon', 1, 'Arrays'),  ('Amazon', 1, 'Hashing'),
  ('Amazon', 2, 'Trees'),   ('Amazon', 2, 'Leadership Principles'),
  ('Amazon', 3, 'Graphs'),  ('Amazon', 3, 'System Design Basics'),
  ('Amazon', 3, 'Leadership Principles')
) as x(company, position, topic)
join public.companies c on c.name = x.company
join public.drives dr on dr.company_id = c.id
join public.rounds ro on ro.drive_id = dr.id and ro.position = x.position
join public.topics t on t.label = x.topic;

insert into public.round_resources (round_id, resource_id)
select ro.id, res.id
from public.rounds ro
join public.drives dr on dr.id = ro.drive_id
join public.resources res on res.company_id = dr.company_id
where ro.position = 1;


-- ---------------------------------------------------------------------------
-- Experiences (SYNTHETIC — see header). Fixed ids so topic tags can be listed
-- per experience. created_at spreads over ~20 months so recency decay and
-- TrustScore have something to show. Each experience is filed against the
-- seeded drive for its company + role when one exists.
-- ---------------------------------------------------------------------------
create temporary table seed_exp (
  n int, user_n int, company text, role text, summary text, timeline text,
  evidence text, status text, reason text, age_days int, topics text[]
);

insert into seed_exp values
-- TCS · Systems Engineer (7 verified)
( 1, 2, 'TCS', 'Systems Engineer',
  'NQT foundation section: numerical ability and reasoning, then a programming-logic section that was almost all pseudocode output prediction. Advanced coding had one easy array problem. Technical interview asked OOP pillars with examples and my final-year project.',
  'Six weeks: PrepInsta NQT PYQs daily, plus revising C basics for pseudocode.',
  'a0000000-0000-4000-8000-000000000002/1b4e28ba-2fa1-4d3b-9b1a-6c1f2d3e4f50.pdf', 'verified', null, 40,
  '{Pseudocode,"Quantitative Aptitude","Logical Reasoning",Arrays,OOP,"Project Discussion"}'),
( 2, 3, 'TCS', 'Systems Engineer',
  'Online test was standard NQT. In the technical round they asked DBMS normalization up to 3NF, difference between primary and unique key, and to write a SQL query with GROUP BY. HR was about relocation and night shifts.',
  'One month, mostly aptitude and DBMS notes.',
  null, 'verified', null, 200,
  '{DBMS,SQL,Pseudocode,"Quantitative Aptitude","Behavioural Questions"}'),
( 3, 5, 'TCS', 'Systems Engineer',
  'Verbal section had a long reading comprehension and an email-writing task. Pseudocode questions were about recursion output. Technical round: explain polymorphism, then reverse a string without built-ins.',
  'Three weeks; email writing practice helped more than expected.',
  null, 'verified', null, 420,
  '{"Verbal Ability","Email Writing",Pseudocode,OOP,Strings}'),
( 4, 6, 'TCS', 'Systems Engineer',
  'NQT aptitude was time-pressured; data interpretation sets took the longest. Coding: find the second largest element in an array. Interviewer asked about my internship and one OS question on deadlocks.',
  'Two months of IndiaBix aptitude, 20 minutes a day.',
  null, 'verified', null, 95,
  '{"Data Interpretation","Quantitative Aptitude",Arrays,"Operating Systems","Project Discussion",Pseudocode}'),
( 5, 7, 'TCS', 'Systems Engineer',
  'Pseudocode section again: loops, bitwise operators and recursion traces. Technical interview had OOP (abstraction vs encapsulation) and a DBMS joins question. HR asked why TCS and about service bonds.',
  'Five weeks with a friend; we timed each other on PYQs.',
  null, 'verified', null, 12,
  '{Pseudocode,OOP,DBMS,SQL,"Behavioural Questions"}'),
( 6, 8, 'TCS', 'Systems Engineer',
  'Reasoning was puzzles and seating arrangement. Coding question on counting vowels in a string. Interview: explain my project architecture, then normalisation and ACID properties.',
  'Six weeks.',
  null, 'verified', null, 300,
  '{"Logical Reasoning",Strings,"Project Discussion",DBMS,"Quantitative Aptitude"}'),
( 7, 2, 'TCS', 'Systems Engineer',
  'Retook NQT for Digital. Advanced coding had a medium array problem (subarray sum) and a greedy scheduling problem. Interview went deeper on Java collections and OOP design.',
  'Two months: LeetCode easy/medium arrays plus core Java revision.',
  null, 'verified', null, 160,
  '{Arrays,"Greedy Algorithms",Java,OOP,Pseudocode}'),
-- TCS · Digital Specialist Engineer (2 verified, no seeded drive)
( 8, 3, 'TCS', 'Digital Specialist Engineer',
  'Digital interview after NQT advanced: one DP question (climbing stairs variant), then system design basics for a URL shortener and Python generators.',
  'Three months of DSA; DP was the weak spot.',
  null, 'verified', null, 75,
  '{"Dynamic Programming","System Design Basics",Python,Arrays}'),
( 9, 5, 'TCS', 'Digital Specialist Engineer',
  'Advanced coding had graphs (BFS shortest path) and hashing. Interview asked REST basics, computer networks (TCP vs UDP) and OOP.',
  'Ten weeks.',
  null, 'verified', null, 510,
  '{Graphs,Hashing,"Computer Networks",OOP}'),
-- Infosys · Systems Engineer (4 verified)
(10, 3, 'Infosys', 'Systems Engineer',
  'Online assessment: three coding problems. Third was DP on strings (longest common subsequence). Interview: SQL joins and my project.',
  'Two months.',
  null, 'verified', null, 15,
  '{"Dynamic Programming",Strings,SQL,"Project Discussion"}'),
(11, 6, 'Infosys', 'Systems Engineer',
  'First problem greedy (minimum coins), second was string manipulation, third a DP on grids I could not finish. Technical + HR: normalisation, DBMS transactions, why Infosys.',
  'Six weeks of mixed DSA.',
  null, 'verified', null, 130,
  '{"Greedy Algorithms",Strings,"Dynamic Programming",DBMS,"Behavioural Questions"}'),
(12, 7, 'Infosys', 'Systems Engineer',
  'OA had a sorting + binary search question and a DP knapsack variant. Interview asked SQL (second highest salary) and Python list vs tuple.',
  'One month.',
  null, 'verified', null, 60,
  '{"Sorting & Searching","Dynamic Programming",SQL,Python}'),
(13, 8, 'Infosys', 'Systems Engineer',
  'Coding: greedy activity selection and a hashing frequency problem. The interviewer focused on the project and OOP basics in Java.',
  'Five weeks.',
  null, 'verified', null, 380,
  '{"Greedy Algorithms",Hashing,"Project Discussion",Java,OOP}'),
-- Infosys · Digital Specialist Engineer (1 verified)
(14, 2, 'Infosys', 'Digital Specialist Engineer',
  'DSE OA was harder: DP on trees and a graph connectivity problem. Interview went into OS scheduling and SQL window functions.',
  'Three months.',
  null, 'verified', null, 240,
  '{"Dynamic Programming",Trees,Graphs,"Operating Systems",SQL}'),
-- Amazon · Software Engineer (5 verified)
(15, 2, 'Amazon', 'Software Engineer',
  'OA: two medium problems, hashing plus sliding window, then the work-style survey. Round 1: trees (lowest common ancestor) and two Leadership Principles stories.',
  'Three months of LeetCode, ~150 problems.',
  null, 'verified', null, 90,
  '{Hashing,Arrays,Trees,"Leadership Principles"}'),
(16, 5, 'Amazon', 'Software Engineer',
  'Round 1 was a graph problem (number of islands) and Customer Obsession stories. Round 2: heap-based top-k problem and a small LLD for a parking lot.',
  'Four months.',
  null, 'verified', null, 560,
  '{Graphs,Heaps,"System Design Basics","Leadership Principles"}'),
(17, 6, 'Amazon', 'Software Engineer',
  'OA had an array two-pointer problem and a string hashing problem. Interviews: BST validation, then deep-dive into Ownership and Dive Deep with STAR format.',
  'Ten weeks, Neetcode 150 plus LP story bank.',
  null, 'verified', null, 30,
  '{Arrays,Strings,Hashing,Trees,"Leadership Principles","Behavioural Questions"}'),
(18, 7, 'Amazon', 'Software Engineer',
  'Technical round 2 had a DP question (house robber variant) and a graph BFS. Bar raiser asked LPs only, about a failure.',
  'Five months.',
  null, 'verified', null, 180,
  '{"Dynamic Programming",Graphs,"Leadership Principles"}'),
(19, 8, 'Amazon', 'Software Engineer',
  'OA: hashing and a heap problem. Round 1: tree traversal iteratively. Round 2: design a rate limiter at a basic level, plus Leadership Principles throughout.',
  'Three months.',
  null, 'verified', null, 8,
  '{Hashing,Heaps,Trees,"System Design Basics","Leadership Principles"}'),
-- Amazon · Data Analyst (1 verified, no seeded drive)
(20, 3, 'Amazon', 'Data Analyst',
  'SQL-heavy assessment: joins, window functions, a cohort query. Interview: interpret a dashboard and one LP story.',
  'Six weeks of SQL practice.',
  null, 'verified', null, 110,
  '{SQL,"Data Interpretation","Leadership Principles"}'),
-- Infosys · Systems Engineer (2 more verified)
(21, 6, 'Infosys', 'Systems Engineer',
  'Aptitude-style section before the coding round, then two coding problems (string palindrome, array rotation). Interview was mostly about the project and C basics.',
  'Four weeks.',
  null, 'verified', null, 270,
  '{"Quantitative Aptitude",Strings,Arrays,"Project Discussion"}'),
(22, 7, 'Infosys', 'Systems Engineer',
  'Coding round had a sorting-based question and a greedy one. Technical round on OS basics (paging) and DBMS keys; HR asked about relocation.',
  'Three weeks.',
  null, 'verified', null, 45,
  '{"Sorting & Searching","Greedy Algorithms","Operating Systems",DBMS,"Behavioural Questions"}'),
-- Amazon · Quality Engineer (2 verified, no seeded drive)
(23, 5, 'Amazon', 'Quality Engineer',
  'OA: one array problem and test-case design for a login form. Interview: write test cases for a vending machine, then a Leadership Principles story about a bug I caught.',
  'Six weeks.',
  null, 'verified', null, 450,
  '{Arrays,"System Design Basics","Leadership Principles"}'),
(24, 8, 'Amazon', 'Quality Engineer',
  'Coding round: string compression and a simple recursion problem. Interview asked how I would test an API and teamwork scenarios in STAR format.',
  'Three weeks.',
  null, 'verified', null, 20,
  '{Strings,"Recursion & Backtracking","Leadership Principles","Behavioural Questions"}'),
-- Pending (community-tips lane) and rejected
(25, 3, 'TCS', 'Systems Engineer',
  'Heard they only ask DP now.', null,
  null, 'pending', null, 3,
  '{"Dynamic Programming"}'),
(26, 7, 'Amazon', 'Software Engineer',
  'Friend said the OA this year had a trie question and the LP survey decides everything.', null,
  null, 'pending', null, 2,
  '{"Leadership Principles"}'),
(27, 8, 'Infosys', 'Systems Engineer',
  'Seniors say Infosys asks puzzles in HR.', 'Just practise puzzles.',
  null, 'pending', null, 6,
  '{"Logical Reasoning"}'),
(28, 2, 'Amazon', 'Software Engineer',
  'Unverifiable claim that hiring is referral-only this year.', null,
  null, 'rejected', 'No evidence; contradicts the official process.', 10,
  '{"Behavioural Questions"}');

insert into public.experiences
  (id, user_id, company_id, role_id, drive_id, rounds_summary, preparation_timeline,
   evidence_path, status, rejection_reason, verified_by, verified_at, created_at)
select ('e0000000-0000-4000-8000-' || lpad(x.n::text, 12, '0'))::uuid,
       ('a0000000-0000-4000-8000-' || lpad(x.user_n::text, 12, '0'))::uuid,
       c.id, r.id, dr.id, x.summary, x.timeline, x.evidence, x.status, x.reason,
       case when x.status <> 'pending' then 'a0000000-0000-4000-8000-000000000001'::uuid end,
       case when x.status = 'verified' then now() - (x.age_days - 2) * interval '1 day' end,
       now() - x.age_days * interval '1 day'
from seed_exp x
join public.companies c on c.name = x.company
join public.roles r on r.label = x.role
left join public.drives dr on dr.company_id = c.id and dr.role_id = r.id;

insert into public.experience_topics (experience_id, topic_id)
select ('e0000000-0000-4000-8000-' || lpad(x.n::text, 12, '0'))::uuid, t.id
from seed_exp x
cross join lateral unnest(x.topics) as tag(lbl)
join public.topics t on t.label = tag.lbl;

-- Every topic label above must exist: a typo would silently drop a tag.
do $$
begin
  if (select count(*) from public.experience_topics) <> (select sum(cardinality(topics)) from seed_exp) then
    raise exception 'seed: an experience topic label does not match public.topics';
  end if;
end;
$$;

insert into public.experience_resources (experience_id, resource_id)
select e.id, res.id
from public.experiences e
join public.resources res on res.company_id = e.company_id
where e.status = 'verified';

drop table seed_exp;
