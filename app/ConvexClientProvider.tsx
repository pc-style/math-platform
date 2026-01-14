
"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useCallback, useMemo } from "react";
import { AuthKitProvider, useAuth, useAccessToken } from "@workos-inc/authkit-nextjs/components";


const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple global logger for dev mode
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    (window as any).__APP_LOGS = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
        (window as any).__APP_LOGS.push({ time: new Date().toLocaleTimeString(), msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') });
        originalConsoleLog(...args);
    };
}

function useWorkOSAuthBridge() {
    const { user, loading } = useAuth();
    const { getAccessToken, refresh } = useAccessToken();

    const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        try {
            if (forceRefreshToken) {
                const token = await refresh();
                return token || null;
            }
            const token = await getAccessToken();
            return token || null;
        } catch (e) {
            console.error("Auth bridge error:", e);
            return null;
        }
    }, [getAccessToken, refresh]);

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
                <AuthBoundary>{children}</AuthBoundary>
            </ConvexProviderWithAuth>
        </AuthKitProvider>
    );
}

function AuthBoundary({ children }: { children: ReactNode }) {
    const { loading } = useAuth();
    // Prevent rendering children (which often contain useQuery) while AuthKit is still loading the session
    // This helps avoid the "Failed to Fetch" if Convex tries to use an uninitialized token
    if (loading) return null;
    return <>{children}</>;
}
