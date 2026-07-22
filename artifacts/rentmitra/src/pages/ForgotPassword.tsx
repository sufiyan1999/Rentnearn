import { useState } from "react";
import { Link } from "wouter";
import { Input, Button, Label } from "@/components/ui/ui-core";
import { Mail } from "lucide-react";
import { useForgotPassword } from "@workspace/api-client-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const forgotMutation = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotMutation.mutate({ data: { email } }, {
      onSuccess: () => {
        toast.success("Password reset link sent to your email!");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to send reset link");
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-4 max-w-md mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground mt-2">Enter your email and we'll send you a link to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="pl-10"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full mt-4" isLoading={forgotMutation.isPending}>
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Remember your password?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
