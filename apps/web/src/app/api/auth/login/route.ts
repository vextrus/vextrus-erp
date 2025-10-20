/**
 * Login API Route
 *
 * Handles user authentication via GraphQL backend.
 * Sets httpOnly cookie with JWT token for secure session management.
 *
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Response: { user: User }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResponse {
  login: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      organizationId: string;
      phone?: string;
      roleId: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginInput = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // GraphQL login mutation
    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          accessToken
          refreshToken
          expiresIn
          user {
            id
            email
            username
            firstName
            lastName
            organizationId
            phone
            roleId
            status
            createdAt
            updatedAt
          }
        }
      }
    `;

    // Call backend GraphQL API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: loginMutation,
        variables: {
          input: {
            email: body.email,
            password: body.password,
          },
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    const result = await response.json();

    if (result.errors) {
      return NextResponse.json(
        { message: result.errors[0]?.message || 'Login failed' },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken, user } = result.data.login as LoginResponse['login'];

    // Set httpOnly cookies for tokens
    const cookieStore = await cookies();

    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Store user data in cookie for /api/auth/me endpoint
    cookieStore.set('userData', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Return user data with accessToken for localStorage (but not refreshToken)
    return NextResponse.json(
      {
        user,
        accessToken, // Include for localStorage compatibility with existing Apollo client
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
