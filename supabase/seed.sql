-- Local/dev seed (runs on `supabase db reset`; never pushed to production).
-- Phase 0 skeleton: 3 companies, 5 roles, 30 topics, branches, 3 drives with
-- rounds, a few resources, and placeholder experiences. The 25+ real
-- senior experiences arrive in Phase 3 (§4).
--
-- Rows are shaped exactly like real rows: experiences reference real auth
-- users whose profiles were created by the handle_new_user trigger.

-- ---------------------------------------------------------------------------
-- Seed users (local only). Password for all: password123
--   admin@seed.test   → promoted to admin below (the documented procedure)
--   alumni1@seed.test, alumni2@seed.test → alumni
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
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'student@seed.test')
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
update public.profiles set role = 'alumni', grad_year = 2025
  where id in ('a0000000-0000-4000-8000-000000000002',
               'a0000000-0000-4000-8000-000000000003');

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
insert into public.companies (name, sector) values
  ('TCS',     'IT Services'),
  ('Infosys', 'IT Services'),
  ('Amazon',  'Product');

insert into public.roles (label, aliases) values
  ('Software Engineer',       '{"SDE","SDE-1","SWE"}'),
  ('Systems Engineer',        '{"SE","Ninja"}'),
  ('Digital Specialist Engineer', '{"DSE","Digital"}'),
  ('Data Analyst',            '{"DA","Analyst"}'),
  ('Quality Engineer',        '{"QA","SDET","Test Engineer"}');

insert into public.branches (code, label) values
  ('CSE', 'Computer Science & Engineering'),
  ('IT',  'Information Technology'),
  ('ECE', 'Electronics & Communication Engineering'),
  ('EE',  'Electrical Engineering'),
  ('ME',  'Mechanical Engineering'),
  ('CE',  'Civil Engineering');

insert into public.topics (label, category, aliases) values
  ('Arrays',                   'DSA', '{"array"}'),
  ('Strings',                  'DSA', '{"string"}'),
  ('Linked Lists',             'DSA', '{"linked list","LL"}'),
  ('Stacks & Queues',          'DSA', '{"stack","queue"}'),
  ('Hashing',                  'DSA', '{"hashmap","hash table"}'),
  ('Trees',                    'DSA', '{"binary tree","BST"}'),
  ('Graphs',                   'DSA', '{"BFS","DFS"}'),
  ('Dynamic Programming',      'DSA', '{"DP","memoization"}'),
  ('Greedy Algorithms',        'DSA', '{"greedy"}'),
  ('Sorting & Searching',      'DSA', '{"binary search","sorting"}'),
  ('Recursion & Backtracking', 'DSA', '{"recursion","backtracking"}'),
  ('Heaps',                    'DSA', '{"priority queue"}'),
  ('Operating Systems',        'CS Fundamentals', '{"OS"}'),
  ('DBMS',                     'CS Fundamentals', '{"database","normalization"}'),
  ('SQL',                      'CS Fundamentals', '{"queries","joins"}'),
  ('Computer Networks',        'CS Fundamentals', '{"CN","networking"}'),
  ('OOP',                      'CS Fundamentals', '{"object oriented","OOPS"}'),
  ('System Design Basics',     'CS Fundamentals', '{"LLD","HLD"}'),
  ('Java',                     'Programming', '{"core java"}'),
  ('C++',                      'Programming', '{"cpp","STL"}'),
  ('Python',                   'Programming', '{"py"}'),
  ('Quantitative Aptitude',    'Aptitude', '{"quant","maths"}'),
  ('Logical Reasoning',        'Aptitude', '{"reasoning","puzzles"}'),
  ('Verbal Ability',           'Aptitude', '{"english","verbal"}'),
  ('Data Interpretation',      'Aptitude', '{"DI","charts"}'),
  ('Pseudocode',               'Aptitude', '{"code tracing","output prediction"}'),
  ('Behavioural Questions',    'HR', '{"behavioral","STAR"}'),
  ('Project Discussion',       'HR', '{"projects","resume"}'),
  ('Leadership Principles',    'HR', '{"LP","amazon LP"}'),
  ('Email Writing',            'Communication', '{"business writing"}');

