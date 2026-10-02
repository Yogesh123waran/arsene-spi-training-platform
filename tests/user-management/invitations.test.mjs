// Phase 7 P3.4 — invitation sending, slice 1 (pure tests + static service-role boundary checks).
// The real src/lib/user-management/invitations.ts, auth-admin.repository.core.ts and
// invitations.service.core.ts (transpiled by run.mjs) with fake Auth Admin / repositories:
// redirect construction, input whitelist, Auth error classification, every outcome (including
// "Auth sent but recording failed"), and source checks that only auth-admin.repository.ts can
// reach the service-role client and that nothing browser-side imports it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const build = process.env.UM_BUILD;
if (!build) throw new Error("Run through tests/user-management/run.mjs");
const I = await import(`${build}/lib/user-management/invitations.mjs`);
const { createAuthAdminRepository } = await import(`${build}/repositories/auth-admin.repository.core.mjs`);
const { InvitationsFunctionError, InvitationsRepositoryError } = await import(`${build}/repositories/invitations.repository.core.mjs`);
const { createInvitationsService, InvitationsAuthorizationError, InvitationsInputError } = await import(`${build}/services/invitations.service.core.mjs`);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const ID = "33333333-3333-4333-8333-333333333333";
const USER = "44444444-4444-4444-8444-444444444444";
const ADMIN = { id: "55555555-5555-4555-8555-555555555555", email: "a@test", fullName: "A", role: "admin", isActive: true, createdAt: "2026-01-01" };
const REDIRECT = "https://training.example.com/auth/confirm";
const quiet = async (fn) => {
  const saved = console.error;
  const lines = [];
  console.error = (...a) => lines.push(a.join(" "));
  try {
    return { result: await fn(), lines };
  } finally {
    console.error = saved;
  }
};

// ---------------------------------------------------------------- redirect
test("redirect: built from the configured app URL only; https (or local http); path/query/credentials dropped or refused", () => {
  assert.equal(I.invitationRedirectUrl("https://training.example.com"), REDIRECT);
  assert.equal(I.invitationRedirectUrl(" https://training.example.com/some/path?next=//evil.com#x "), REDIRECT);
  assert.equal(I.invitationRedirectUrl("http://localhost:3000"), "http://localhost:3000/auth/confirm");
  assert.equal(I.invitationRedirectUrl("http://127.0.0.1:3000/"), "http://127.0.0.1:3000/auth/confirm");
  assert.equal(I.invitationRedirectUrl("http://[::1]:3000"), "http://[::1]:3000/auth/confirm");
  for (const bad of [undefined, null, "", "   ", "not a url", "http://training.example.com", "http://localhost.evil.com", "http://[::2]:3000", "ftp://x.test", "javascript:alert(1)", "https://user:pw@training.example.com", "//evil.com"]) {
    assert.equal(I.invitationRedirectUrl(bad), null, String(bad));
  }
});

// ---------------------------------------------------------------- input whitelist
test("payload: known fields only, trimmed, role mapped from the application name; rules left to the database", () => {
  const r = I.buildInvitationPayload({
    email: "  New.Person@Example.test ", role: "student", fullName: " New Person ", studentCode: "S-1", phone: "",
    batchId: ID, expiresInDays: 5, specializations: [" PLC ", ""],
    // not part of the whitelist — never forwarded
    invited_by: USER, status: "accepted", intended_role: "super_admin", auth_user_id: USER,
  });
  assert.deepEqual(r, { ok: true, value: { role: "student", email: "New.Person@Example.test", full_name: "New Person", student_code: "S-1", specializations: ["PLC"], batch_id: ID, expires_in_days: 5 } });
  assert.deepEqual(I.buildInvitationPayload({ role: "admin", email: "a@b.test", fullName: "A" }).value.role, "super_admin");
  for (const bad of [{ role: "super_admin" }, { role: "owner" }, {}, { role: "student", email: 5 }, { role: "student", fullName: "x".repeat(201) },
    { role: "student", batchId: "nope" }, { role: "student", expiresInDays: 0 }, { role: "student", expiresInDays: 31 }, { role: "student", expiresInDays: "7" },
    { role: "student", specializations: "PLC" }, { role: "student", specializations: Array.from({ length: 21 }, () => "x") }]) {
    assert.equal(I.buildInvitationPayload(bad).ok, false, JSON.stringify(bad));
  }
});

