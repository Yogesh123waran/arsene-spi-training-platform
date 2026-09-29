// A minimal stand-in for the Supabase JS client, executing against a local
// PostgreSQL through psql. Each request runs in its own session as the
// given role ("authenticated" / "anon") with request.jwt.claims set, so RLS,
// grants and the 0013 functions behave as they do behind PostgREST.
// Supports exactly what question-import.repository.core.ts uses:
//   rpc(fn, args) · from(table).select(cols) · eq · in · gt · order · limit · maybeSingle
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const SET_RETURNING = new Set(["question_import_fingerprints"]);

function lit(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string")) return quote(`{${value.join(",")}}`); // untyped array literal (e.g. uuid[])
    return dollar(JSON.stringify(value)); // jsonb
  }
  if (typeof value === "object") return dollar(JSON.stringify(value));
  return quote(String(value));
}
const quote = (s) => `'${s.replace(/'/g, "''")}'`;
function dollar(s) {
  let tag = "qi";
  while (s.includes(`$${tag}$`)) tag += "x";
  return `$${tag}$${s}$${tag}$`;
}
const ident = (name) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`bad identifier ${name}`);
  return name;
};

export class PgDatabase {
  constructor({ psql, host = "localhost", port, user = "postgres", database }) {
    Object.assign(this, { psql, host, port, user, database });
  }
  /** Run SQL (whole script) and return { stdout, stderr, code }. */
  run(sql) {
    const file = path.join(os.tmpdir(), `qi-${randomUUID()}.sql`);
    fs.writeFileSync(file, sql, "utf8");
    return new Promise((resolve) => {
      execFile(
        this.psql,
        ["-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose", "-h", this.host, "-p", String(this.port), "-U", this.user, "-d", this.database, "-f", file],
        { env: { ...process.env, PGCLIENTENCODING: "UTF8" }, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
        (error, stdout, stderr) => {
          fs.rmSync(file, { force: true });
          resolve({ stdout, stderr, code: error ? error.code ?? 1 : 0 });
        }
      );
    });
  }
  /** Run one query as the superuser (test setup) and return its single JSON value. */
  async admin(query) {
    // jsonb text is always one line (json_agg output is not).
    const { stdout, stderr, code } = await this.run(`select to_jsonb((${query}))::text;`);
    if (code) throw new Error(stderr);
    const line = stdout.split(/\r?\n/).filter(Boolean).pop();
    return line === undefined ? null : JSON.parse(line);
  }
  /** Run statements as the superuser with a signed-in user's claims (e.g. bank edits by the normal editor). */
  async exec(sql, userId = null) {
    const claims = userId ? JSON.stringify({ sub: userId }) : "";
    const { stderr, code } = await this.run(`select set_config('request.jwt.claims', ${quote(claims)}, false);\n${sql}`);
    if (code) throw new Error(stderr);
  }
  client(identity) {
    return new PgClient(this, identity);
  }
}

export class PgClient {
  /** identity: { role: "authenticated" | "anon", userId?: string } */
  constructor(db, identity) {
    this.db = db;
    this.identity = identity;
  }
  rpc(fn, args = {}) {
    return new Builder(this, { kind: "rpc", fn: ident(fn), args });
  }
  from(table) {
    return { select: (cols) => new Builder(this, { kind: "select", table: ident(table), cols }) };
  }
  /** Raw SQL (JSON-returning) under this identity. */
  async sql(query) {
    return this.execute(`select coalesce(to_jsonb((${query})), 'null'::jsonb)::text`);
  }
  async execute(query) {
    const { role, userId } = this.identity;
    const claims = userId ? JSON.stringify({ sub: userId }) : "";
    const sql = `set role ${role === "anon" ? "anon" : "authenticated"};\nselect set_config('request.jwt.claims', ${quote(claims)}, false);\n${query};\n`;
    const { stdout, stderr, code } = await this.db.run(sql);
    if (code) {
      const m = /ERROR:\s+([0-9A-Z]{5}):\s+(.*)/.exec(stderr);
      return { data: null, error: { code: m ? m[1] : "XX000", message: m ? m[2].trim() : stderr.trim() } };
    }
    const line = stdout.split(/\r?\n/).filter(Boolean).pop();
    return { data: line === undefined ? null : JSON.parse(line), error: null };
  }
}

class Builder {
  constructor(client, spec) {
    this.client = client;
    this.spec = spec;
    this.filters = [];
    this.orderBy = null;
    this.limitN = null;
    this.single = false;
  }
  eq(col, v) { this.filters.push(`${ident(col)} = ${lit(v)}`); return this; }
  gt(col, v) { this.filters.push(`${ident(col)} > ${lit(v)}`); return this; }
  in(col, values) { this.filters.push(values.length ? `${ident(col)} in (${values.map(lit).join(", ")})` : "false"); return this; }
  order(col, opts = {}) { this.orderBy = `${ident(col)} ${opts.ascending === false ? "desc" : "asc"}`; return this; }
  limit(n) { this.limitN = n; return this; }
  maybeSingle() { this.single = true; return this; }

  toSql() {
    const where = this.filters.length ? ` where ${this.filters.join(" and ")}` : "";
    const order = this.orderBy ? ` order by ${this.orderBy}` : "";
    const limit = this.limitN !== null ? ` limit ${Number(this.limitN)}` : "";
    const { spec } = this;
    if (spec.kind === "rpc") {
      const args = Object.entries(spec.args).map(([k, v]) => `${ident(k)} => ${lit(v)}`).join(", ");
      const call = `public.${spec.fn}(${args})`;
      if (SET_RETURNING.has(spec.fn)) return `select coalesce(jsonb_agg(t), '[]'::jsonb)::text from (select * from ${call}${where}${order}${limit}) t`;
      return `select to_jsonb(${call})::text`;
    }
    const cols = spec.cols.split(",").map((c) => ident(c.trim())).join(", ");
    return `select coalesce(jsonb_agg(t), '[]'::jsonb)::text from (select ${cols} from public.${spec.table}${where}${order}${limit}) t`;
  }
  async execute() {
    const result = await this.client.execute(this.toSql());
    if (result.error || !this.single) return result;
    return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: null };
  }
  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}
