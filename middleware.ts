
import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export default authkitMiddleware({
    middlewareAuth: {
        enabled: true,
        unauthenticatedPaths: ['/', '/login'],
    },
});

export const config = { matcher: ['/dashboard', '/create', '/exam/:id*'] };
