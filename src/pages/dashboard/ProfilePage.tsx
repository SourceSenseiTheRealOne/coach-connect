import { motion } from "framer-motion";
import {
  MapPin,
  Award,
  Users,
  BookOpen,
  Calendar,
  Edit,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyProfile, useFollowCounts } from "@/hooks/use-profile";

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useMyProfile();
  const { data: followCounts } = useFollowCounts(profile?.id || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";
  const stats = [
    { label: "Exercises", value: "0" },
    {
      label: "Followers",
      value: followCounts?.followers?.toString() || "0",
    },
    {
      label: "Following",
      value: followCounts?.following?.toString() || "0",
    },
    { label: "Views", value: "0" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cover + Avatar */}
      <motion.div
        className="glass-card overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="h-40 sm:h-52 bg-gradient-to-br from-primary/20 via-accent/10 to-background relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(160_84%_39%/0.15),transparent)]" />
        </div>
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-primary">
                {initials}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-foreground">
                  {profile.full_name || "User"}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.user_type || "Coach"} ·{" "}
                {profile.uefa_license || "No license"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:bg-secondary gap-1 self-start"
            >
              <Edit size={14} /> Edit Profile
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className="font-display text-lg font-bold text-foreground">
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Info */}
        <motion.div
          className="glass-card p-5 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-display font-semibold text-foreground">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {profile.bio || "No bio provided yet."}
          </p>
          <div className="space-y-2.5 text-sm">
            {profile.city && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={14} className="text-primary" /> {profile.city}
                {profile.district ? `, ${profile.district}` : ""}
              </div>
            )}
            {profile.uefa_license && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award size={14} className="text-primary" />{" "}
                {profile.uefa_license}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users size={14} className="text-primary" />{" "}
              {profile.user_type || "Coach"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={14} className="text-primary" /> Joined{" "}
              {new Date(profile.created_at || "").toLocaleDateString()}
            </div>
          </div>
        </motion.div>

        {/* Recent Exercises - placeholder for now */}
        <motion.div
          className="glass-card p-5 md:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground">
              Recent Exercises
            </h2>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ExternalLink size={12} />
            </button>
          </div>
          <div className="text-center py-8 text-muted-foreground text-sm">
            Exercise history coming soon
          </div>
        </motion.div>
      </div>
    </div>
  );
}
