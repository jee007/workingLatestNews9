
import { NextResponse } from 'next/server';

// This route handler catches requests for xmlrpc.php, a common target for
// bots scanning for WordPress vulnerabilities. Returning 204 No Content
// for both GET and POST requests stops the 404 errors from appearing in logs.
export async function GET() {
  return new NextResponse(null, { status: 204 });
}

export async function POST() {
  return new NextResponse(null, { status: 204 });
}
