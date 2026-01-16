import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

/**
 * WorkOS AuthKit middleware for math.pcstyle.dev
 * Handles session validation and redirects for protected routes
 *
 * Public paths: homepage, health check, PWA manifest
 * Protected: all learning content requires authentication
 */
export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/", "/api/health", "/manifest.webmanifest"],
  },
});

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|.*\\..*).*)"],
};
