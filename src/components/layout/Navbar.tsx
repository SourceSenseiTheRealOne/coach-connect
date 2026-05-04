import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { getInitials } from "@/lib/utils";

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: t("navigation.home"), path: "/" },
    { label: t("navigation.about"), path: "/about" },
    { label: t("navigation.features"), path: "/features" },
    { label: t("navigation.pricing"), path: "/pricing" },
  ];

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(t("errors.failedToSignOut"));
    } else {
      toast.success(t("common.signingOut"));
      navigate("/");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border/80 shadow-[0_1px_0_0_hsl(var(--border)/0.6)]"
          : "bg-background/40 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-[72px]">
        {/* Logo lockup */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.55)] transition-transform duration-300 group-hover:-rotate-3">
            <span className="font-display italic font-semibold text-primary-foreground text-[15px] leading-none">
              cc
            </span>
            <span className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 rounded-full bg-secondary ring-2 ring-background" />
          </div>
          <span className="font-display text-[20px] font-semibold tracking-tight text-foreground leading-none">
            Coach<span className="italic text-primary">Connect</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 rounded-full border border-border/70 bg-card/60 px-1.5 py-1.5 shadow-sm backdrop-blur">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-1.5 rounded-full text-[13px] font-medium tracking-tight transition-colors duration-200 ${
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-foreground" />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher variant="minimal" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-card"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </Button>

          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0 ring-1 ring-border hover:ring-primary/50 transition-all"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.full_name || "User"}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(profile, user)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-60 rounded-xl border-border/80"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name ||
                        profile?.username ||
                        t("common.user")}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  {t("common.dashboard")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard/settings")}
                  className="cursor-pointer"
                >
                  {t("navigation.settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
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
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  {t("navigation.signIn")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  size="sm"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-[0_8px_24px_-8px_hsl(var(--foreground)/0.4)] transition-all"
                >
                  {t("navigation.getStarted")}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/60 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-border/70 bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="flex-1 rounded-xl border-border"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" /> {t("common.lightMode")}
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" /> {t("common.darkMode")}
                  </>
                )}
              </Button>
              <div className="rounded-xl border border-border px-2 py-1">
                <LanguageSwitcher variant="minimal" />
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
              {loading ? (
                <div className="flex-1 flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : user ? (
                <>
                  <Link to="/dashboard" className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl"
                    >
                      {t("common.dashboard")}
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 rounded-xl"
                    onClick={handleSignOut}
                  >
                    {t("common.signOut")}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl"
                    >
                      {t("navigation.signIn")}
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1">
                    <Button
                      size="sm"
                      className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
                    >
                      {t("navigation.getStarted")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
