import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have the tokens in the URL
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setIsValidToken(false);
      return;
    }

    // Set the session with the tokens from the URL
    const setSession = async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("Error setting session:", error);
        setIsValidToken(false);
      } else {
        setIsValidToken(true);
      }
    };

    setSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message || "Failed to update password");
      setIsLoading(false);
      return;
    }

    setIsSuccess(true);
    setIsLoading(false);
    toast.success("Password updated successfully!");
  };

  // Loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid or expired token
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground">
                  EC
                </span>
              </div>
            </Link>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Invalid Link
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              This password reset link is invalid or has expired
            </p>
          </div>

          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground text-sm mb-6">
              Please request a new password reset link.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full bg-primary text-primary-foreground">
                Request New Link
              </Button>
            </Link>
            <Link
              to="/login"
              className="block mt-4 text-sm text-primary hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground">
                  EC
                </span>
              </div>
            </Link>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Password Updated
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your password has been successfully updated
            </p>
          </div>

          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              You can now sign in with your new password.
            </p>
            <Link to="/login">
              <Button className="w-full bg-primary text-primary-foreground">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-primary-foreground">
                EC
              </span>
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Set New Password
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your new password below
          </p>
        </div>

        <div className="glass-card p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                New Password
              </Label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Password <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