// ---------------------------------------------------------------- Auth error classification
test("Auth errors: classified into a fixed set; indeterminate answers detected", () => {
  const c = I.classifyAuthInviteError;
  assert.equal(c({ status: 422, code: "email_exists" }), "already_registered");
  assert.equal(c({ status: 422, code: "user_already_exists" }), "already_registered");
  assert.equal(c({ status: 422, message: "A user with this email address has already been registered" }), "already_registered");
  assert.equal(c({ status: 429, code: "over_email_send_rate_limit" }), "rate_limited");
  assert.equal(c({ status: 429 }), "rate_limited");
  assert.equal(c({ status: 400, code: "email_address_not_authorized" }), "address_not_allowed");
  assert.equal(c({ status: 400, code: "email_address_invalid" }), "invalid_address");
  assert.equal(c({ status: 403, code: "not_admin" }), "auth_error");
  assert.equal(I.isIndeterminateAuthError({ name: "AuthRetryableFetchError", status: 0 }), true);
  assert.equal(I.isIndeterminateAuthError({ status: undefined }), true);
  assert.equal(I.isIndeterminateAuthError({ status: 500, code: "unexpected_failure" }), true);
  assert.equal(I.isIndeterminateAuthError({ status: 422, code: "email_exists" }), false);
  assert.equal(I.isIndeterminateAuthError(null), false);
});

test("messages: every outcome has a safe sentence; none leaks internals", () => {
  const outcomes = [
    { kind: "sent", invitationId: ID, attempt: "initial" },
    { kind: "sent", invitationId: ID, attempt: "resend" },
    ...Object.keys(I.CREATE_REASON_MESSAGE).map((reason) => ({ kind: "refused", stage: "create", reason, invitationId: null })),
    ...Object.keys(I.DELIVER_REASON_MESSAGE).map((reason) => ({ kind: "refused", stage: "deliver", reason, invitationId: ID, retryAfterSeconds: 42 })),
    { kind: "refused", stage: "deliver", reason: "something_new", invitationId: ID },
    ...["already_registered", "rate_limited", "address_not_allowed", "invalid_address", "auth_error"].map((reason) => ({ kind: "delivery_failed", invitationId: ID, reason, recorded: true })),
    { kind: "delivery_unknown", invitationId: ID },
    { kind: "sent_unrecorded", invitationId: ID },
    { kind: "unavailable", invitationId: null, reason: "not_configured" },
  ];
  const texts = outcomes.map((o) => I.invitationOutcomeMessage(o));
  for (const t of texts) assert.ok(typeof t === "string" && t.length > 10, t);
  assert.match(I.invitationOutcomeMessage({ kind: "refused", stage: "deliver", reason: "cooldown", invitationId: ID, retryAfterSeconds: 42 }), /42 s/);
  assert.equal(I.invitationOutcomeMessage({ kind: "refused", stage: "deliver", reason: "something_new", invitationId: ID }), I.GENERIC_INVITATION_ERROR);
  assert.match(I.invitationOutcomeMessage({ kind: "sent_unrecorded", invitationId: ID }), /was sent/);
  assert.doesNotMatch(I.invitationOutcomeMessage({ kind: "sent_unrecorded", invitationId: ID }), /fail/i, "never presented as a delivery failure");
  assert.doesNotMatch(texts.join(" "), /service[_ ]role|SUPABASE|public\.|SQLSTATE|42501|23505|token|record_invitation|begin_invitation/i);
});

// ---------------------------------------------------------------- Auth Admin repository core
function fakeAdmin({ invite, rpc } = {}) {
  const calls = [];
  return {
    calls,
    client: {
      auth: { admin: { inviteUserByEmail: async (...a) => (calls.push(["invite", ...a]), invite ? invite(...a) : { data: { user: { id: USER } }, error: null }) } },
      rpc: (...a) => (calls.push(["rpc", ...a]), rpc ? rpc(...a) : Promise.resolve({ data: { ok: true, delivery_status: "sent" }, error: null })),
    },
  };
}
const openWith = (client) => createAuthAdminRepository(() => client).openDelivery();

