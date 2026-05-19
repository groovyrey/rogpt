export { default } from "next-auth/middleware"

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
