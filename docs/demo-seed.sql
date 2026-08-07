-- JMAC demo accounts and job postings
--
-- Run explicitly, never automatically:
--   docker exec -i supabase_db_jmac-suite psql -U postgres -d postgres < docs/demo-seed.sql
--
-- This is the only sanctioned write from this repository to the jmac-suite
-- database, authorised on 2026-08-07 to make the platform demonstrable. It
-- adds rows; it changes no schema. The rollback for the two password changes
-- is in docs/rollback/2026-08-07-demo-accounts-rollback.sql.
--
-- Wrapped in a transaction on purpose: the first attempt referenced a `title`
-- column on job_postings that does not exist in this schema, and the whole
-- thing rolled back rather than leaving half-created accounts behind.

begin;

-- ---------------------------------------------------------------------------
-- 1. Passwords for existing accounts. No roles are changed here.
--
--    admin@jmac.com already holds the system_administrator role, which carries
--    all 79 permissions -- verified, not assumed. It needed a password, not a
--    new account, so this sets one rather than creating a second full-access
--    identity that would then need keeping in step.
--
--    manager@jmac.com also holds hr_manager and finance_manager, so its
--    sidebar shows more than POS. Narrowing that is a separate decision.
-- ---------------------------------------------------------------------------
update auth.users set encrypted_password = crypt('Admin123', gen_salt('bf'))
  where email = 'admin@jmac.com';
update auth.users set encrypted_password = crypt('Manager123', gen_salt('bf'))
  where email = 'manager@jmac.com';
update auth.users set encrypted_password = crypt('Cashier123', gen_salt('bf'))
  where email = 'cashier@jmac.com';

-- ---------------------------------------------------------------------------
-- 2. Two new HRMS demo accounts, each holding exactly one role so the
--    per-role navigation is unambiguous. handle_new_user() creates the
--    public.users row from this insert; status defaults to 'invited'.
-- ---------------------------------------------------------------------------
-- No ON CONFLICT: auth.users carries no plain unique constraint on email in
-- this Supabase version, so the clause errors rather than de-duplicating.
-- An explicit NOT EXISTS makes the script safe to re-run.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated', seed.email,
  crypt(seed.password, gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', seed.full_name), now(), now(), '', '', '', ''
from (values
  ('hrmanager@jmac.com', 'HrManager123', 'Helena HR Manager'),
  ('hrstaff@jmac.com',   'HrStaff123',   'Hugo HR Staff')
) as seed(email, password, full_name)
where not exists (
  select 1 from auth.users existing where existing.email = seed.email
);

update public.users set status = 'active', activated_at = now()
  where email in ('hrmanager@jmac.com', 'hrstaff@jmac.com');

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.key = case u.email
  when 'hrmanager@jmac.com' then 'hr_manager'
  when 'hrstaff@jmac.com'   then 'hr_staff'
end
where u.email in ('hrmanager@jmac.com', 'hrstaff@jmac.com')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. Two open job postings, so the public careers page has something to show.
--    job_postings has NO title column -- the title comes from positions.title
--    through the join, which is why this selects from positions rather than
--    naming the roles inline.
-- ---------------------------------------------------------------------------
insert into public.job_postings (
  department_id, position_id, description, requirements,
  employment_type, vacancies, status, posted_by, date_posted, closing_date
)
select
  p.department_id,
  p.id,
  case p.title
    when 'Cashier' then 'Process customer transactions accurately and give courteous service at the point of sale. You will work from the JMAC point-of-sale module, with your attendance and payroll handled in the same platform.'
    else 'Lead branch operations, supervise the team, and own daily sales and inventory performance. You will work across the People and Sales modules of the JMAC platform.'
  end,
  case p.title
    when 'Cashier' then 'Senior high school graduate. Retail experience an advantage. Comfortable handling cash and card payments.'
    else 'Bachelor''s degree. At least two years of supervisory experience in retail or operations.'
  end,
  'regular',
  case p.title when 'Cashier' then 3 else 1 end,
  'open',
  (select id from public.users where email = 'hrstaff@jmac.com'),
  now() - interval '2 days',
  (current_date + interval '45 days')::date
from public.positions p
where p.title in ('Cashier', 'Operations Manager')
  and not exists (
    select 1 from public.job_postings existing where existing.position_id = p.id
  );

commit;
