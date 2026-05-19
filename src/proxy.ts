import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authMiddleware = withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export function proxy(req: NextRequest, event: any) {
  return (authMiddleware as any)(req, event)
}

export const config = { 
  matcher: [
    "/chat/:path*", 
    "/stats/:path*", 
    "/bot/:path*",
    "/game/:path*",
    "/api/bot/:path*",
    "/api/player/:path*"
  ] 
}
