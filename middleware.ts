import { createAuthMiddleware } from "@pcstyle/auth/middleware";

/**
 * WorkOS AuthKit middleware for math.pcstyle.dev
 * Handles session validation and redirects for protected routes
 *
 * Public paths: homepage, health check, PWA manifest
 * Protected: all learning content requires authentication
 */
export default createAuthMiddleware({
  publicPaths: ["/", "/api/health", "/manifest.webmanifest"],
});

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|.*\\..*).*)"],
};
