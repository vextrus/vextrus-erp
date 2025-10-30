/**
 * Logout API Route
 *
 * Clears authentication cookies to end user session.
 *
 * POST /api/auth/logout
 * Response: { success: true }
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear authentication cookies
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
    cookieStore.delete('userData');

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
