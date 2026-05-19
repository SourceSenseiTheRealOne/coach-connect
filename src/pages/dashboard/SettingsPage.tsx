import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CreditCard, Globe, Loader2, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { useLanguage, type LanguageCode } from "@/lib/language-context";
import { trpc } from "@/lib/trpc";
import { useMyProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useMySettings, useUpdateSettings } from "@/hooks/use-settings";
import {
  useCancelSubscription,
  useCreateBillingPortalSession,
  useMySubscription,
} from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";

type ProfileForm = {
  full_name: string;
  username: string;
  bio: string;
  city: string;
  uefa_license: "" | "C" | "B" | "A" | "PRO";
};

type NotificationSettings = {
  new_messages: boolean;
  exercise_likes: boolean;
  new_followers: boolean;
  job_opportunities: boolean;
  platform_updates: boolean;
};

type SettingsForm = NotificationSettings & {
  language: LanguageCode;
};

type NotificationKey = keyof NotificationSettings;

const notificationItems: Array<{ key: NotificationKey; label: string }> = [
  { key: "new_messages", label: "New messages" },
  { key: "exercise_likes", label: "Exercise likes" },
  { key: "new_followers", label: "New followers" },
  { key: "job_opportunities", label: "Job opportunities" },
  { key: "platform_updates", label: "Platform updates" },
];

