import { request, expect, chromium } from "@playwright/test";
import path from "path";

async function login(baseURL: string) {
  const req = await request.newContext({ baseURL });
  const res = await req.post("/api/test-auth/login");
  expect(res.ok()).toBeTruthy();

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL + "/");
  // sätt cookie som route'n satte – enklast via eval (tar "browser context" värde)
  await page.context().addCookies([{ name: "test-auth", value: "1", url: baseURL }]);
  await page.context().storageState({ path: path.resolve("e2e/.auth/admin.json") });
  await browser.close();
}

export default async () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";
  await login(baseURL);
};
