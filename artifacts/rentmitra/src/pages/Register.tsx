import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, RegisterInputUserType } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input, Button, Label } from "@/components/ui/ui-core";
import { toast } from "sonner";
import { User, Mail, Lock, Phone } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    userType: "individual" as RegisterInputUserType
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: formData }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast.success("Account created successfully!");
        setLocation("/");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to create account");
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-4 max-w-md mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground mt-2">Join RentMitra to start renting</p>
      </div>

      <div className="flex bg-secondary p-1 rounded-full mb-6">
        <button
          onClick={() => setFormData(p => ({ ...p, userType: "individual" }))}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${formData.userType === 'individual' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
        >
          Individual
        </button>
        <button
          onClick={() => setFormData(p => ({ ...p, userType: "business" }))}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${formData.userType === 'business' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
        >
          Business
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} 
              className="pl-10"
              placeholder="Rajesh Kumar"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              type="email" 
              required 
              value={formData.email} 
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} 
              className="pl-10"
              placeholder="rajesh@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Phone (optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              type="tel" 
              value={formData.phone} 
              onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} 
              className="pl-10"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              type="password" 
              required 
              minLength={8}
              value={formData.password} 
              onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} 
              className="pl-10"
              placeholder="••••••••"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full mt-4" isLoading={registerMutation.isPending}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