test("auth-admin core: one client per send — openDelivery builds it once; null when missing or when construction throws", async () => {
  let built = 0;
  const f = fakeAdmin();
  const delivery = createAuthAdminRepository(() => (built++, f.client)).openDelivery();
  await delivery.inviteUserByEmail("db@x.test", REDIRECT);
  await delivery.recordDelivery(ID, true, USER);
  assert.equal(built, 1, "invite and record reuse the client opened for this operation");
  assert.equal(createAuthAdminRepository(() => null).openDelivery(), null);
  assert.equal(createAuthAdminRepository(() => { throw new Error("Invalid supabaseUrl"); }).openDelivery(), null, "a construction failure means 'not available', before anything is sent");
});

test("auth-admin core: one invite call with the given address and redirect only; no metadata", async () => {
  const f = fakeAdmin();
  assert.deepEqual(await openWith(f.client).inviteUserByEmail("db@x.test", REDIRECT), { kind: "sent", authUserId: USER });
  assert.deepEqual(f.calls, [["invite", "db@x.test", { redirectTo: REDIRECT }]]);
});

test("auth-admin core: refusals classified, no answer = unknown; diagnostics carry name/status/code only and nothing is logged here", async () => {
  const cases = [
    [{ data: { user: null }, error: { name: "AuthApiError", status: 422, code: "email_exists", message: "A user with this email address (secret.person@x.test) has already been registered" } }, { kind: "refused", failure: "already_registered", diagnostic: "AuthApiError status=422 code=email_exists" }],
    [{ data: { user: null }, error: { name: "AuthApiError", status: 429, code: "over_email_send_rate_limit", message: "rate" } }, { kind: "refused", failure: "rate_limited", diagnostic: "AuthApiError status=429 code=over_email_send_rate_limit" }],
    [{ data: { user: null }, error: { name: "AuthRetryableFetchError", status: 0, message: "fetch failed" } }, { kind: "unknown", diagnostic: "AuthRetryableFetchError status=0" }],
    [{ data: { user: null }, error: { name: "AuthApiError", status: 500, code: "unexpected_failure", message: "Error sending invite email" } }, { kind: "unknown", diagnostic: "AuthApiError status=500 code=unexpected_failure" }],
    [{ data: { user: null }, error: null }, { kind: "unknown", diagnostic: "no_user_in_response" }],
  ];
  for (const [response, expected] of cases) {
    const f = fakeAdmin({ invite: async () => response });
    const { result, lines } = await quiet(() => openWith(f.client).inviteUserByEmail("secret.person@x.test", REDIRECT));
    assert.deepEqual(result, expected, JSON.stringify(response.error));
    assert.deepEqual(lines, [], "the repository does not log; the service writes the one traceable line");
  }
  const thrower = fakeAdmin({ invite: async () => { throw new Error("socket hang up secret.person@x.test"); } });
  const { result } = await quiet(() => openWith(thrower.client).inviteUserByEmail("secret.person@x.test", REDIRECT));
  assert.deepEqual(result, { kind: "unknown", diagnostic: "threw Error" });
  assert.doesNotMatch(JSON.stringify(result), /secret\.person|hang up/);
});

test("auth-admin core: recordDelivery calls only record_invitation_delivery; refusals, raised errors and throws (sync or async) become results, never exceptions", async () => {
  const ok = fakeAdmin();
  assert.deepEqual(await openWith(ok.client).recordDelivery(ID, true, USER), { ok: true });
  assert.deepEqual(ok.calls, [["rpc", "record_invitation_delivery", { p_invitation_id: ID, p_sent: true, p_auth_user_id: USER }]]);
  const refused = fakeAdmin({ rpc: async () => ({ data: { ok: false, reason: "auth_user_mismatch" }, error: null }) });
  assert.deepEqual(await openWith(refused.client).recordDelivery(ID, true, USER), { ok: false, reason: "auth_user_mismatch" });
  const raised = fakeAdmin({ rpc: async () => ({ data: null, error: { code: "42501", message: "permission denied for function record_invitation_delivery" } }) });
  assert.deepEqual(await openWith(raised.client).recordDelivery(ID, false, null), { ok: false, reason: "db_error_42501" });
  const asyncThrow = fakeAdmin({ rpc: async () => { throw new Error("network"); } });
  assert.deepEqual(await openWith(asyncThrow.client).recordDelivery(ID, false, null), { ok: false, reason: "threw" });
  const syncThrow = fakeAdmin({ rpc: () => { throw new Error("client exploded"); } });
  assert.deepEqual(await openWith(syncThrow.client).recordDelivery(ID, true, USER), { ok: false, reason: "threw" });
  assert.equal(asyncThrow.calls.length, 1, "no retry");
});

