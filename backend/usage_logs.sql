
-- Tabela para registrar cada geração de proposta
create table usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  project_title text,
  tokens_used integer, -- Opcional, para futuro
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Segurança (RLS)
alter table usage_logs enable row level security;

-- Política: Usuário só vê seus logs
create policy "Users can view their own logs"
  on usage_logs for select
  using ( auth.uid() = user_id );

-- Política: Backend pode inserir (se usar service_role, bypassa isso, mas bom ter)
-- Se o backend usar a chave ANON, precisaria de uma política de insert
-- create policy "Users can insert their own logs"
--   on usage_logs for insert
--   with check ( auth.uid() = user_id );
