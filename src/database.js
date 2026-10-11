import { createClient } from "@libsql/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { openPostgres } from "./postgres.js";

export function openDatabase({ file, url, authToken, postgresUrl } = {}) {
  if (postgresUrl) return openPostgres(postgresUrl);
  if (url) {
    const parsed = new URL(url);
    if (
      !["libsql:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    )
      throw new Error(
        "TURSO_DATABASE_URL must be a secure libsql:// or https:// database URL.",
      );
    if (!authToken)
      throw new Error("TURSO_AUTH_TOKEN is required with TURSO_DATABASE_URL.");
  } else {
    mkdirSync(path.dirname(file), { recursive: true });
  }
  const client = createClient({
    url: url || pathToFileURL(file).href,
    authToken,
    tls: url ? true : undefined,
    intMode: "number",
  });
  const context = new AsyncLocalStorage();
  let queue = Promise.resolve();
  function locked(task) {
    const next = queue.then(task);
    queue = next.catch(() => {});
    return next;
  }
  async function execute(sql, args) {
    const tx = context.getStore();
    if (tx) return tx.execute({ sql, args });
    return locked(() => client.execute({ sql, args }));
  }
  return {
    remote: Boolean(url),
    prepare(sql) {
      return {
        async run(...args) {
          const result = await execute(sql, args);
          return {
            changes: result.rowsAffected,
            lastInsertRowid: result.lastInsertRowid,
          };
        },
        async get(...args) {
          return (await execute(sql, args)).rows[0];
        },
        async all(...args) {
          return (await execute(sql, args)).rows;
        },
      };
    },
    async exec(sql) {
      return locked(() => client.executeMultiple(sql));
    },
    async transaction(task) {
      return locked(async () => {
        const tx = await client.transaction("write");
        try {
          const result = await context.run(tx, task);
          await tx.commit();
          return result;
        } catch (error) {
          if (!tx.closed) await tx.rollback();
          throw error;
        } finally {
          tx.close();
        }
      });
    },
    close() {
      client.close();
    },
  };
}
