import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyJWT } from "@/lib/auth";

function clearTokenCookie(response: NextResponse) {
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = verifyJWT(token);
  if (!payload || !payload.user_id) {
    return clearTokenCookie(
      NextResponse.json({ authenticated: false }, { status: 401 }),
    );
  }

  try {
    const result = await pool.query(
      `SELECT user_id, username, email, "firstName", "lastName" FROM users WHERE user_id = $1`,
      [payload.user_id],
    );

    if (result.rowCount === 0) {
      return clearTokenCookie(
        NextResponse.json({ authenticated: false }, { status: 401 }),
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
      authenticated: true,
      token,
      user: {
        id: user.user_id,
        username: user.username ?? user.email,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("SESSION ERROR:", error);
    return NextResponse.json(
      { authenticated: false, error: "Failed to fetch session" },
      { status: 500 },
    );
  }
}