insert into public.resources (title, url, type, topic_id, company_id)
select r.title, r.url, r.type, t.id, c.id
from (values
  ('Striver A2Z DSA Sheet — DP',  'https://takeuforward.org/dynamic-programming/striver-dp-series-dynamic-programming-problems', 'course', 'Dynamic Programming', null),
  ('GFG: Operating Systems',      'https://www.geeksforgeeks.org/operating-systems/', 'article', 'Operating Systems', null),
  ('SQLBolt interactive lessons', 'https://sqlbolt.com/', 'course', 'SQL', null),
  ('IndiaBix Quantitative Aptitude', 'https://www.indiabix.com/aptitude/questions-and-answers/', 'article', 'Quantitative Aptitude', null),
  ('Amazon Leadership Principles', 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles', 'article', 'Leadership Principles', 'Amazon'),
  ('TCS NQT pattern overview',    'https://www.tcs.com/careers/india/tcs-fresher-hiring-nqt', 'article', 'Pseudocode', 'TCS')
) as r(title, url, type, topic_label, company_name)
left join public.topics t on t.label = r.topic_label
left join public.companies c on c.name = r.company_name;

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
-- Placeholder experiences (Phase 3 replaces these with 25+ real ones).
-- Mix of verified / pending / rejected so views and RLS have data to filter.
-- ---------------------------------------------------------------------------
insert into public.experiences
  (user_id, company_id, role_id, drive_id, rounds_summary, preparation_timeline,
   evidence_path, status, rejection_reason, verified_by, verified_at, created_at)
select x.user_id, c.id, r.id, dr.id, x.summary, x.timeline, x.evidence,
       x.status, x.reason,
       case when x.status <> 'pending' then 'a0000000-0000-4000-8000-000000000001'::uuid end,
       case when x.status = 'verified' then now() - (x.age_days - 2) * interval '1 day' end,
       now() - x.age_days * interval '1 day'
from (values
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'TCS', 'Systems Engineer',
   '[placeholder] NQT had heavy pseudocode and one easy array problem.', '[placeholder] 6 weeks of aptitude + PYQs.',
   'a0000000-0000-4000-8000-000000000002/1b4e28ba-2fa1-4d3b-9b1a-6c1f2d3e4f50.pdf', 'verified', null, 40),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'TCS', 'Systems Engineer',
   '[placeholder] Technical round asked OOP pillars and DBMS normalization.', '[placeholder] 1 month.',
   null, 'verified', null, 200),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'Amazon', 'Software Engineer',
   '[placeholder] OA: two medium problems, hashing + sliding window.', '[placeholder] 3 months of LeetCode.',
   null, 'verified', null, 90),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'Infosys', 'Systems Engineer',
   '[placeholder] Third OA question was a DP on strings.', '[placeholder] 2 months.',
   null, 'verified', null, 15),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'TCS', 'Systems Engineer',
   '[placeholder] Heard they only ask DP now.', null,
   null, 'pending', null, 3),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'Amazon', 'Software Engineer',
   '[placeholder] Unverifiable claim about referral-only hiring.', null,
   null, 'rejected', 'No evidence; contradicts official process.', 10)
) as x(user_id, company, role, summary, timeline, evidence, status, reason, age_days)
join public.companies c on c.name = x.company
join public.roles r on r.label = x.role
left join public.drives dr on dr.company_id = c.id and dr.role_id = r.id;

insert into public.experience_topics (experience_id, topic_id)
select e.id, t.id
from public.experiences e
join public.companies c on c.id = e.company_id
join public.topics t on
  (c.name = 'TCS'     and t.label in ('Pseudocode', 'Quantitative Aptitude', 'Arrays', 'OOP', 'DBMS')) or
  (c.name = 'Amazon'  and t.label in ('Hashing', 'Arrays', 'Leadership Principles')) or
  (c.name = 'Infosys' and t.label in ('Dynamic Programming', 'Strings'));

insert into public.experience_resources (experience_id, resource_id)
select e.id, res.id
from public.experiences e
join public.resources res on res.company_id = e.company_id;
