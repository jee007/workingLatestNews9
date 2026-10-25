
import { NextResponse } from 'next/server';

// This route handler catches requests for the WordPress oEmbed API endpoint.
// Returning 204 No Content stops the 404 error from appearing in logs
// for bots scanning for WordPress sites.
export async function GET() {
  return new NextResponse(null, { status: 204 });
}
