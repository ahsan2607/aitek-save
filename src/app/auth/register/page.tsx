"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const registerMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/api/v1/auth/register`, {
        name,
        email,
        password,
      });
    },
    onSuccess: () => {
      toast.success("Account created successfully! Please login.");
      router.push("/auth/login");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    registerMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-(--text-primary)">Create Account</h1>
        <p className="text-xs text-(--text-muted)">Join AitekSave to manage your IoT devices</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider ml-1">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-(--bg-elevated) border border-(--border) text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider ml-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-(--bg-elevated) border border-(--border) text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider ml-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              required
              minLength={4}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-(--bg-elevated) border border-(--border) text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-all"
            />
          </div>
          <p className="text-[10px] text-(--text-muted) ml-1">Minimum 4 characters</p>
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full py-3 rounded-xl bg-(--accent) text-white font-semibold text-sm shadow-(--accent-glow) hover:bg-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Register"
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-xs text-(--text-muted)">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-(--accent) font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
