
import { NextResponse } from 'next/server';

// This route handler catches requests for a file used by Windows Live Writer,
// often associated with WordPress sites. Returning 204 No Content stops the
// 404 error from appearing in logs for bots scanning for WordPress.
export async function GET() {
  return new NextResponse(null, { status: 204 });
}
