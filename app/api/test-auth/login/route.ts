import { NextResponse } from "next/server";

export async function POST() {
  if (process.env.NODE_ENV !== "test" && process.env.E2E_BYPASS_AUTH !== "1") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // Skapa en enkel "test-auth" cookie. Er backend kan redan läsa denna.
  // Annars: i middleware eller auth-check lägg: if (req.cookies.get('test-auth') === '1') -> authenticated
  const res = NextResponse.json({ ok: true, user: { id: "e2e-admin", role: "admin" } });
  res.cookies.set("test-auth", "1", { path: "/", httpOnly: false }); // enkel för E2E
  return res;
}
