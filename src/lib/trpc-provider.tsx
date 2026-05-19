import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./trpc";
import { getSupabaseClient } from "./supabase";
import { createQueryClient } from "./react-query";

const TRPC_URL =
  import.meta.env.VITE_TRPC_URL || "http://localhost:3001/api/trpc";

let cachedAccessToken: string | null = null;

if (typeof window !== "undefined") {
  const supabase = getSupabaseClient();
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAccessToken = session?.access_token ?? null;
  });
  void supabase.auth
    .getSession()
    .then(({ data: { session } }) => {
      cachedAccessToken = session?.access_token ?? null;
    })
    .catch((err) => {
      console.warn("[tRPC] initial getSession failed (non-blocking):", err);
    });
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: TRPC_URL,
          transformer: superjson,
          headers() {
            return cachedAccessToken
              ? { Authorization: `Bearer ${cachedAccessToken}` }
              : {};
          },
          fetch(url, options) {
            return fetch(url, options).catch((err) => {
              console.error("[tRPC] Network error:", err);
              throw err;
            });
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
