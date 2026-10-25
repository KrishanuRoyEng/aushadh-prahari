/**
 * /api/sync — Validate and acknowledge queued records
 *
 * Stub: validates incoming outbox records and acknowledges them.
 * No server-side storage — just validates + acks.
 * A real deployment would persist to a secure backend here.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { OutboxRecordSchema } from "@/lib/schemas";

const MAX_PAYLOAD_BYTES = 100_000; // 100 KB
const BATCH_SIZE_LIMIT = 10;

const SyncRequestSchema = z.object({
  records: z.array(OutboxRecordSchema).max(BATCH_SIZE_LIMIT),
});

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = SyncRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const { records } = parsed.data;

  // Validate each record (already done by Zod above)
  // In a real deployment: persist to backend, check patient consent, etc.
  const acknowledged = records.map((r) => ({
    id: r.id,
    status: "acknowledged",
    timestamp: new Date().toISOString(),
  }));

  return NextResponse.json({
    success: true,
    acknowledged,
    note: "Stub endpoint. No server-side data persistence in this version.",
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "1.0.0",
    note: "Stub sync endpoint",
  });
}
