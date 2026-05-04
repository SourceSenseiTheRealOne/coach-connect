/**
 * React Query Configuration
 * Centralized QueryClient setup with proper defaults
 */

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Time in milliseconds that data remains fresh
                staleTime: 1000 * 60 * 5, // 5 minutes
                // Time in milliseconds that unused data is kept in cache
                gcTime: 1000 * 60 * 10, // 10 minutes
                // Retry failed queries 3 times
                retry: 3,
                // Retry with exponential backoff
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                // Don't refetch on window focus by default
                refetchOnWindowFocus: false,
            },
            mutations: {
                // Retry failed mutations once
                retry: 1,
            },
        },
    });
}

// Export a singleton instance for the app
export const queryClient = createQueryClient();
