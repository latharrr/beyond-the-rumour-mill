-- Base taxonomy + starter resources as reference data, so every environment
-- (production included: seed.sql is local-only) has the branches, roles,
-- topics and companies onboarding, drives and submissions need. Moved here
-- from seed.sql. New entries follow README "How to add a topic": a new
-- migration, never seed.sql. Re-runnable: conflicts are ignored.

insert into public.companies (name, sector) values
  ('TCS',     'IT Services'),
  ('Infosys', 'IT Services'),
  ('Amazon',  'Product')
on conflict do nothing;

insert into public.roles (label, aliases) values
  ('Software Engineer',       '{"SDE","SDE-1","SWE"}'),
  ('Systems Engineer',        '{"SE","Ninja"}'),
  ('Digital Specialist Engineer', '{"DSE","Digital"}'),
  ('Data Analyst',            '{"DA","Analyst"}'),
  ('Quality Engineer',        '{"QA","SDET","Test Engineer"}')
on conflict do nothing;

insert into public.branches (code, label) values
  ('CSE', 'Computer Science & Engineering'),
  ('IT',  'Information Technology'),
  ('ECE', 'Electronics & Communication Engineering'),
  ('EE',  'Electrical Engineering'),
  ('ME',  'Mechanical Engineering'),
  ('CE',  'Civil Engineering')
on conflict do nothing;

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
  ('Email Writing',            'Communication', '{"business writing"}')
on conflict do nothing;

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
left join public.companies c on c.name = r.company_name
where not exists (select 1 from public.resources x where x.url = r.url);
