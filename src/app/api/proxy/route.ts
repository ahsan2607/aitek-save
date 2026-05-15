import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProxyPayload {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: ProxyPayload;

  try {
    payload = (await req.json()) as ProxyPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { method, url, headers, body } = payload;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      ...(body !== undefined ? { body } : {}),
    };

    const upstream = await fetch(url, fetchOptions);

    const responseHeaders: Record<string, string> = {};
    upstream.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const rawText = await upstream.text();
    const size = new TextEncoder().encode(rawText).length;

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }

    return NextResponse.json({
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
      body: parsedBody,
      size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Request failed: ${message}` }, { status: 502 });
  }
}