// ---------------------------------------------------------------- service orchestration
function harness(o = {}) {
  const log = [];
  let opened = 0;
  const invitations = {
    createInvitation: async (p) => (log.push(["create", p]), o.create ? o.create(p) : { ok: true, invitationId: ID }),
    beginDelivery: async (id) =>
      (log.push(["begin", id]), o.begin ? o.begin(id) : { ok: true, invitationId: id, email: "db.owned@x.test", expiresAt: "2026-10-09T00:00:00Z", attempt: "initial", resendCount: 0 }),
  };
  const delivery = {
    inviteUserByEmail: async (email, redirect) => (log.push(["invite", email, redirect]), o.invite ? o.invite(email) : { kind: "sent", authUserId: USER }),
    recordDelivery: async (id, sent, user) => (log.push(["record", id, sent, user]), o.record ? o.record(id, sent, user) : { ok: true }),
  };
  const authAdmin = { openDelivery: () => (opened++, (o.configured ?? true) ? delivery : null) };
  const svc = createInvitationsService({
    invitations,
    authAdmin,
    getCurrentUser: async () => (o.user === undefined ? ADMIN : o.user),
    redirectUrl: () => (o.redirect === undefined ? REDIRECT : o.redirect),
    isDemoMode: () => o.demo ?? false,
  });
  return { svc, log, opened: () => opened };
}
const INPUT = { email: "Browser.Typed@x.test", role: "student", fullName: "New Person", studentCode: "NP-1" };

test("service: only active Super Admins; nothing is called otherwise", async () => {
  for (const user of [null, { ...ADMIN, role: "trainer" }, { ...ADMIN, role: "student" }]) {
    const h = harness({ user });
    await assert.rejects(h.svc.inviteUser(INPUT), InvitationsAuthorizationError);
    await assert.rejects(h.svc.resendInvitation(ID), InvitationsAuthorizationError);
    assert.deepEqual(h.log, []);
    assert.equal(h.opened(), 0, "no service-role client is even created");
  }
});

test("service: not configured (no service-role client, unsafe app URL, demo mode) → unavailable before any database call", async () => {
  for (const o of [{ configured: false }, { redirect: null }, { demo: true }]) {
    const { svc, log } = harness(o);
    assert.deepEqual(await svc.inviteUser(INPUT), { kind: "unavailable", invitationId: null, reason: "not_configured" });
    assert.deepEqual(await svc.resendInvitation(ID), { kind: "unavailable", invitationId: ID, reason: "not_configured" });
    assert.deepEqual(log, [], JSON.stringify(o));
  }
});

test("service: happy path — create → begin → invite (database address) → record(sent, Auth user); one client; no log line", async () => {
  const h = harness();
  const { result, lines } = await quiet(() => h.svc.inviteUser(INPUT));
  assert.deepEqual(result, { kind: "sent", invitationId: ID, attempt: "initial" });
  assert.deepEqual(h.log.map((l) => l[0]), ["create", "begin", "invite", "record"]);
  assert.equal(h.log[0][1].email, "Browser.Typed@x.test", "the browser address goes only to create_user_invitation");
  assert.deepEqual(h.log[2], ["invite", "db.owned@x.test", REDIRECT], "Auth receives the address returned by begin_invitation_delivery");
  assert.deepEqual(h.log[3], ["record", ID, true, USER]);
  assert.equal(h.opened(), 1, "one service-role client for the whole operation");
  assert.deepEqual(lines, []);
});

