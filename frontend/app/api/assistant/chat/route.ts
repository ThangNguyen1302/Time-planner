import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "assistant_migration_in_progress",
      message: "API tro ly dang migration sang backend Java. Vui long su dung backend moi /api/v1/assistant/chat.",
    },
    { status: 503 },
  )
}
