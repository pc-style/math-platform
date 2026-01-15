
"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useCallback, useMemo } from "react";
import { AuthKitProvider, useAuth, useAccessToken } from "@workos-inc/authkit-nextjs/components";


const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple global logger for dev mode
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    (window as unknown as { __APP_LOGS: { time: string; msg: string }[] }).__APP_LOGS = [];
    const originalConsoleLog = console.log;
    console.log = (...args: unknown[]) => {
        (window as unknown as { __APP_LOGS: { time: string; msg: string }[] }).__APP_LOGS.push({
            time: new Date().toLocaleTimeString(),
            msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        });
        originalConsoleLog(...args);
    };
}

function useWorkOSAuthBridge() {
    const { user, loading: isLoading } = useAuth();
    const { accessToken, loading: tokenLoading, error: tokenError } = useAccessToken();
    const loading = (isLoading ?? false) || (tokenLoading ?? false);
    const authenticated = !!user && !!accessToken && !loading;

    const fetchAccessToken = useCallback(async () => {
        if (accessToken && !tokenError) {
            return accessToken;
        }
        return null;
    }, [accessToken, tokenError]);

    return useMemo(() => ({
        isLoading: loading,
        isAuthenticated: authenticated,
        fetchAccessToken,
    }), [loading, authenticated, fetchAccessToken]);
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
