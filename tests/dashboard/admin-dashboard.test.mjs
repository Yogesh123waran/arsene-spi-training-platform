// Super Admin dashboard (D1) — pure rules, the repository against a recording fake Supabase client,
// and the service with fake dependencies: India-time "today", attention facts, count queries (no row
// transfer), bounded and keyset-paged reads, Super Admin only, independent sections, no private fields.
import { test } from "node:test";
import assert from "node:assert/strict";

const build = process.env.DASHBOARD_BUILD;
const lib = await import(`${build}/lib/dashboard/admin-dashboard.mjs`);
const { createDashboardRepository, DashboardRepositoryError } = await import(`${build}/repositories/dashboard.repository.core.mjs`);
const { createAdminDashboardService, DashboardAuthorizationError } = await import(`${build}/services/dashboard.service.core.mjs`);

const quiet = async (fn) => {
  const saved = console.error;
  console.error = () => {};
  try { return await fn(); } finally { console.error = saved; }
};

// ---------------------------------------------------------------- a recording fake Supabase client

function fakeClient(handler) {
  const calls = [];
  const client = {
    from(table) {
      const call = { table, ops: [] };
      calls.push(call);
      const record = (name) => (...args) => { call.ops.push([name, ...args]); return b; };
      const refuse = (name) => () => { throw new Error(`write: ${name}`); };
      const b = {
        select: record("select"), eq: record("eq"), in: record("in"), gt: record("gt"), order: record("order"), limit: record("limit"),
        insert: refuse("insert"), update: refuse("update"), upsert: refuse("upsert"), delete: refuse("delete"),
        then(resolve, reject) { return Promise.resolve().then(() => handler(call)).then(resolve, reject); },
      };
      return b;
    },
    rpc() { throw new Error("rpc not allowed"); },
  };
  return { client, calls };
}
const op = (call, name) => call.ops.filter((o) => o[0] === name).map((o) => o.slice(1));

// ---------------------------------------------------------------- pure rules

test("India time: 'today' is the Asia/Kolkata date, not the UTC date", () => {
  assert.equal(lib.indiaDate(new Date("2026-10-05T18:29:59Z")), "2026-10-05", "23:59:59 IST");
  assert.equal(lib.indiaDate(new Date("2026-10-05T18:30:00Z")), "2026-10-06", "midnight IST");
  const lateUtc = new Date("2026-10-05T20:00:00Z");
  assert.equal(lateUtc.toISOString().slice(0, 10), "2026-10-05", "the old UTC computation");
  assert.equal(lib.indiaDate(lateUtc), "2026-10-06", "India is already on the next day");
});

