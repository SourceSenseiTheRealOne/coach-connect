import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useMyProfile, useUpdateProfile } from "@/hooks/use-profile";
import {
  useMySubscription,
  useCancelSubscription,
} from "@/hooks/use-subscription";

const sections = [
  { icon: User, label: "Profile" },
  { icon: Bell, label: "Notifications" },
  { icon: Shield, label: "Privacy" },
  { icon: CreditCard, label: "Subscription" },
  { icon: Globe, label: "Language" },
];

export default function SettingsPage() {
  const { data: profile, isLoading, error } = useMyProfile();
  const { data: subscription } = useMySubscription();
  const updateProfile = useUpdateProfile();
  const cancelSubscription = useCancelSubscription();

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    city: "",
    uefa_license: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    new_messages: true,
    exercise_likes: true,
    new_followers: true,
    job_opportunities: true,
    platform_updates: false,
  });

  const handleProfileSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: profileForm.full_name || undefined,
        username: profileForm.username || undefined,
        bio: profileForm.bio || undefined,
        city: profileForm.city || undefined,
        uefa_license:
          (profileForm.uefa_license as "C" | "B" | "A" | "PRO" | null) || null,
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleNotificationToggle = (key: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCancelSubscription = async () => {
    if (confirm("Are you sure you want to cancel your subscription?")) {
      try {
        await cancelSubscription.mutateAsync();
      } catch (error) {
        console.error("Failed to cancel subscription:", error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.",
      )
    ) {
      if (confirm("This is your last chance. Type 'DELETE' to confirm.")) {
        try {
          // TODO: Implement delete account tRPC procedure
          console.log("Delete account functionality to be implemented");
        } catch (error) {
          console.error("Failed to delete account:", error);
        }
      }
    }
  };

  // Initialize form when profile loads
  if (profile && !profileForm.full_name) {
    setProfileForm({
      full_name: profile.full_name || "",
      username: profile.username || "",
      bio: profile.bio || "",
      city: profile.city || "",
      uefa_license: profile.uefa_license || "",
    });
  }

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
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.h1
        className="font-display text-2xl font-bold text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Settings
      </motion.h1>

      {/* Profile Settings */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <User size={20} className="text-primary" />
          <h2 className="font-display font-semibold text-foreground">
            Profile Settings
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Full Name</Label>
            <Input
              value={profileForm.full_name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, full_name: e.target.value })
              }
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Username</Label>
            <Input
              value={profileForm.username}
              onChange={(e) =>
                setProfileForm({ ...profileForm, username: e.target.value })
              }
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-foreground">Bio</Label>
            <Input
              value={profileForm.bio}
              onChange={(e) =>
                setProfileForm({ ...profileForm, bio: e.target.value })
              }
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">City</Label>
            <Input
              value={profileForm.city}
              onChange={(e) =>
                setProfileForm({ ...profileForm, city: e.target.value })
              }
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">UEFA License</Label>
            <Input
              value={profileForm.uefa_license}
              onChange={(e) =>
                setProfileForm({ ...profileForm, uefa_license: e.target.value })
              }
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
        </div>
        <Button
          className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleProfileSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Changes
        </Button>
      </motion.div>

      {/* Notifications */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Bell size={20} className="text-primary" />
          <h2 className="font-display font-semibold text-foreground">
            Notifications
          </h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "new_messages", label: "New messages" },
            { key: "exercise_likes", label: "Exercise likes" },
            { key: "new_followers", label: "New followers" },
            { key: "job_opportunities", label: "Job opportunities" },
            { key: "platform_updates", label: "Platform updates" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item.label}</span>
              <Switch
                checked={
                  notificationSettings[
                    item.key as keyof typeof notificationSettings
                  ]
                }
                onCheckedChange={() => handleNotificationToggle(item.key)}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Subscription */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <CreditCard size={20} className="text-primary" />
          <h2 className="font-display font-semibold text-foreground">
            Subscription
          </h2>
        </div>
        {subscription ? (
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div>
              <span className="text-sm font-semibold text-primary">
                {subscription.tier || "Free"}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subscription.status === "active"
                  ? `Active · Renews ${new Date(subscription.current_period_end || "").toLocaleDateString()}`
                  : subscription.status}
              </p>
            </div>
            <div className="flex gap-2">
              {subscription.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted/60"
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscription.isPending}
                >
                  {cancelSubscription.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Cancel"
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="border-border text-foreground hover:bg-muted/60"
              >
                Manage
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No active subscription
          </div>
        )}
      </motion.div>

      {/* Language */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Globe size={20} className="text-primary" />
          <h2 className="font-display font-semibold text-foreground">
            Language
          </h2>
        </div>
        <LanguageSwitcher variant="default" />
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        className="glass-card p-6 border-destructive/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-destructive" />
          <h2 className="font-display font-semibold text-foreground">
            Danger Zone
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
          Delete Account
        </Button>
      </motion.div>
    </div>
  );
}
