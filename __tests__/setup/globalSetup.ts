import { execSync } from "child_process";
let started = false;

function hasDocker() {
  try { 
    execSync("docker ps -q", { stdio: "ignore" }); 
    return true; 
  } catch { 
    return false; 
  }
}

export default async () => {
  if (process.env.DATABASE_URL && process.env.REDIS_URL) {
    // CI med services (eller manuell lokalkonfig) – använd dessa
    console.log("Using existing DATABASE_URL and REDIS_URL from environment");
    return;
  }
  
  if (process.env.CI || !hasDocker()) {
    // Fallback: för CI utan Docker – förvänta att tjänster körs på localhost
    console.log("CI mode or no Docker detected, using localhost services");
    process.env.DATABASE_URL ||= "postgresql://postgres:postgres@localhost:5432/test?schema=public";
    process.env.REDIS_URL     ||= "redis://localhost:6379";
    process.env.NODE_ENV = "test";
    return;
  }
  
  // Annars: kör Testcontainers (din befintliga Testcontainers-setup)
  console.log("Using Testcontainers for isolated test environment");
  const mod = await import("./globalSetup.containers");
  await mod.default();
};
