import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function backendBase(): string {
  const raw =
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON no valido." }, { status: 400 });
  }

  const url = `${backendBase()}/api/ai/public/mascot-chat`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(65_000)
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    if (text) {
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        data = { error: text.slice(0, 240) };
      }
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[proxy mascot-chat]", err);
    return NextResponse.json(
      {
        error: "assistant_unavailable",
        message:
          "El asistente no esta disponible ahora mismo. Prueba mas tarde o usa el formulario de contacto del sitio."
      },
      { status: 503 }
    );
  }
}
