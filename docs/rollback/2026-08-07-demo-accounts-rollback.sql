UPDATE auth.users SET encrypted_password='$2a$06$4hqQoQIwaor7afOc/p0vxunTzsPdXfYdvvn3nOqYgOa8.9uRKbEIu' WHERE email='cashier@jmac.com';
UPDATE auth.users SET encrypted_password='$2a$06$yUfgmYc0m4P2KwY.t.oImeyMLLTqH1K3xoz9IadXBzyJJTrooEhde' WHERE email='manager@jmac.com';
-- pre-existing auth.users: accountant@jmac.com, admin@jmac.com, cashier@jmac.com, manager@jmac.com, owner@jmac.com, staff@jmac.com
-- pre-existing job_postings count: 0
