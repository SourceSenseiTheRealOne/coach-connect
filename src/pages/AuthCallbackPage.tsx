import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          toast.error("Authentication failed. Please try again.");
          navigate("/login", { replace: true });
          return;
        }

        if (session) {
          // Check if user has a profile, if not create one
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!profile && !profileError) {
            // Create profile from OAuth user data
            const metadata = session.user.user_metadata;
            const { error: createError } = await supabase
              .from("profiles")
              .insert({
                id: session.user.id,
                email: session.user.email || "",
                username:
                  metadata?.username || session.user.email?.split("@")[0] || "",
                full_name: metadata?.full_name || metadata?.name || "",
                user_type: metadata?.user_type || "coach",
                country: "Portugal",
                avatar_url: metadata?.avatar_url || metadata?.picture || "",
              } as never);

            if (createError) {
              console.error("Error creating profile:", createError);
            }
          }

          toast.success("Successfully signed in!");
          navigate("/dashboard", { replace: true });
        } else {
          // No session, try to exchange the code from URL
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1),
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              toast.error("Authentication failed. Please try again.");
              navigate("/login", { replace: true });
              return;
            }

            toast.success("Successfully signed in!");
            navigate("/dashboard", { replace: true });
          } else {
            toast.error("No authentication data found.");
            navigate("/login", { replace: true });
          }
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        toast.error("An unexpected error occurred.");
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h2 className="font-display text-xl font-semibold text-foreground">
        Completing sign in...
      </h2>
      <p className="text-muted-foreground text-sm mt-1">
        Please wait while we verify your account
      </p>
    </div>
  );
}
