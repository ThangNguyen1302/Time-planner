import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      error: "google_calendar_migration_in_progress",
      message: "Callback Google Calendar dang duoc chuyen sang backend Java.",
    },
    { status: 503 },
  )
}
