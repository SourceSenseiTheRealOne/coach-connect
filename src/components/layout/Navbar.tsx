import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X, LogOut, User, Loader2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { toast } from "sonner";

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();

  const navLinks = [
    { label: t("navigation.home"), path: "/" },
    { label: t("navigation.about"), path: "/about" },
    { label: t("navigation.features"), path: "/features" },
    { label: t("navigation.pricing"), path: "/pricing" },
  ];
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(t("errors.failedToSignOut"));
    } else {
      toast.success(t("common.signingOut"));
      navigate("/");
    }
  };

  const getInitials = () => {
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
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 rounded-none border-x-0">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-display font-bold text-primary-foreground text-sm">
              EC
            </span>
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            Elite<span className="text-primary">Connect</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language switcher */}
          <LanguageSwitcher variant="minimal" />
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.full_name || "User"}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name ||
                        profile?.username ||
                        t("common.user")}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <User className="mr-2 h-4 w-4" />
                  {t("common.dashboard")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard/settings")}
                >
                  {t("navigation.settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("navigation.signIn")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t("navigation.getStarted")}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-card border-t border-border rounded-none animate-fade-in">
          <div className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* Mobile theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full border-border text-foreground justify-start"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  {t("common.lightMode")}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  {t("common.darkMode")}
                </>
              )}
            </Button>
            {/* Mobile language switcher */}
            <div className="px-4 py-2">
              <LanguageSwitcher variant="minimal" />
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-border">
              {loading ? (
                <div className="flex-1 flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : user ? (
                <>
                  <Link
                    to="/dashboard/profile"
                    className="flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-border text-foreground"
                    >
                      {t("common.dashboard")}
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                  >
                    {t("common.signOut")}
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-border text-foreground"
                    >
                      {t("navigation.signIn")}
                    </Button>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      size="sm"
                      className="w-full bg-primary text-primary-foreground"
                    >
                      {t("navigation.getStarted")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
