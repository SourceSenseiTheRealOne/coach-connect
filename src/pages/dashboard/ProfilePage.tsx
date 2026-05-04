import { useState } from "react";
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
  Dumbbell,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useMyProfile,
  useFollowCounts,
  useUserExerciseCount,
  useMyRecentExercises,
  useUpdateProfile,
} from "@/hooks/use-profile";

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useMyProfile();
  const { data: followCounts } = useFollowCounts(profile?.id || null);
  const { data: exerciseCount } = useUserExerciseCount(profile?.id || null);
  const { data: recentExercises } = useMyRecentExercises(5);
  const updateProfile = useUpdateProfile();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    city: "",
    district: "",
    uefa_license: "",
  });

  const handleEditClick = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        city: profile.city || "",
        district: profile.district || "",
        uefa_license: profile.uefa_license || "",
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        full_name: editForm.full_name || undefined,
        bio: editForm.bio || undefined,
        city: editForm.city || undefined,
        district: editForm.district || undefined,
        uefa_license:
          (editForm.uefa_license as "C" | "B" | "A" | "PRO" | null) || null,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

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
    { label: "Exercises", value: exerciseCount?.toString() || "0" },
    {
      label: "Followers",
      value: followCounts?.followers?.toString() || "0",
    },
    {
      label: "Following",
      value: followCounts?.following?.toString() || "0",
    },
    { label: "Views", value: profile.profile_views?.toString() || "0" },
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--secondary)/0.15),transparent)]" />
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
              className="border-border text-foreground hover:bg-muted/60 gap-1 self-start"
              onClick={handleEditClick}
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

        {/* Recent Exercises */}
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
          {recentExercises && recentExercises.length > 0 ? (
            <div className="space-y-3">
              {recentExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">
                      {exercise.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {exercise.category} · {exercise.difficulty}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(exercise.created_at || "").toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No exercises yet. Start creating exercises to see them here!
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => handleFormChange("full_name", e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => handleFormChange("bio", e.target.value)}
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={editForm.city}
                onChange={(e) => handleFormChange("city", e.target.value)}
                placeholder="Enter your city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={editForm.district}
                onChange={(e) => handleFormChange("district", e.target.value)}
                placeholder="Enter your district"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uefa_license">UEFA License</Label>
              <Input
                id="uefa_license"
                value={editForm.uefa_license}
                onChange={(e) =>
                  handleFormChange("uefa_license", e.target.value)
                }
                placeholder="C, B, A, or PRO"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
