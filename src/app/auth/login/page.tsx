"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setAuth } = useAppStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async () => {
      // The API expects a JSON body for login based on the spec
      return api.post<{ access_token: string; refresh_token: string; user: any }>("/api/v1/auth/login", {
        email,
        password,
      });
    },
    onSuccess: (data) => {
      // The API returns the tokens and user info wrapped in a 'data' field
      const responseData = (data as any).data;
      setAuth(
        responseData?.user || null,
        responseData?.access_token || null,
        responseData?.refresh_token || null
      );
      toast.success("Welcome back!");
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-(--text-primary)">Login</h1>
        <p className="text-xs text-(--text-muted)">Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-(--bg-elevated) border border-(--border) text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full py-3 rounded-xl bg-(--accent) text-white font-semibold text-sm shadow-(--accent-glow) hover:bg-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-xs text-(--text-muted)">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-(--accent) font-semibold hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
