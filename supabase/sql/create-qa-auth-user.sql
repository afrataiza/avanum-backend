-- Local QA Auth bootstrap
--
-- Creates or updates the deterministic QA user without requiring a
-- service-role API key. This file is executed against the local database
-- after migrations and before the domain QA seed.

do $$
declare
  qa_user_id uuid;
  existing_user_id uuid;
  instance_id_value uuid;
begin
  select id into existing_user_id
  from auth.users
  where email = 'qa@avanum.local'
  limit 1;

  select id into instance_id_value from auth.instances order by id limit 1;

  if instance_id_value is null then
    raise exception 'No local Auth instance found';
  end if;

  if existing_user_id is null then
    qa_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    )
    values (
      instance_id_value,
      qa_user_id,
      'authenticated',
      'authenticated',
      'qa@avanum.local',
      crypt('avanum-local-qa', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"qa"}'::jsonb,
      '{"name":"Exploradora QA","display_name":"Exploradora QA"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      qa_user_id,
      'qa@avanum.local',
      '{"email":"qa@avanum.local","sub":"' || qa_user_id::text || '"}'::jsonb,
      'email',
      now(),
      now()
    );
  else
    update auth.users
    set
      encrypted_password = crypt('avanum-local-qa', gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"qa"}'::jsonb,
      raw_user_meta_data = '{"name":"Exploradora QA","display_name":"Exploradora QA"}'::jsonb,
      updated_at = now()
    where id = existing_user_id;

    if not exists (
      select 1
      from auth.identities
      where user_id = existing_user_id
        and provider = 'email'
    ) then
      insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        created_at,
        updated_at
      )
      values (
        gen_random_uuid(),
        existing_user_id,
        'qa@avanum.local',
        '{"email":"qa@avanum.local","sub":"' || existing_user_id::text || '"}'::jsonb,
        'email',
        now(),
        now()
      );
    end if;
  end if;
end $$;
