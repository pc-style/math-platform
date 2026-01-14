
"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useCallback, useMemo } from "react";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-nextjs/components";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useWorkOSAuthBridge() {
    const { user, loading, getAccessToken } = useAuth();

    const fetchAccessToken = useCallback(async ({ forceRefresh }: { forceRefresh: boolean }) => {
        // WorkOS AuthKit for Next.js handles refreshing internally in getAccessToken
        return await getAccessToken();
    }, [getAccessToken]);

    return useMemo(() => ({
        isLoading: loading,
        isAuthenticated: !!user,
        fetchAccessToken,
    }), [loading, user, fetchAccessToken]);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <AuthKitProvider>
            <ConvexProviderWithAuth client={convex} useAuth={useWorkOSAuthBridge}>
                {children}
            </ConvexProviderWithAuth>
        </AuthKitProvider>
    );
}