test("service: database refusals stop the sequence before Auth; unknown refusal codes are errors, never passed on", async () => {
  let h = harness({ create: async () => ({ ok: false, reason: "account_exists" }) });
  assert.deepEqual(await h.svc.inviteUser(INPUT), { kind: "refused", stage: "create", reason: "account_exists", invitationId: null });
  assert.deepEqual(h.log.map((l) => l[0]), ["create"]);
  for (const [code, reason] of [["23505", "already_invited"], ["42501", "permission"], ["22023", "invalid"]]) {
    h = harness({ create: async () => { throw new InvitationsFunctionError(code); } });
    assert.deepEqual(await h.svc.inviteUser(INPUT), { kind: "refused", stage: "create", reason, invitationId: null }, code);
  }
  for (const begin of [{ ok: false, reason: "cooldown", retryAfterSeconds: 37 }, { ok: false, reason: "resend_limit" }, { ok: false, reason: "expired" }, { ok: false, reason: "not_pending" }, { ok: false, reason: "not_found" }]) {
    h = harness({ begin: async () => begin });
    const r = await h.svc.resendInvitation(ID);
    assert.deepEqual(r, { kind: "refused", stage: "deliver", reason: begin.reason, invitationId: ID, ...(begin.retryAfterSeconds ? { retryAfterSeconds: 37 } : {}) });
    assert.deepEqual(h.log.map((l) => l[0]), ["begin"], `${begin.reason}: no Auth call`);
  }
  h = harness({ create: async () => ({ ok: false, reason: "some_future_code" }) });
  await quiet(() => assert.rejects(h.svc.inviteUser(INPUT), InvitationsRepositoryError));
  h = harness({ begin: async () => ({ ok: false, reason: "some_future_code" }) });
  await quiet(() => assert.rejects(h.svc.resendInvitation(ID), InvitationsRepositoryError));
  assert.deepEqual(h.log.map((l) => l[0]), ["begin"]);
  h = harness({ begin: async () => { throw new InvitationsRepositoryError(); } });
  await assert.rejects(h.svc.resendInvitation(ID), InvitationsRepositoryError, "unexpected failures surface as an error, not as a sent/failed state");
  h = harness();
  await assert.rejects(h.svc.inviteUser({ ...INPUT, role: "owner" }), InvitationsInputError);
  assert.deepEqual(await h.svc.resendInvitation("not-a-uuid"), { kind: "refused", stage: "deliver", reason: "not_found", invitationId: null });
  assert.deepEqual(h.log, []);
});

test("service: Auth refused → recorded as failed; no answer → nothing recorded; each writes exactly one traceable log line", async () => {
  let h = harness({ invite: async () => ({ kind: "refused", failure: "already_registered", diagnostic: "AuthApiError status=422 code=email_exists" }) });
  let q = await quiet(() => h.svc.resendInvitation(ID));
  assert.deepEqual(q.result, { kind: "delivery_failed", invitationId: ID, reason: "already_registered", recorded: true });
  assert.deepEqual(h.log.at(-1), ["record", ID, false, null]);
  assert.deepEqual(q.lines, [`[invitations] delivery delivery_failed: invitation=${ID} reason=already_registered auth=AuthApiError status=422 code=email_exists recorded=true`]);

  h = harness({ invite: async () => ({ kind: "refused", failure: "rate_limited", diagnostic: "AuthApiError status=429" }), record: async () => ({ ok: false, reason: "threw" }) });
  q = await quiet(() => h.svc.resendInvitation(ID));
  assert.deepEqual(q.result, { kind: "delivery_failed", invitationId: ID, reason: "rate_limited", recorded: false });
  assert.deepEqual(q.lines, [`[invitations] delivery delivery_failed: invitation=${ID} reason=rate_limited auth=AuthApiError status=429 recorded=false record=threw`], "the recording failure is in the same single line");

  h = harness({ invite: async () => ({ kind: "unknown", diagnostic: "AuthRetryableFetchError status=0" }) });
  q = await quiet(() => h.svc.resendInvitation(ID));
  assert.deepEqual(q.result, { kind: "delivery_unknown", invitationId: ID });
  assert.deepEqual(h.log.map((l) => l[0]), ["begin", "invite"], "nothing recorded when Auth gave no answer");
  assert.deepEqual(q.lines, [`[invitations] delivery delivery_unknown: invitation=${ID} auth=AuthRetryableFetchError status=0`]);
});

