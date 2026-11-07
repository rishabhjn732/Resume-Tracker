import { NextResponse } from "next/server";
import { getSessionToken } from "./auth";
import { BackendError, callBackend } from "./backend";

// LEARN (Route Handler helper): the browser can't call FastAPI itself, because the
// login token is in an httpOnly cookie. So the browser calls a Next.js route,
// and this helper adds the token and passes the request on to FastAPI.
export async function relayToBackend(path: string, init: RequestInit = {}) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Please log in." }, { status: 401 });
  }

  let response: Response;
  try {
    response = await callBackend(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("Backend call failed:", error);
    const status = error instanceof BackendError ? error.status : 503;
    return NextResponse.json({ detail: "The server is not reachable. Please try again." }, { status });
  }

  if (response.status === 204) return new NextResponse(null, { status: 204 });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}
