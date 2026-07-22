import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Search, PlusCircle, Heart, User, Building2, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: PlusCircle, label: "List Item", href: "/listings/new", highlight: true },
    { icon: Heart, label: "Favourites", href: "/favourites" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.label} href={item.href} className="w-full h-full">
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer">
                {item.highlight ? (
                  <div className="bg-primary text-primary-foreground p-3 rounded-full -mt-6 shadow-lg shadow-primary/25 border-4 border-background">
                    <Icon className="w-6 h-6" />
                  </div>
                ) : (
                  <>
                    <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function TopNav() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            R
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block text-foreground">
            RentMitra
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/search" className={cn("text-sm font-medium transition-colors hover:text-primary", location.startsWith("/search") ? "text-primary" : "text-muted-foreground")}>
            Search
          </Link>
          {isAuthenticated && (
            <Link href="/favourites" className={cn("text-sm font-medium transition-colors hover:text-primary", location.startsWith("/favourites") ? "text-primary" : "text-muted-foreground")}>
              Favourites
            </Link>
          )}
          {user?.userType === 'admin' && (
            <Link href="/admin" className={cn("text-sm font-medium transition-colors hover:text-primary flex items-center gap-1", location.startsWith("/admin") ? "text-primary" : "text-muted-foreground")}>
              <LayoutDashboard className="w-4 h-4" /> Admin
            </Link>
          )}
          {user?.userType === 'business' && (
            <Link href="/dashboard" className={cn("text-sm font-medium transition-colors hover:text-primary flex items-center gap-1", location.startsWith("/dashboard") ? "text-primary" : "text-muted-foreground")}>
              <Building2 className="w-4 h-4" /> Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/listings/new" className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold transition-colors">
                <PlusCircle className="w-4 h-4" />
                List Item
              </Link>
              <Link href="/profile" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors px-3 py-2">
                Log in
              </Link>
              <Link href="/register" className="bg-foreground text-background px-4 py-2 rounded-full text-sm font-semibold hover:bg-foreground/90 transition-colors">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 w-full pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
