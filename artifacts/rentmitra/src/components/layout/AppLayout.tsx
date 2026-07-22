import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Search, PlusCircle, Heart, User, Building2, LayoutDashboard, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Footer from "./Footer";
import CookieConsent from "@/components/CookieConsent";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { icon: Home,       label: "Home",       href: "/" },
    { icon: Search,     label: "Search",     href: "/search" },
    { icon: PlusCircle, label: "List",        href: "/listings/new", highlight: true },
    { icon: Heart,      label: "Saved",      href: "/favourites" },
    { icon: User,       label: "Profile",    href: "/profile" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      {/* Glass bar */}
      <div className="glass border-t-0 mx-3 mb-3 rounded-2xl shadow-2xl shadow-black/20">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.label} href={item.href} className="w-full h-full">
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer relative">
                  {item.highlight ? (
                    <motion.div
                      whileTap={{ scale: 0.88 }}
                      className="gradient-primary text-white p-3.5 rounded-2xl -mt-8 shadow-lg shadow-primary/30 shine-on-hover"
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-pill"
                          className="absolute inset-x-1 top-1.5 h-1 rounded-full bg-primary"
                          transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                        />
                      )}
                      <Icon className={cn("w-5 h-5 transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-[10px] font-semibold tracking-tight transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground/70")}>
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
    </div>
  );
}

export function TopNav() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { label: "Search",     href: "/search" },
    { label: "Categories", href: "/categories" },
    { label: "Pricing",    href: "/pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-b shadow-sm shadow-black/5 dark:shadow-black/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white font-black text-base shadow-md shadow-primary/30 shine-on-hover">
              R
            </div>
            <span className="font-extrabold text-[1.15rem] tracking-tight hidden sm:block">
              Rent<span className="gradient-text">Mitra</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  location.startsWith(link.href)
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user?.userType === "admin" && (
              <Link
                href="/admin"
                className={cn(
                  "px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                  location.startsWith("/admin")
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
            {user?.userType === "business" && (
              <Link
                href="/dashboard"
                className={cn(
                  "px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                  location.startsWith("/dashboard")
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Building2 className="w-3.5 h-3.5" /> Dashboard
              </Link>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <Link
                  href="/listings/new"
                  className="hidden md:flex items-center gap-1.5 gradient-primary text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-px transition-all duration-200 shine-on-hover"
                >
                  <PlusCircle className="w-4 h-4" />
                  List Item
                </Link>
                <Link
                  href="/profile"
                  className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all duration-200"
                >
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4.5 h-4.5 text-muted-foreground" />
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="gradient-primary text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-px transition-all duration-200 shine-on-hover"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 w-full pb-24 md:pb-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <CookieConsent />
    </div>
  );
}
