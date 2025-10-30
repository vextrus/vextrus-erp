/**
 * Current User API Route
 *
 * Returns the current authenticated user from stored cookie data.
 * User data is stored during login to avoid querying backend every time.
 *
 * GET /api/auth/me
 * Response: { user: User } or 401 if not authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const userDataStr = cookieStore.get('userData')?.value;

    if (!accessToken || !userDataStr) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse user data from cookie
    const user = JSON.parse(userDataStr);

    return NextResponse.json(
      { user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Me query error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
