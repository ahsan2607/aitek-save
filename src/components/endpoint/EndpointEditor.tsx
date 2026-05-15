"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runEndpoint } from "@/lib/runner";
import { cn } from "@/lib/utils";
import { MethodSelector } from "@/components/ui/MethodSelector";
import { KeyValueEditor } from "@/components/ui/KeyValueEditor";
import { AuthPanel } from "./AuthPanel";
import { ResponsePanel } from "./ResponsePanel";
import {
  Send, Trash2, Copy,
  AlignLeft, List, Lock, Code2,
} from "lucide-react";
import type { Endpoint, ContentType, EndpointResponse } from "@/types";
import toast from "react-hot-toast";

interface EndpointEditorProps {
  endpoint: Endpoint;
}

type RequestTab = "params" | "headers" | "auth" | "body";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "application/json", label: "JSON" },
  { value: "application/x-www-form-urlencoded", label: "Form URL Encoded" },
  { value: "multipart/form-data", label: "Form Data" },
  { value: "text/plain", label: "Plain Text" },
  { value: "none", label: "None" },
];

export function EndpointEditor({ endpoint }: EndpointEditorProps) {
  const { updateEndpoint, setEndpointResponse, deleteEndpoint, duplicateEndpoint, projects } = useAppStore();
  const [requestTab, setRequestTab] = useState<RequestTab>("params");
  const [isLoading, setIsLoading] = useState(false);
  const [liveResponse, setLiveResponse] = useState<EndpointResponse | undefined>(
    endpoint.lastResponse
  );

  const project = projects[endpoint.projectId];

  // Generic field updater
  const update = useCallback(
    <K extends keyof Endpoint>(field: K, value: Endpoint[K]) => {
      updateEndpoint(endpoint.id, { [field]: value } as Partial<Endpoint>);
    },
    [endpoint.id, updateEndpoint]
  );

  async function handleSend() {
    if (!endpoint.url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    try {
      const res = await runEndpoint(endpoint, project?.envVars ?? []);
      setLiveResponse(res);
      setEndpointResponse(endpoint.id, res);
      toast.success(`${res.status} ${res.statusText}`, {
        icon: res.status < 400 ? "✅" : "⚠️",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast.error(message);
      setLiveResponse(undefined);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete() {
    if (!confirm(`Delete endpoint "${endpoint.name}"?`)) return;
    deleteEndpoint(endpoint.id);
    toast.success("Endpoint deleted");
  }

  const hasBody = !["GET", "HEAD", "OPTIONS"].includes(endpoint.method);

  const TAB_ICONS: Record<RequestTab, React.ReactNode> = {
    params: <List className="w-3 h-3" />,
    headers: <AlignLeft className="w-3 h-3" />,
    auth: <Lock className="w-3 h-3" />,
    body: <Code2 className="w-3 h-3" />,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: Name + Actions */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-(--border) bg-(--bg-surface) shrink-0">
        <input
          type="text"
          value={endpoint.name}
          onChange={(e) => update("name", e.target.value)}
          className="flex-1 text-sm font-semibold bg-transparent text-(--text-primary) outline-none placeholder:text-(--text-muted) min-w-0"
          placeholder="Endpoint name"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { duplicateEndpoint(endpoint.id); toast.success("Duplicated"); }}
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-overlay) transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* URL bar */}
      <div className="flex items-stretch gap-0 px-5 py-3 border-b border-(--border) shrink-0">
        <MethodSelector
          value={endpoint.method}
          onChange={(m) => update("method", m)}
        />
        <input
          type="text"
          value={endpoint.url}
          onChange={(e) => update("url", e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 px-4 py-2 bg-(--bg-elevated) border border-l-0 border-(--border) text-sm font-mono text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2 rounded-r-xl bg-(--accent) text-white text-sm font-semibold hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-(--accent-glow) border border-l-0 border-(--accent) shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          {isLoading ? "Sending…" : "Send"}
        </button>
      </div>

      {/* Main content: request config + response */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Request tabs */}
        <div className="flex items-center gap-0.5 px-5 py-2 border-b border-(--border) bg-(--bg-surface) shrink-0">
          {(["params", "headers", "auth", ...(hasBody ? ["body" as RequestTab] : [])] as RequestTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setRequestTab(t)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                requestTab === t
                  ? "bg-(--bg-overlay) text-(--text-primary)"
                  : "text-(--text-muted) hover:text-(--text-primary)"
              )}
            >
              {TAB_ICONS[t]}
              {t}
              {t === "params" && endpoint.queryParams.filter((p) => p.enabled && p.key).length > 0 && (
                <span className="bg-(--accent) text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {endpoint.queryParams.filter((p) => p.enabled && p.key).length}
                </span>
              )}
              {t === "headers" && endpoint.headers.filter((h) => h.enabled && h.key).length > 0 && (
                <span className="bg-(--accent) text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {endpoint.headers.filter((h) => h.enabled && h.key).length}
                </span>
              )}
              {t === "auth" && endpoint.auth.type !== "none" && (
                <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
              )}
            </button>
          ))}
        </div>

        {/* Split: request config top, response bottom */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Request config panel */}
          <div className="flex-1 overflow-y-auto p-5 border-b border-(--border) min-h-0" style={{ maxHeight: "50%" }}>
            {requestTab === "params" && (
              <KeyValueEditor
                pairs={endpoint.queryParams}
                onChange={(v) => update("queryParams", v)}
                label="Query Parameters"
                keyPlaceholder="param_name"
                valuePlaceholder="value"
              />
            )}

            {requestTab === "headers" && (
              <KeyValueEditor
                pairs={endpoint.headers}
                onChange={(v) => update("headers", v)}
                label="Headers"
                keyPlaceholder="Header-Name"
                valuePlaceholder="value"
              />
            )}

            {requestTab === "auth" && (
              <AuthPanel
                auth={endpoint.auth}
                onChange={(a) => update("auth", a)}
              />
            )}

            {requestTab === "body" && hasBody && (
              <div className="space-y-4">
                {/* Content type */}
                <div>
                  <label className="block text-xs font-medium text-(--text-muted) uppercase tracking-wider mb-2">
                    Content Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTENT_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => update("contentType", ct.value)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium border transition-colors",
                          endpoint.contentType === ct.value
                            ? "bg-(--accent-glow) border-(--accent) text-(--accent)"
                            : "border-(--border) text-(--text-muted) hover:text-(--text-primary)"
                        )}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body editor */}
                {endpoint.contentType === "application/x-www-form-urlencoded" ||
                endpoint.contentType === "multipart/form-data" ? (
                  <KeyValueEditor
                    pairs={endpoint.formData}
                    onChange={(v) => update("formData", v)}
                    label="Form Fields"
                    keyPlaceholder="field_name"
                    valuePlaceholder="value"
                  />
                ) : endpoint.contentType !== "none" ? (
                  <div>
                    <label className="block text-xs font-medium text-(--text-muted) uppercase tracking-wider mb-2">
                      Body
                    </label>
                    <textarea
                      value={endpoint.body}
                      onChange={(e) => update("body", e.target.value)}
                      placeholder={
                        endpoint.contentType === "application/json"
                          ? '{\n  "key": "value"\n}'
                          : "Request body..."
                      }
                      rows={8}
                      className="w-full px-3 py-2.5 rounded-lg bg-(--bg-surface) border border-(--border) text-sm font-mono text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) resize-y transition-colors"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-(--text-muted) py-4 text-center">
                    No body will be sent with this request.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Response panel */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ minHeight: "50%" }}>
            <div className="px-5 py-2 border-b border-(--border) bg-(--bg-surface) flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
                Response
              </span>
            </div>
            <ResponsePanel response={liveResponse} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
