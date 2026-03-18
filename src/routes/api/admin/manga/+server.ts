import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  getAllManga,
  createManga,
  getMangaById,
  updateManga,
  deleteManga,
  getChaptersByManga,
  createChapter,
  getStats,
  seedDatabase,
} from "$lib/server/sqlite";

seedDatabase();

// Simple password protection - in production use proper auth
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "manhau_admin_2026";

export const GET: RequestHandler = async ({ cookies }) => {
  const auth = cookies.get("admin_auth");

  if (auth !== ADMIN_PASSWORD) {
    return json(
      {
        success: false,
        error: "Unauthorized",
        requiresAuth: true,
      },
      { status: 401 },
    );
  }

  const manga = getAllManga({ limit: 100 });
  const stats = getStats();

  const mangaWithChapters = manga.map((m) => ({
    ...m,
    chapters: getChaptersByManga(m.id),
  }));

  return json({
    success: true,
    data: {
      manga: mangaWithChapters,
      stats,
    },
  });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
  const body = await request.json();

  // Login attempt
  if (body.action === "login") {
    if (body.password === ADMIN_PASSWORD) {
      cookies.set("admin_auth", ADMIN_PASSWORD, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return json({ success: true, data: { loggedIn: true } });
    }
    return json({ success: false, error: "Invalid password" }, { status: 401 });
  }

  // Check auth for other operations
  const auth = cookies.get("admin_auth");
  if (auth !== ADMIN_PASSWORD) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = body;

    const manga = createManga({
      title: data.title,
      description: data.description || "",
      cover: data.cover || "",
      status: data.status || "ongoing",
      type: data.type || "manga",
      author: data.author || "",
      artist: data.artist || "",
      tags: data.tags || [],
    });

    return json(
      {
        success: true,
        data: manga,
      },
      { status: 201 },
    );
  } catch (e) {
    return json(
      {
        success: false,
        error: "Invalid request data",
      },
      { status: 400 },
    );
  }
};

// DELETE endpoint also needs auth
export const DELETE: RequestHandler = async ({ cookies, params, request }) => {
  // For DELETE requests, check Authorization header
  const auth = request.headers.get("Authorization");

  if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return json({ success: true });
};