const defaultSettingsForm: SettingsForm = {
  new_messages: true,
  exercise_likes: true,
  new_followers: true,
  job_opportunities: true,
  platform_updates: false,
  language: "en",
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { languages, setLanguage } = useLanguage();
  const { data: profile, error, isLoading } = useMyProfile();
  const {
    data: settings,
    error: settingsError,
    isLoading: isSettingsLoading,
  } = useMySettings();
  const { data: subscription } = useMySubscription();
  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateSettings();
  const cancelSubscription = useCancelSubscription();
  const createBillingPortalSession = useCreateBillingPortalSession();
  const deleteAccount = trpc.auth.deleteAccount.useMutation();

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    full_name: "",
    username: "",
    bio: "",
    city: "",
    uefa_license: "",
  });
  const [settingsForm, setSettingsForm] =
    useState<SettingsForm>(defaultSettingsForm);

  useEffect(() => {
    if (!profile) return;

    setProfileForm({
      full_name: profile.full_name || "",
      username: profile.username || "",
      bio: profile.bio || "",
      city: profile.city || "",
      uefa_license: profile.uefa_license || "",
    });
  }, [
    profile?.bio,
    profile?.city,
    profile?.full_name,
    profile?.id,
    profile?.uefa_license,
    profile?.username,
  ]);

  useEffect(() => {
    if (!settings) return;

    const nextLanguage = settings.language as LanguageCode;
    setSettingsForm({
      new_messages: settings.new_messages,
      exercise_likes: settings.exercise_likes,
      new_followers: settings.new_followers,
      job_opportunities: settings.job_opportunities,
      platform_updates: settings.platform_updates,
      language: nextLanguage,
    });
    setLanguage(nextLanguage);
  }, [settings, setLanguage]);

  const handleProfileSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: profileForm.full_name.trim() || undefined,
        username: profileForm.username.trim() || undefined,
        bio: profileForm.bio.trim() || null,
        city: profileForm.city.trim() || null,
        uefa_license: profileForm.uefa_license || null,
      });
      toast({ title: "Profile updated" });
    } catch (updateError) {
      console.error("Failed to update profile:", updateError);
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  const handleNotificationToggle = async (
    key: NotificationKey,
    checked: boolean,
  ) => {
    const previous = settingsForm;
    setSettingsForm((current) => ({ ...current, [key]: checked }));

    try {
      await updateSettings.mutateAsync({ [key]: checked });
    } catch (updateError) {
      console.error("Failed to update notification settings:", updateError);
      setSettingsForm(previous);
      toast({
        title: "Failed to update notification setting",
        variant: "destructive",
      });
    }
  };

  const handleLanguageChange = async (value: string) => {
    const nextLanguage = value as LanguageCode;
    const previousLanguage = settingsForm.language;

    setLanguage(nextLanguage);
    setSettingsForm((current) => ({ ...current, language: nextLanguage }));

    try {
      await updateSettings.mutateAsync({ language: nextLanguage });
    } catch (updateError) {
      console.error("Failed to update language:", updateError);
      setLanguage(previousLanguage);
      setSettingsForm((current) => ({
        ...current,
        language: previousLanguage,
      }));
      toast({ title: "Failed to update language", variant: "destructive" });
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      await cancelSubscription.mutateAsync();
      toast({ title: "Subscription cancellation scheduled" });
    } catch (cancelError) {
      console.error("Failed to cancel subscription:", cancelError);
      toast({ title: "Failed to cancel subscription", variant: "destructive" });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const portal = await createBillingPortalSession.mutateAsync();
      window.location.href = portal.url;
    } catch (portalError) {
      console.error("Failed to open billing portal:", portalError);
      toast({ title: "Failed to open billing portal", variant: "destructive" });
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.",
      )
    ) {
      return;
    }

    const confirmation = window.prompt(
      "Type DELETE to permanently delete your account.",
    );

    if (confirmation !== "DELETE") {
      toast({ title: "Account deletion cancelled" });
      return;
    }

    try {
      await deleteAccount.mutateAsync({ confirmation });
      await signOut();
      navigate("/");
    } catch (deleteError) {
      console.error("Failed to delete account:", deleteError);
      toast({ title: "Failed to delete account", variant: "destructive" });
    }
  };

  if (isLoading || isSettingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || settingsError || !profile || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>
    );
  }

  const subscriptionEndsAt = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;
  const isSettingsPending = updateSettings.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.h1
        className="font-display text-2xl font-bold text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Settings
      </motion.h1>

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
              onChange={(event) =>
                setProfileForm({
                  ...profileForm,
                  full_name: event.target.value,
                })
              }
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Username</Label>
            <Input
              value={profileForm.username}
              onChange={(event) =>
                setProfileForm({
                  ...profileForm,
                  username: event.target.value,
                })
              }
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-foreground">Bio</Label>
            <Input
              value={profileForm.bio}
              onChange={(event) =>
                setProfileForm({ ...profileForm, bio: event.target.value })
              }
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">City</Label>
            <Input
              value={profileForm.city}
              onChange={(event) =>
                setProfileForm({ ...profileForm, city: event.target.value })
              }
              className="bg-muted/40 border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">UEFA License</Label>
            <Select
              value={profileForm.uefa_license || "none"}
              onValueChange={(value) =>
                setProfileForm({
                  ...profileForm,
                  uefa_license:
                    value === "none"
                      ? ""
                      : (value as "C" | "B" | "A" | "PRO"),
                })
              }
            >
              <SelectTrigger className="bg-muted/40 border-border text-foreground">
                <SelectValue placeholder="Select license" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No license</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="PRO">PRO</SelectItem>
              </SelectContent>
            </Select>
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
          {notificationItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item.label}</span>
              <Switch
                checked={settingsForm[item.key]}
                disabled={isSettingsPending}
                onCheckedChange={(checked) =>
                  handleNotificationToggle(item.key, checked)
                }
              />
            </div>
          ))}
        </div>
      </motion.div>

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
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div>
              <span className="text-sm font-semibold text-primary">
                {subscription.subscription_tier || "Free"}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subscription.status === "active"
                  ? `Active${
                      subscriptionEndsAt ? ` - Renews ${subscriptionEndsAt}` : ""
                    }`
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
                onClick={handleManageSubscription}
                disabled={createBillingPortalSession.isPending}
              >
                {createBillingPortalSession.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Manage"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No active subscription
          </div>
        )}
      </motion.div>

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
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Interface language
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Saved to your account and restored when you sign in.
            </p>
          </div>
          <Select
            value={settingsForm.language}
            onValueChange={handleLanguageChange}
            disabled={isSettingsPending}
          >
            <SelectTrigger className="w-[200px] bg-background border-border text-foreground hover:bg-muted/50 transition-colors">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {languages.map((language) => (
                <SelectItem
                  key={language.code}
                  value={language.code}
                  className="text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

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
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteAccount}
          disabled={deleteAccount.isPending}
        >
          {deleteAccount.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Delete Account
        </Button>
      </motion.div>
    </div>
  );
}
