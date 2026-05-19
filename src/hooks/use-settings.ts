import { trpc } from "@/lib/trpc";

export const settingsKeys = {
  all: ["settings"] as const,
  me: () => [...settingsKeys.all, "me"] as const,
};

export function useMySettings() {
  return trpc.settings.me.useQuery(undefined, {
    staleTime: 30 * 1000,
  });
}

export function useUpdateSettings() {
  const utils = trpc.useUtils();

  return trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.me.invalidate();
    },
  });
}
