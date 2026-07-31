import { useState } from "react";
import { trackCustom } from "@/lib/metaPixel";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input, Button, Label } from "@/components/ui/ui-core";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => { login(data.token, data.user); trackCustom("Login"); toast.success("Welcome back!"); setLocation("/"); },
      onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to sign in"),
    });
  };

  return (
    <div className="min-h-[90dvh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-6">
            <div style={{ overflow: "hidden", height: 48, width: 192 }}>
              <img
                src="/rentnearn-logo.jpg"
                alt="RentNEarn"
                draggable={false}
                style={{ height: 156, width: "auto", marginTop: -36, mixBlendMode: "multiply" }}
              />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl p-7 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10" placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label>Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10" placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-2 gap-2" isLoading={loginMutation.isPending}>
              Sign in <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground font-medium">or</span></div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New to RentNEarn?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">Create account</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> &amp; <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  );
}