test("service: CRITICAL — Auth sent but recording failed → sent_unrecorded; exactly one invite, one client, one log line; no compensation", async () => {
  for (const reason of ["threw", "db_error_42501", "auth_user_mismatch", "not_pending", "account_not_invited"]) {
    const h = harness({ record: async () => ({ ok: false, reason }) });
    const { result, lines } = await quiet(() => h.svc.inviteUser(INPUT));
    assert.deepEqual(result, { kind: "sent_unrecorded", invitationId: ID });
    assert.deepEqual(h.log.map((l) => l[0]), ["create", "begin", "invite", "record"], "one invite, one record attempt, nothing else");
    assert.equal(h.opened(), 1);
    assert.deepEqual(lines, [`[invitations] delivery sent_unrecorded: invitation=${ID} record=${reason}`]);
  }
});

test("service: no log line ever contains an address, a raw message or a secret", async () => {
  const outcomes = [
    { invite: async () => ({ kind: "refused", failure: "auth_error", diagnostic: "AuthApiError status=403 code=not_admin" }), record: async () => ({ ok: false, reason: "db_error_42501" }) },
    { invite: async () => ({ kind: "unknown", diagnostic: "threw Error" }) },
    { record: async () => ({ ok: false, reason: "threw" }) },
  ];
  for (const o of outcomes) {
    const { lines } = await quiet(() => harness(o).svc.inviteUser(INPUT));
    assert.equal(lines.length, 1);
    assert.doesNotMatch(lines[0], /@|Browser\.Typed|db\.owned|token|password|service[_ ]role|SUPABASE/i, lines[0]);
    assert.match(lines[0], new RegExp(`invitation=${ID}`));
  }
});

