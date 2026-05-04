import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Profile } from "@/shared/types"
import type { User } from "@supabase/supabase-js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(profile: Profile | null, user: User | null): string {
  if (profile?.full_name) {
    return profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (profile?.username) {
    return profile.username.slice(0, 2).toUpperCase();
  }
  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return "U";
}
