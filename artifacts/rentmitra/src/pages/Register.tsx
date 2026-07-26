import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, useSendOtp, RegisterInputUserType } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input, Button, Label } from "@/components/ui/ui-core";
import { toast } from "sonner";
import { User, Mail, Lock, Phone, ArrowRight, Building2, ShieldCheck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Step = "form" | "otp";

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();
  const sendOtpMutation = useSendOtp();

  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    userType: "individual" as RegisterInputUserType,
  });
  const [otp, setOtp] = useState("");

  const update = (k: keyof typeof formData, v: string) =>
    setFormData((p) => ({ ...p, [k]: v }));

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.phone) {
      toast.error("Please fill in your email and phone number first.");
      return;
    }
    sendOtpMutation.mutate(
      { data: { email: formData.email, phone: formData.phone } },
      {
        onSuccess: () => {
          setStep("otp");
          toast.success("OTP sent! Check your email inbox.");
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error || "Failed to send OTP"),
      }
    );
  };

  const handleResendOtp = () => {
    sendOtpMutation.mutate(
      { data: { email: formData.email, phone: formData.phone } },
      {
        onSuccess: () => toast.success("New OTP sent to your email."),
        onError: (err: any) =>
          toast.error(err?.response?.data?.error || "Failed to resend OTP"),
      }
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP sent to your email.");
      return;
    }
    registerMutation.mutate(
      { data: { ...formData, otp } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast.success("Account created! Welcome aboard 🎉");
          setLocation("/");
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error || "Failed to create account"),
      }
    );
  };

  return (
    <div className="min-h-[90dvh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

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
          <h1 className="text-2xl font-extrabold tracking-tight">Create account</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Join thousands renting across India</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-7 shadow-xl shadow-black/5">
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                {/* Type toggle */}
                <div className="flex bg-secondary p-1 rounded-full mb-5 gap-1">
                  {(["individual", "business"] as RegisterInputUserType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update("userType", t)}
                      className={cn(
                        "flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5",
                        formData.userType === t
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t === "business" ? (
                        <Building2 className="w-3.5 h-3.5" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <Label>
                      {formData.userType === "business" ? "Business Name" : "Full Name"}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => update("name", e.target.value)}
                        className="pl-10"
                        placeholder={
                          formData.userType === "business" ? "Acme Rentals Pvt Ltd" : "Rajesh Kumar"
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="pl-10"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="pl-10"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        required
                        minLength={8}
                        value={formData.password}
                        onChange={(e) => update("password", e.target.value)}
                        className="pl-10"
                        placeholder="Min 8 characters"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-2 gap-2"
                    isLoading={sendOtpMutation.isPending}
                  >
                    Send OTP to Email <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25 }}
              >
                {/* OTP step */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-lg font-bold">Check your email</h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-foreground">{formData.email}</span>
                  </p>
                </div>

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <Label>Enter OTP</Label>
                    <Input
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-center text-2xl font-bold tracking-[0.5em] h-14"
                      placeholder="──────"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                    <p className="text-xs text-muted-foreground text-center pt-0.5">
                      Code expires in 10 minutes
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={otp.length !== 6}
                    isLoading={registerMutation.isPending}
                  >
                    Create Account <ArrowRight className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => { setStep("form"); setOtp(""); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Change details
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={sendOtpMutation.isPending}
                      className="flex items-center gap-1.5 text-primary font-semibold hover:underline disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Resend OTP
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground font-medium">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> &amp;{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  );
}
