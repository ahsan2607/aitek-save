"use client";

import type { AuthConfig, AuthType } from "@/types";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface AuthPanelProps {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: "none", label: "No Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
  { value: "api-key", label: "API Key" },
];

function Field({
  label, value, onChange, placeholder, secret = false, mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret?: boolean;
  mono?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="block text-xs font-medium text-(--text-secondary) mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={secret && !show ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full px-3 py-2 rounded-lg bg-(--bg-surface) border border-(--border) text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors",
            mono && "font-mono",
            secret && "pr-9"
          )}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary)"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function AuthPanel({ auth, onChange }: AuthPanelProps) {
  function update(partial: Partial<AuthConfig>) {
    onChange({ ...auth, ...partial });
  }

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-(--bg-surface) border border-(--border)">
        {AUTH_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => update({ type: t.value })}
            className={cn(
              "flex-1 py-1.5 rounded-md text-xs font-medium transition-colors",
              auth.type === t.value
                ? "bg-(--accent) text-white"
                : "text-(--text-muted) hover:text-(--text-primary)"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Fields */}
      {auth.type === "none" && (
        <p className="text-xs text-(--text-muted) py-4 text-center">
          This request will be sent without any authentication.
        </p>
      )}

      {auth.type === "bearer" && (
        <Field
          label="Token"
          value={auth.bearerToken ?? ""}
          onChange={(v) => update({ bearerToken: v })}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          secret
          mono
        />
      )}

      {auth.type === "basic" && (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Username"
            value={auth.basicUsername ?? ""}
            onChange={(v) => update({ basicUsername: v })}
            placeholder="username"
          />
          <Field
            label="Password"
            value={auth.basicPassword ?? ""}
            onChange={(v) => update({ basicPassword: v })}
            placeholder="password"
            secret
          />
        </div>
      )}

      {auth.type === "api-key" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Key Name"
              value={auth.apiKeyName ?? ""}
              onChange={(v) => update({ apiKeyName: v })}
              placeholder="X-API-Key"
              mono
            />
            <Field
              label="Value"
              value={auth.apiKeyValue ?? ""}
              onChange={(v) => update({ apiKeyValue: v })}
              placeholder="sk-..."
              secret
              mono
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-(--text-secondary) mb-1.5">
              Add to
            </label>
            <div className="flex gap-2">
              {(["header", "query"] as const).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => update({ apiKeyIn: loc })}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    auth.apiKeyIn === loc || (!auth.apiKeyIn && loc === "header")
                      ? "bg-(--accent-glow) border-(--accent) text-(--accent)"
                      : "border-(--border) text-(--text-muted) hover:text-(--text-primary)"
                  )}
                >
                  {loc === "header" ? "Header" : "Query Param"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
