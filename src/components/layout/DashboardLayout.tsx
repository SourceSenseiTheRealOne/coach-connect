import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  BookOpen,
  Target,
  Calendar,
  MessageSquare,
  Briefcase,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingBag,
  Users,
  Bell,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const sidebarLinks = [
  { icon: Home, label: "Feed", path: "/dashboard/feed" },
  { icon: BookOpen, label: "Exercises", path: "/dashboard/exercises" },
  { icon: Target, label: "Tactic Board", path: "/dashboard/tactic-board" },
  { icon: Calendar, label: "Planner", path: "/dashboard/planner" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
  { icon: Briefcase, label: "Jobs", path: "/dashboard/jobs" },
  { icon: ShoppingBag, label: "Marketplace", path: "/dashboard/marketplace" },
  { icon: Users, label: "Forum", path: "/dashboard/forum" },
  { icon: User, label: "Profile", path: "/dashboard/profile" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out. Please try again.");
      setIsSigningOut(false);
    } else {
      toast.success("Signed out successfully");
      navigate("/", { replace: true });
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-primary-foreground text-sm">
                EC
              </span>
            </div>
            <span className="font-display font-bold text-foreground">
              Elite<span className="text-primary">Connect</span>
            </span>
          </Link>
          <button
            className="lg:hidden text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col p-3 gap-1 flex-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full text-left disabled:opacity-50"
          >
            {isSigningOut ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogOut size={18} />
            )}
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 glass-card rounded-none border-x-0 border-t-0 flex items-center px-4 gap-4">
          <button
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button className="relative text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              3
            </span>
          </button>
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={profile?.avatar_url || undefined}
              alt={profile?.full_name || "User"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