test("attention items: only non-zero facts, fixed order, short reason and an internal descriptive link; none → empty", () => {
  const zero = { unavailableTrainer: 0, fullUpcoming: 0, pendingCompletions: 0, invitedAccounts: 0, suspendedAccounts: 0, missingRecords: 0 };
  assert.deepEqual(lib.buildAttentionItems(zero), []);
  const items = lib.buildAttentionItems({ ...zero, unavailableTrainer: 2, pendingCompletions: 1, suspendedAccounts: 3, missingRecords: 1 });
  assert.deepEqual(items.map((i) => [i.key, i.count]), [["unavailable_trainer", 2], ["pending_completions", 1], ["suspended_accounts", 3], ["missing_records", 1]]);
  assert.deepEqual(items.map((i) => i.href), ["/admin/batches", "/admin/certificates", "/admin/users?status=suspended", "/admin/users?record=missing"]);
  assert.equal(items[0].title, "Batches without an available trainer");
  assert.equal(items[1].title, "Completion awaiting approval");
  for (const i of items) {
    assert.ok(i.reason.length > 10 && i.linkLabel.length > 5, i.key);
    assert.match(i.href, /^\/admin\//, "internal link");
    assert.doesNotMatch(i.linkLabel, /^(view|click here|more)$/i, "descriptive link text");
  }
  const all = lib.buildAttentionItems({ unavailableTrainer: 1, fullUpcoming: 1, pendingCompletions: 1, invitedAccounts: 1, suspendedAccounts: 1, missingRecords: 1 });
  assert.equal(all.length, 6);
  assert.equal(all.find((i) => i.key === "invited_accounts").href, "/admin/users?status=invited");
  assert.ok(!all.some((i) => /risk|attendance|overdue|performance/i.test(i.title + i.reason)), "no D3 items");
});

test("current batches: trainer availability uses the batches-page rule; only full UPCOMING batches; course activity sorted and bounded", () => {
  const b = (id, extra) => ({ id, status: "ongoing", maxSeats: 10, trainerId: "t", courseId: "c1", course: "Valves", trainerStatus: "active", trainerRole: "trainer", trainerAccountStatus: "active", seatsUsed: 0, ...extra });
  const facts = lib.summarizeCurrentBatches([
    b("1"),
    b("2", { trainerAccountStatus: "suspended" }),
    b("3", { trainerStatus: "inactive" }),
    b("4", { trainerId: null, trainerStatus: undefined, trainerRole: undefined, trainerAccountStatus: undefined }),
    b("5", { status: "upcoming", seatsUsed: 10, courseId: "c2", course: "Piping" }),
    b("6", { status: "ongoing", seatsUsed: 10, courseId: "c2", course: "Piping" }),
    b("7", { status: "upcoming", seatsUsed: 9, courseId: "c3", course: "Instruments" }),
  ]);
  assert.equal(facts.unavailableTrainer, 2, "suspended account + inactive trainer; no trainer assigned is not 'unavailable'");
  assert.equal(facts.fullUpcoming, 1, "an ongoing full batch is not counted");
  assert.deepEqual(facts.courses.map((c) => [c.course, c.currentBatches]), [["Valves", 4], ["Piping", 2], ["Instruments", 1]]);
  assert.equal(facts.coursesWithCurrentBatches, 3);
  const many = lib.summarizeCurrentBatches(Array.from({ length: 9 }, (_, i) => b(String(i), { courseId: `c${i}`, course: `Course ${i}` })));
  assert.equal(many.courses.length, lib.COURSE_ACTIVITY_LIMIT);
  assert.equal(many.coursesWithCurrentBatches, 9);
});

test("small helpers: database time → HH:MM; test state mirrors test_effective_status for published tests", () => {
  assert.equal(lib.shortTime("09:30:00"), "09:30");
  assert.equal(lib.shortTime(null), "");
  const now = new Date("2026-10-06T10:00:00Z");
  assert.equal(lib.testState("active", null, now), "open");
  assert.equal(lib.testState("scheduled", "2026-10-06T09:00:00Z", now), "open");
  assert.equal(lib.testState("scheduled", "2026-10-07T09:00:00Z", now), "scheduled");
});

// ---------------------------------------------------------------- repository (fake client)

test("repository: totals are exact HEAD counts (no rows transferred) with the documented filters", async () => {
  const { client, calls } = fakeClient(() => ({ count: 7, data: null, error: null }));
  const repo = createDashboardRepository(async () => client);
  assert.equal(await repo.countActiveAccounts("student"), 7);
  assert.equal(await repo.countActiveAccounts("trainer"), 7);
  assert.deepEqual(await repo.countBatchesByStatus(), { upcoming: 7, ongoing: 7, completed: 7, cancelled: 7 });
  assert.equal(await repo.countClassesOn("2026-10-06"), 7);
  assert.equal(await repo.countCompletionsAwaitingApproval(), 7);
  for (const c of calls) assert.deepEqual(op(c, "select")[0], ["id", { count: "exact", head: true }], `${c.table}: head count`);
  assert.deepEqual(calls.slice(0, 2).map((c) => [c.table, op(c, "eq")]), [
    ["profiles", [["role", "student"], ["account_status", "active"]]],
    ["profiles", [["role", "trainer"], ["account_status", "active"]]],
  ]);
  assert.deepEqual(calls.slice(2, 6).map((c) => op(c, "eq")[0]), [["status", "upcoming"], ["status", "ongoing"], ["status", "completed"], ["status", "cancelled"]]);
  assert.deepEqual([calls[6].table, op(calls[6], "eq"), op(calls[6], "in")], ["classes", [["class_date", "2026-10-06"]], [["status", ["scheduled", "live", "completed"]]]], "today: not cancelled");
  assert.deepEqual([calls[7].table, op(calls[7], "eq")], ["completion_records", [["status", "recommended"]]]);
});

test("repository: current batches are read page by page on the id until an empty page; seats exclude withdrawn and duplicates", async () => {
  const page1 = [
    {
      id: "a", status: "upcoming", max_seats: 2, trainer_id: "t1", course_id: "c1", courses: { title: "Valves" },
      trainers: { status: "active", profiles: { role: "trainer", account_status: "suspended" } },
      batch_students: [{ student_id: "s1", enrollment_status: "enrolled" }, { student_id: "s2", enrollment_status: "withdrawn" }, { student_id: "s3", enrollment_status: "completed" }],
    },
    { id: "b", status: "ongoing", max_seats: 5, trainer_id: null, course_id: "c2", courses: null, trainers: null, batch_students: [] },
  ];
  const { client, calls } = fakeClient((call) => ({ data: op(call, "gt").length ? [] : page1, error: null }));
  const rows = await createDashboardRepository(async () => client).listCurrentBatches();
  assert.equal(calls.length, 2, "first page, then an empty page");
  assert.deepEqual(op(calls[0], "in"), [["status", ["upcoming", "ongoing"]]]);
  assert.deepEqual(op(calls[0], "order"), [["id"]]);
  assert.deepEqual(op(calls[1], "gt"), [["id", "b"]], "keyset: after the last id");
  assert.ok(op(calls[0], "limit")[0][0] > 0);
  assert.deepEqual(rows.map((r) => [r.id, r.seatsUsed, r.course, r.trainerAccountStatus]), [["a", 2, "Valves", "suspended"], ["b", 0, "", undefined]]);
});

test("repository: lists are bounded and ordered — today's classes, upcoming classes (date, then time), upcoming tests", async () => {
  const { client, calls } = fakeClient((call) => ({
    data: call.table === "classes"
      ? [{ id: "k1", title: "Valve sizing", class_date: "2026-10-06", start_time: "09:00:00", end_time: "10:00:00", status: "scheduled", class_type: "online", batches: { name: "B1" } }]
      : [{ id: "x1", title: "Quiz 1", test_type: "quiz", status: "scheduled", available_from: "2026-10-07T04:00:00Z", available_until: "2026-10-07T06:00:00Z", classes: { batches: [{ name: "B2" }] } }],
    error: null,
  }));
  const repo = createDashboardRepository(async () => client);
  const today = await repo.listClassesOn("2026-10-06", 10);
  const upcoming = await repo.listUpcomingClasses("2026-10-06", 8);
  const tests = await repo.listUpcomingTests("2026-10-06T10:00:00.000Z", 8);
  assert.deepEqual([op(calls[0], "eq"), op(calls[0], "in"), op(calls[0], "order"), op(calls[0], "limit")], [[["class_date", "2026-10-06"]], [["status", ["scheduled", "live", "completed"]]], [["start_time"]], [[10]]]);
  assert.deepEqual([op(calls[1], "gt"), op(calls[1], "eq"), op(calls[1], "order"), op(calls[1], "limit")], [[["class_date", "2026-10-06"]], [["status", "scheduled"]], [["class_date"], ["start_time"]], [[8]]]);
  assert.deepEqual([calls[2].table, op(calls[2], "in"), op(calls[2], "gt"), op(calls[2], "order"), op(calls[2], "limit")], ["tests", [["status", ["scheduled", "active"]]], [["available_until", "2026-10-06T10:00:00.000Z"]], [["available_from"]], [[8]]]);
  assert.equal(today[0].batch_name, "B1");
  assert.equal(upcoming.length, 1);
  assert.equal(tests[0].batch_name, "B2", "embedded arrays are flattened");
  // D1 Dev regression: tests has no foreign key to batches (PostgREST PGRST200) — the batch comes through the class.
  const testSelect = op(calls[2], "select")[0][0];
  assert.match(testSelect, /classes \( batches \( name \) \)/);
  assert.doesNotMatch(testSelect.replace(/classes \( batches \( name \) \)/, ""), /batches/, "no direct tests → batches embed");
  for (const c of calls) assert.doesNotMatch(op(c, "select")[0][0], /email|phone|student_details|trainer_details/, "no contact data selected");
});

test("repository: errors and a missing client become the generic repository error (logged by code only); nothing is ever written", async () => {
  const failing = fakeClient(() => ({ data: null, count: null, error: { code: "42501", message: "secret detail" } }));
  const logged = [];
  const saved = console.error;
  console.error = (...a) => logged.push(a.join(" "));
  try {
    await assert.rejects(createDashboardRepository(async () => failing.client).countActiveAccounts("student"), DashboardRepositoryError);
    await assert.rejects(createDashboardRepository(async () => failing.client).listClassesOn("2026-10-06", 10), DashboardRepositoryError);
    await assert.rejects(createDashboardRepository(async () => null).countBatchesByStatus(), DashboardRepositoryError);
    const noCount = fakeClient(() => ({ data: null, count: null, error: null }));
    await assert.rejects(createDashboardRepository(async () => noCount.client).countClassesOn("2026-10-06"), DashboardRepositoryError, "a missing count is an error, never 0");
  } finally {
    console.error = saved;
  }
  assert.ok(logged.every((l) => !l.includes("secret detail")), "raw messages are never logged");
  const repo = createDashboardRepository(async () => fakeClient(() => ({ data: [], count: 0, error: null })).client);
  assert.deepEqual(Object.keys(repo).sort(), ["countActiveAccounts", "countBatchesByStatus", "countClassesOn", "countCompletionsAwaitingApproval", "listClassesOn", "listCompletionStatusEventsAfter", "listCurrentBatches", "listUpcomingClasses", "listUpcomingTests"], "reads only");
});

test("repository: completion status events after an instant — the four status types, ids and statuses only, bounded below the response cap", async () => {
  const rows = [
    { id: 11, completion_id: "c1", detail: { status: "approved", previous_status: "recommended", completion_date: "2026-10-01" } },
    { id: 12, completion_id: "c2", detail: { status: "recommended", previous_status: null } },
    { id: 13, completion_id: null, detail: {} },
  ];
  const { client, calls } = fakeClient(() => ({ data: rows, error: null }));
  const events = await createDashboardRepository(async () => client).listCompletionStatusEventsAfter("2026-09-28T20:00:00.000Z");
  assert.deepEqual(events, [
    { id: 11, completionId: "c1", status: "approved", previousStatus: "recommended" },
    { id: 12, completionId: "c2", status: "recommended", previousStatus: null },
  ], "rows without a completion are ignored; nothing else is passed on");
  const c = calls[0];
  assert.equal(c.table, "completion_events");
  assert.deepEqual(op(c, "select")[0], ["id, completion_id, detail"], "no actor, batch or student ids");
  assert.deepEqual(op(c, "in"), [["event_type", ["recommended", "recommendation_withdrawn", "approved", "rejected"]]]);
  assert.deepEqual(op(c, "gt"), [["occurred_at", "2026-09-28T20:00:00.000Z"]]);
  assert.deepEqual(op(c, "order"), [["id"]]);
  const [[limit]] = op(c, "limit");
  assert.ok(limit <= 1000, "cap + 1 fits in one PostgREST response");
  const tooMany = fakeClient(() => ({ data: Array.from({ length: limit }, (_, i) => ({ id: i, completion_id: "c", detail: {} })), error: null }));
  await quiet(() => assert.rejects(createDashboardRepository(async () => tooMany.client).listCompletionStatusEventsAfter("2026-09-28T20:00:00.000Z"), DashboardRepositoryError, "over the cap → refused, never truncated"));
  const { client: c2, calls: calls2 } = fakeClient((call) => ({ data: op(call, "gt").length ? [] : [], error: null }));
  await createDashboardRepository(async () => c2).listCurrentBatches();
  assert.match(op(calls2[0], "select")[0][0], /\bstart_date\b/, "current batches carry their start date (capacity health)");
});

test("service: a comparison that can't be read is left out (null) — its KPI and every other section still load", async () => {
  const boom = async () => { throw new Error("x"); };
  const d = await quiet(() => service({ repo: fakeRepo({ listCompletionStatusEventsAfter: boom, countClassesOn: async (date) => { if (date === "2026-09-29") throw new Error("x"); return 5; } }).repo }).getDashboard());
  assert.equal(d.metrics.status, "ok");
  assert.equal(d.metrics.data.classesToday, 5);
  assert.deepEqual(d.metrics.data.comparisons, { classesToday: null, completionsAwaitingApproval: null });
  assert.equal(d.health.status, "ok");
  const real = await service({ repo: fakeRepo({
    countClassesOn: async (date) => (date === "2026-10-06" ? 3 : 0),
    listCompletionStatusEventsAfter: async () => [{ id: 1, completionId: "a", previousStatus: "recommended", status: "approved" }],
  }).repo }).getDashboard();
  assert.deepEqual(real.metrics.data.comparisons.classesToday, { current: 3, previous: 0, difference: 3, percent: null, direction: "up", label: "vs same day last week" }, "no % from zero");
  assert.deepEqual(real.metrics.data.comparisons.completionsAwaitingApproval, { current: 2, previous: 3, difference: -1, percent: -33.3, direction: "down", label: "vs 7 days ago" });
});

test("service: health fails with its section only; no current batches → healthy lines with the reason", async () => {
  const empty = await service({ repo: fakeRepo({ listCurrentBatches: async () => [] }).repo }).getDashboard();
  assert.deepEqual(empty.health.data.map((h) => [h.status, h.reason]), [["healthy", "No upcoming or ongoing batches."], ["healthy", "No upcoming batch is full."]]);
  const down = await quiet(() => service({ repo: fakeRepo({ listCurrentBatches: async () => { throw new Error("x"); } }).repo }).getDashboard());
  assert.deepEqual(down.health, { status: "error" });
  assert.equal(down.metrics.status, "ok", "isolated");
});

// ---------------------------------------------------------------- service (fake dependencies)

const NOW = new Date("2026-10-05T20:00:00Z"); // 01:30 on 6 Oct in India
const admin = { id: "a1", email: "admin@x.test", fullName: "Admin", role: "admin", isActive: true, createdAt: "2026-01-01" };

function fakeRepo(overrides = {}) {
  const calls = [];
  const rec = (name, value) => async (...args) => { calls.push([name, ...args]); return typeof value === "function" ? value(...args) : value; };
  const repo = {
    countActiveAccounts: rec("countActiveAccounts", (role) => (role === "student" ? 120 : 9)),
    countBatchesByStatus: rec("countBatchesByStatus", { upcoming: 3, ongoing: 4, completed: 10, cancelled: 1 }),
    countClassesOn: rec("countClassesOn", 12),
    countCompletionsAwaitingApproval: rec("countCompletionsAwaitingApproval", 2),
    listCurrentBatches: rec("listCurrentBatches", [
      { id: "b1", status: "upcoming", maxSeats: 1, startDate: "2026-10-08", trainerId: "t1", courseId: "c1", course: "Valves", trainerStatus: "active", trainerRole: "trainer", trainerAccountStatus: "suspended", seatsUsed: 1 },
    ]),
    listCompletionStatusEventsAfter: rec("listCompletionStatusEventsAfter", []),
    listClassesOn: rec("listClassesOn", [{ id: "k1", title: "Valve sizing", class_date: "2026-10-06", start_time: "09:00:00", end_time: "10:30:00", status: "scheduled", class_type: "online", batch_name: "B1" }]),
    listUpcomingClasses: rec("listUpcomingClasses", []),
    listUpcomingTests: rec("listUpcomingTests", [{ id: "x1", title: "Quiz", test_type: "quiz", status: "scheduled", available_from: "2026-10-07T04:00:00Z", available_until: "2026-10-07T06:00:00Z", batch_name: "B1" }]),
    ...overrides,
  };
  return { repo, calls };
}

const performance = {
  role: "admin",
  metrics: { testAverage: 71.5, releasedResults: 40, passedResults: 30, passRate: 75, attendancePercent: 88.2, attendanceMarked: 300, attendanceAttended: 265, assignmentAverage: null, assignmentsScored: 0 },
  trend: [{ testId: "x", title: "Quiz A", date: "2026-09-01", averagePercent: 70 }, { testId: "y", title: "Quiz B", date: "2026-09-08", averagePercent: 73 }],
  modules: [{ moduleId: "m", title: "Secret module", percent: 10, answers: 4 }],
  strongModules: [],
  weakModules: ["Secret module"],
  studentResults: null,
  filters: { batches: [{ value: "b", label: "Hidden filter" }] },
  scopeLabel: "All batches",
};
const feed = {
  unreadCount: 1,
  notifications: [{ id: "n1", type: "test_published", title: "Test available", body: "Quiz in B1", link: "/admin/tests/x1", entityType: "test", createdAt: "2026-10-05T10:00:00Z", readAt: null }],
};

const completionBatches = [
  { id: "b1", batchCode: "B-1", name: "Batch One", status: "ongoing", startDate: "2026-01-01", endDate: "2026-12-31", courseCode: "C1", courseTitle: "Valves", trainerName: "T One", counts: { recommended: 1, approved: 2, issued: 0, revoked: 0 } },
  { id: "b2", batchCode: "B-2", name: "Batch Two", status: "completed", startDate: "2026-01-01", endDate: "2026-06-30", courseCode: "C2", courseTitle: "Piping", trainerName: null, counts: { recommended: 0, approved: 5, issued: 5, revoked: 0 } },
];

function service({ user = admin, repo = fakeRepo().repo, accounts = async () => ({ invited: 2, suspended: 0, missingRecord: 1 }), perf = async () => performance, notes = async () => feed, completions = async () => completionBatches } = {}) {
  return createAdminDashboardService({ repository: repo, getCurrentUser: async () => user, getAccountTotals: accounts, getPerformance: perf, getNotifications: notes, getCompletionBatches: completions, now: () => NOW });
}

test("service: only a Super Admin — signed out, trainer and student are refused before any read", async () => {
  for (const user of [null, { ...admin, role: "trainer" }, { ...admin, role: "student" }]) {
    const { repo, calls } = fakeRepo();
    let otherReads = 0;
    const s = createAdminDashboardService({
      repository: repo, getCurrentUser: async () => user,
      getAccountTotals: async () => { otherReads++; return { invited: 0, suspended: 0, missingRecord: 0 }; },
      getPerformance: async () => { otherReads++; return null; },
      getNotifications: async () => { otherReads++; return null; },
      getCompletionBatches: async () => { otherReads++; return null; },
      now: () => NOW,
    });
    await assert.rejects(s.getDashboard(), DashboardAuthorizationError, String(user?.role));
    assert.equal(calls.length + otherReads, 0, "nothing read");
  }
});

test("service: the dashboard read model from real-shaped data — India 'today', counts, attention, bounded lists, performance summary, activity", async () => {
  const { repo, calls } = fakeRepo();
  const d = await service({ repo }).getDashboard();
  assert.equal(d.today, "2026-10-06", "India date, not the UTC date");
  assert.ok(calls.some((c) => c[0] === "countClassesOn" && c[1] === "2026-10-06"));
  assert.ok(calls.some((c) => c[0] === "listClassesOn" && c[1] === "2026-10-06" && c[2] === lib.TODAY_CLASS_LIMIT));
  assert.ok(calls.some((c) => c[0] === "listUpcomingClasses" && c[1] === "2026-10-06" && c[2] === lib.UPCOMING_CLASS_LIMIT));
  assert.ok(calls.some((c) => c[0] === "listUpcomingTests" && c[1] === NOW.toISOString() && c[2] === lib.UPCOMING_TEST_LIMIT));
  for (const name of ["countBatchesByStatus", "countCompletionsAwaitingApproval", "listCurrentBatches", "listCompletionStatusEventsAfter"]) {
    assert.equal(calls.filter((c) => c[0] === name).length, 1, `${name} read once and shared`);
  }
  assert.deepEqual(calls.filter((c) => c[0] === "countClassesOn").map((c) => c[1]).sort(), ["2026-09-29", "2026-10-06"], "today, and the same India weekday last week — each once");
  assert.ok(calls.some((c) => c[0] === "listCompletionStatusEventsAfter" && c[1] === "2026-09-28T20:00:00.000Z"), "exactly 7 × 24 h before now");
  assert.deepEqual(d.metrics, {
    status: "ok",
    data: {
      activeStudents: 120, activeTrainers: 9, ongoingBatches: 4, upcomingBatches: 3, classesToday: 12, completionsAwaitingApproval: 2,
      comparisons: {
        classesToday: { current: 12, previous: 12, difference: 0, percent: 0, direction: "same", label: "vs same day last week" },
        completionsAwaitingApproval: { current: 2, previous: 2, difference: 0, percent: 0, direction: "same", label: "vs 7 days ago" },
      },
    },
  }, "comparisons only on the two KPIs with real history (Q5)");
  assert.deepEqual(d.health, {
    status: "ok",
    data: [
      { key: "trainer_coverage", label: "Trainer coverage", status: "attention", reason: "1 with an unavailable trainer (of 1 upcoming and ongoing).", href: "/admin/batches", linkLabel: "Review batch trainers" },
      { key: "batch_capacity", label: "Batch capacity", status: "attention", reason: "1 full upcoming batch starts within 7 days.", href: "/admin/batches", linkLabel: "Review upcoming batches" },
    ],
  });
  assert.deepEqual(d.attention.data.map((i) => [i.key, i.count]), [["unavailable_trainer", 1], ["full_upcoming", 1], ["pending_completions", 2], ["invited_accounts", 2], ["missing_records", 1]]);
  assert.deepEqual(d.todayClasses.data, { total: 12, classes: [{ id: "k1", title: "Valve sizing", date: "2026-10-06", startTime: "09:00", endTime: "10:30", status: "scheduled", classType: "online", batchName: "B1" }] });
  assert.deepEqual(d.upcomingClasses, { status: "ok", data: [] });
  assert.deepEqual(d.upcomingTests.data.map((t) => [t.id, t.state]), [["x1", "scheduled"]]);
  assert.deepEqual(d.overview.data, { batches: { upcoming: 3, ongoing: 4, completed: 10, cancelled: 1 }, courses: [{ courseId: "c1", course: "Valves", currentBatches: 1 }], coursesWithCurrentBatches: 1 });
  assert.deepEqual(d.performance.data, {
    scopeLabel: "All batches", testAverage: 71.5, passRate: 75, releasedResults: 40, attendancePercent: 88.2, attendanceMarked: 300, assignmentAverage: null, assignmentsScored: 0,
    trend: [{ label: "1", title: "Quiz A", value: 70 }, { label: "2", title: "Quiz B", value: 73 }],
    topics: [{ moduleId: "m", title: "Secret module", percent: 10, answers: 4, band: "weak" }],
    topicsAssessed: 1,
    weakTopics: 1,
  }, "summary figures and module scores from the performance service only; no invented overall score");
  assert.deepEqual(d.activity.data, { unreadCount: 1, items: [{ id: "n1", title: "Test available", body: "Quiz in B1", createdAt: "2026-10-05T10:00:00Z", link: "/admin/tests/x1", unread: true }] });
  assert.deepEqual(d.approvals, {
    status: "ok",
    data: { total: 2, batches: [{ batchId: "b1", batchCode: "B-1", batchName: "Batch One", course: "Valves", trainerName: "T One", recommended: 1 }], batchesWithPending: 1 },
  }, "the database count as the total; only batches with pending recommendations listed");
  const json = JSON.stringify(d);
  assert.doesNotMatch(json, /email|phone|admin@x\.test|Hidden filter|trend%|overall|lastMonth/i, "no private fields, no filter detail, no overall score");
  assert.deepEqual(Object.keys(d.metrics.data.comparisons), ["classesToday", "completionsAwaitingApproval"], "D2a: comparisons only where history is real (Q5)");
});

test("weak topics: the performance page's bands; weakest first; bounded; nothing invented when there are no module results", () => {
  assert.deepEqual([64.99, 65, 79.99, 80].map(lib.topicBand), ["weak", "developing", "developing", "strong"]);
  const modules = Array.from({ length: 8 }, (_, i) => ({ moduleId: `m${i}`, title: `Module ${i}`, percent: 90 - i * 7, answers: 10 + i }));
  const topics = lib.weakestTopics(modules);
  assert.equal(topics.length, lib.WEAK_TOPIC_LIMIT);
  assert.deepEqual(topics.map((t) => t.moduleId), ["m7", "m6", "m5", "m4", "m3"]);
  assert.deepEqual(topics.map((t) => t.band), ["weak", "weak", "weak", "weak", "developing"], "41, 48, 55, 62 % → weak; 69 % → developing");
  assert.deepEqual(lib.weakestTopics([]), []);
  assert.deepEqual(lib.weakestTopics([{ moduleId: "x", title: "X", percent: Number.NaN, answers: 1 }]), [], "no number → not shown");
});

test("pending approvals: only batches with recommendations, most first, bounded; the total comes from the database count", async () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({ id: `b${i}`, batchCode: `B${i}`, name: `Batch ${i}`, courseTitle: "C", trainerName: null, counts: { recommended: i % 2 === 0 ? i : 0 } }));
  const r = lib.pendingApprovalBatches(rows);
  assert.deepEqual(r.batches.map((b) => [b.batchId, b.recommended]), [["b6", 6], ["b4", 4], ["b2", 2]]);
  assert.equal(r.batchesWithPending, 3, "b0 has 0 recommendations");
  const many = lib.pendingApprovalBatches(Array.from({ length: 9 }, (_, i) => ({ id: `b${i}`, batchCode: "", name: `N${i}`, courseTitle: "", trainerName: null, counts: { recommended: 1 } })));
  assert.equal(many.batches.length, lib.PENDING_APPROVAL_LIMIT);
  assert.equal(many.batchesWithPending, 9);
  await quiet(async () => {
    const down = await service({ completions: async () => { throw new Error("x"); } }).getDashboard();
    assert.deepEqual(down.approvals, { status: "error" });
    assert.equal(down.metrics.status, "ok", "isolated");
    const demo = await service({ completions: async () => null }).getDashboard();
    assert.deepEqual(demo.approvals, { status: "error" }, "no data (demo mode) is not shown as zero");
  });
});

