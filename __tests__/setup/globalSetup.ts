import { StartedPostgreSqlContainer, PostgreSqlContainer } from "@testcontainers/postgresql";
import { StartedRedisContainer, RedisContainer } from "@testcontainers/redis";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

declare global {
  // Jest globalThis
  // eslint-disable-next-line no-var
  var __PG__: StartedPostgreSqlContainer | undefined;
  // eslint-disable-next-line no-var
  var __REDIS__: StartedRedisContainer | undefined;
}

export default async () => {
  const pg = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase(`test_${randomUUID().slice(0, 8)}`)
    .withUsername("test")
    .withPassword("test")
    .start();

  const redis = await new RedisContainer("redis:7-alpine").start();

  // Exportera env för appen i tests
  process.env.DATABASE_URL = pg.getConnectionUri();
  process.env.REDIS_URL = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;
  process.env.NODE_ENV = "test";

  // Kör prisma schema och seed
  const prismaBin = path.resolve("node_modules/.bin/prisma");
  execSync(`${prismaBin} db push --force-reset`, { stdio: "inherit" });
  execSync(`node --loader ts-node/esm __tests__/setup/seed.ts`, { stdio: "inherit" });

  // Spara containers för teardown
  (global as any).__PG__ = pg;
  (global as any).__REDIS__ = redis;

  // Skapa en minimal .env.test.snapshot för felsökning (valfritt)
  const snapshot = `DATABASE_URL=${process.env.DATABASE_URL}
REDIS_URL=${process.env.REDIS_URL}
`;
  fs.writeFileSync(".env.test.snapshot", snapshot);
};
