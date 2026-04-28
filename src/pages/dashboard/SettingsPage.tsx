import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const sections = [
  { icon: User, label: "Profile" },
  { icon: Bell, label: "Notifications" },
  { icon: Shield, label: "Privacy" },
  { icon: CreditCard, label: "Subscription" },
  { icon: Globe, label: "Language" },
];

export default function SettingsPage() {
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
              defaultValue="José Mourinho"
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Username</Label>
            <Input
              defaultValue="josemourinho"
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-foreground">Bio</Label>
            <Input
              defaultValue="Experienced football coach passionate about youth development."
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">City</Label>
            <Input
              defaultValue="Lisboa"
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">UEFA License</Label>
            <Input
              defaultValue="PRO"
              className="bg-secondary border-border text-foreground"
            />
          </div>
        </div>
        <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
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
            "New messages",
            "Exercise likes",
            "New followers",
            "Job opportunities",
            "Platform updates",
          ].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item}</span>
              <Switch />
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
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div>
            <span className="text-sm font-semibold text-primary">
              Premium Coach
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              €7.99/month · Renews April 22, 2026
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-border text-foreground hover:bg-secondary"
          >
            Manage
          </Button>
        </div>
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
        <Button variant="destructive" size="sm">
          Delete Account
        </Button>
      </motion.div>
    </div>
  );
}