// ---------------------------------------------------------------- static service-role boundary
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
const SRC_FILES = walk(path.join(root, "src")).filter((f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f)).map((f) => path.relative(root, f).split(path.sep).join("/"));
const importersOf = (pattern) => SRC_FILES.filter((f) => pattern.test(src(f)));
/** Source without comments (so documentation that names an API is not mistaken for a use of it). */
const code = (rel) => src(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const importing = (spec) => new RegExp(`from\\s+["'][^"']*${spec}["']`);

test("boundary: only auth-admin.repository.ts imports the service-role client; both are server-only", () => {
  assert.deepEqual(importersOf(importing("lib/supabase/admin")), ["src/repositories/auth-admin.repository.ts"]);
  assert.deepEqual(SRC_FILES.filter((f) => /createSupabaseAdminClient/.test(code(f))).sort(), ["src/lib/supabase/admin.ts", "src/repositories/auth-admin.repository.ts"]);
  for (const f of ["src/lib/supabase/admin.ts", "src/repositories/auth-admin.repository.ts", "src/repositories/invitations.repository.ts", "src/services/invitations.service.ts"]) {
    assert.match(src(f), /^import "server-only";/, `${f} is server-only`);
  }
  assert.deepEqual(importersOf(importing("repositories/auth-admin\\.repository")), ["src/services/invitations.service.ts"], "only the invitations service uses the Auth Admin repository");
  assert.deepEqual(importersOf(importing("auth-admin\\.repository\\.core")).sort(), ["src/repositories/auth-admin.repository.ts", "src/services/invitations.service.core.ts"]);
  const coreImports = src("src/services/invitations.service.core.ts").match(/^import .*["']@\/repositories\/auth-admin\.repository\.core["'];$/gm) ?? [];
  assert.equal(coreImports.length, 1);
  assert.match(coreImports[0], /^import type \{[^}]*\} from/, "the service core only imports types from the Auth Admin core");
});

test("boundary: no client component, hook or browser utility can reach the Auth Admin path", () => {
  const clientFiles = SRC_FILES.filter((f) => /^\s*["']use client["']/.test(src(f)));
  assert.ok(clientFiles.length > 10, "client components found");
  for (const f of clientFiles) {
    assert.doesNotMatch(src(f), /lib\/supabase\/admin|auth-admin\.repository|invitations\.service|invitations\.repository|SUPABASE_SERVICE_ROLE_KEY/, f);
  }
  for (const f of SRC_FILES.filter((f) => f.startsWith("src/hooks/") || f.startsWith("src/utils/") || f.startsWith("src/components/") || f === "src/lib/supabase/client.ts")) {
    assert.doesNotMatch(src(f), /lib\/supabase\/admin|auth-admin\.repository|SUPABASE_SERVICE_ROLE_KEY/, f);
  }
});

test("boundary: SUPABASE_SERVICE_ROLE_KEY is read only in src/lib/supabase/admin.ts and never as a NEXT_PUBLIC_ variable", () => {
  assert.deepEqual(importersOf(/SUPABASE_SERVICE_ROLE_KEY/), ["src/lib/supabase/admin.ts"]);
  assert.deepEqual(importersOf(/NEXT_PUBLIC_[A-Z_]*SERVICE/), []);
});

test("boundary: the Auth Admin core does only invite + record; the session repository only create + begin", () => {
  const admin = code("src/repositories/auth-admin.repository.core.ts");
  assert.deepEqual(Array.from(admin.matchAll(/\.rpc\(\s*["']([a-z_]+)["']/g), (m) => m[1]), ["record_invitation_delivery"]);
  assert.deepEqual(Array.from(admin.matchAll(/auth\.admin\.([a-zA-Z]+)\(/g), (m) => m[1]), ["inviteUserByEmail"]);
  assert.doesNotMatch(admin, /\.from\(|deleteUser|updateUserById|createUser|generateLink|signOut|listUsers|user_metadata|data:\s*\{/);
  const session = code("src/repositories/invitations.repository.core.ts");
  assert.deepEqual(Array.from(session.matchAll(/\.rpc\(\s*["']([a-z_]+)["']/g), (m) => m[1]).sort(), ["begin_invitation_delivery", "create_user_invitation"]);
  assert.doesNotMatch(session, /\.from\(|lib\/supabase\/admin|auth\.admin/);
  const service = code("src/services/invitations.service.core.ts");
  assert.doesNotMatch(service, /\.rpc\(|\.from\(|lib\/supabase\/|auth\.admin/, "the service only sequences repository calls");
});

/**
 * Transitive proof (no build needed): follow every static import from every "use client" module.
 * Edges into "use server" modules stop there — Next.js turns those into RPC stubs and never bundles
 * their imports for the browser. Nothing reachable from client code may be (or import) a server-only
 * invitation module, the admin client, or read the service-role key.
 */
test("boundary (transitive): nothing reachable from client code can pull in the admin client, the Auth Admin path or the service-role key", () => {
  const exts = [".ts", ".tsx", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx"];
  const resolve = (from, spec) => {
    let base;
    if (spec.startsWith("@/")) base = path.join(root, "src", spec.slice(2));
    else if (spec.startsWith(".")) base = path.resolve(path.dirname(path.join(root, from)), spec);
    else return null; // packages
    for (const e of ["", ...exts]) {
      const p = base + e;
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return path.relative(root, p).split(path.sep).join("/");
    }
    return null;
  };
  const importsOf = (rel) =>
    Array.from(code(rel).matchAll(/(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g), (m) => m[1] ?? m[2])
      .map((s) => resolve(rel, s))
      .filter(Boolean);
  const isServerAction = (rel) => /^\s*["']use server["']/.test(src(rel));
  const roots = SRC_FILES.filter((f) => /^\s*["']use client["']/.test(src(f)));
  const reachable = new Set();
  const stack = [...roots];
  while (stack.length) {
    const f = stack.pop();
    if (reachable.has(f)) continue;
    reachable.add(f);
    if (isServerAction(f)) continue; // RPC boundary
    for (const next of importsOf(f)) if (!reachable.has(next)) stack.push(next);
  }
  assert.ok(reachable.size > roots.length, "the walk followed imports");
  const forbidden = [
    "src/lib/supabase/admin.ts",
    "src/repositories/auth-admin.repository.ts",
    "src/repositories/auth-admin.repository.core.ts",
    "src/repositories/invitations.repository.ts",
    "src/services/invitations.service.ts",
  ];
  for (const f of forbidden) assert.equal(reachable.has(f), false, `${f} is reachable from client code`);
  const browserReachable = [...reachable].filter((f) => !isServerAction(f));
  for (const f of browserReachable) assert.doesNotMatch(code(f), /SUPABASE_SERVICE_ROLE_KEY|createSupabaseAdminClient/, `${f} (client-reachable) touches the service role`);
});
