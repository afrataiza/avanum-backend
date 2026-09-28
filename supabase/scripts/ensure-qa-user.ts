#!/usr/bin/env -S deno run --allow-env --allow-net

const userId = Deno.env.get("QA_USER_ID");
const email = Deno.env.get("QA_EMAIL");
const password = Deno.env.get("QA_PASSWORD");
const baseUrl = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!userId || !email || !password) {
  throw new Error("QA_USER_ID, QA_EMAIL and QA_PASSWORD are required.");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
}

const headers = {
  "Authorization": `Bearer ${serviceRoleKey}`,
  "apikey": serviceRoleKey,
  "Content-Type": "application/json",
};

async function request(path: string, init: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers ?? {}),
    },
  });
}

async function fail(response: Response, action: string): Promise<never> {
  throw new Error(`${action}: ${response.status} ${await response.text()}`);
}

const lookup = await request(`/auth/v1/admin/users?filter=${encodeURIComponent(email)}`);

if (!lookup.ok) {
  await fail(lookup, "Failed to find local Auth users");
}

const payload = await lookup.json() as {
  users?: Array<{ id: string; email?: string | null }>;
};

const existing = payload.users?.find((user) => user.id === userId || user.email === email);

const body = {
  id: userId,
  email,
  password,
  email_confirm: true,
  user_metadata: {
    name: "Exploradora QA",
    display_name: "Exploradora QA",
  },
  app_metadata: {
    role: "qa",
  },
};

if (existing) {
  if (existing.id !== userId) {
    await fail(
      new Response(null, { status: 409 }),
      `A different Auth user already uses ${email}`,
    );
  }

  const response = await request(`/auth/v1/admin/users/${existing.id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await fail(response, "Failed to update QA Auth user");
  }

  console.log(`QA Auth user updated: ${existing.id}`);
} else {
  const response = await request("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await fail(response, "Failed to create QA Auth user");
  }

  const created = await response.json() as { id: string };
  if (created.id !== userId) {
    throw new Error(
      `Created QA Auth user id ${created.id}, expected fixed id ${userId}.`,
    );
  }

  console.log(`QA Auth user created: ${created.id}`);
}
