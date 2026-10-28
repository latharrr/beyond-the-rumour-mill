-- Employers and roles needed by the public hiring listings. Additive, idempotent.
insert into public.companies (name, sector) values
  ('Google',    'Product'),
  ('Microsoft', 'Product')
on conflict do nothing;

insert into public.roles (label, aliases) values
  ('Software Engineer Intern',            '{"SDE Intern","SWE Intern","Internship"}'),
  ('Systems Development Engineer Intern', '{"SysDE Intern","Internship"}'),
  ('Explore Microsoft Intern',            '{"Explore","Internship"}')
on conflict do nothing;
