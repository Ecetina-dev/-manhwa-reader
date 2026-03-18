import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "manhau_admin_2026";

export const POST: RequestHandler = async ({ cookies, request }) => {
  const { password, action } = await request.json();

  if (action === "logout") {
    cookies.delete("admin_auth", { path: "/" });
    return json({ success: true });
  }

  if (password === ADMIN_PASSWORD) {
    cookies.set("admin_auth", ADMIN_PASSWORD, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
    });
    return json({ success: true, data: { authenticated: true } });
  }

  return json({ success: false, error: "Invalid password" }, { status: 401 });
};