test("service: nothing to act on → no attention items (the page hides the section); empty lists stay empty", async () => {
  const { repo } = fakeRepo({
    countCompletionsAwaitingApproval: async () => 0,
    listCurrentBatches: async () => [],
    listClassesOn: async () => [],
    listUpcomingTests: async () => [],
    countClassesOn: async () => 0,
  });
  const d = await service({ repo, accounts: async () => ({ invited: 0, suspended: 0, missingRecord: 0 }), notes: async () => ({ unreadCount: 0, notifications: [] }) }).getDashboard();
  assert.deepEqual(d.attention, { status: "ok", data: [] });
  assert.deepEqual(d.todayClasses, { status: "ok", data: { total: 0, classes: [] } });
  assert.deepEqual(d.upcomingTests, { status: "ok", data: [] });
  assert.deepEqual(d.activity, { status: "ok", data: { unreadCount: 0, items: [] } });
  assert.deepEqual(d.overview.data.courses, []);
});

test("service: sections fail independently with a fixed error state; a shared read failing affects only the sections that use it", async () => {
  const boom = async () => { throw new Error("db down: secret"); };
  const logged = [];
  const saved = console.error;
  console.error = (...a) => logged.push(a.join(" "));
  let d;
  try {
    d = await service({ repo: fakeRepo({ countBatchesByStatus: boom, listUpcomingTests: boom }).repo, perf: async () => null, notes: boom }).getDashboard();
  } finally {
    console.error = saved;
  }
  assert.deepEqual(d.metrics, { status: "error" }, "uses the batch counts");
  assert.deepEqual(d.overview, { status: "error" }, "uses the batch counts");
  assert.deepEqual(d.upcomingTests, { status: "error" });
  assert.deepEqual(d.performance, { status: "error" }, "no performance data (e.g. demo mode)");
  assert.deepEqual(d.activity, { status: "error" });
  assert.equal(d.attention.status, "ok");
  assert.equal(d.todayClasses.status, "ok");
  assert.equal(d.upcomingClasses.status, "ok");
  assert.ok(logged.length > 0 && logged.every((l) => !l.includes("secret")), "logged by error name only");
  await quiet(async () => {
    const accountsDown = await service({ accounts: boom }).getDashboard();
    assert.deepEqual(accountsDown.attention, { status: "error" });
    assert.equal(accountsDown.metrics.status, "ok");
  });
});
