// Creates the tables. Run: node --env-file=.env.local scripts/db-setup.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

const url = new URL(process.env.DATABASE_URL);
url.searchParams.set("uselibpqcompat", "true");
const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
await client.query(readFileSync(new URL("../src/lib/data/schema.sql", import.meta.url), "utf8"));
const { rows } = await client.query(
  "select table_name from information_schema.tables where table_schema='public' and table_name in ('outages','outage_observations','submissions') order by 1",
);
console.log("tables ready:", rows.map((r) => r.table_name).join(", "));
await client.end();
