"use client";

import { useAppStore } from "@/store/useAppStore";
import { EndpointEditor } from "@/components/endpoint/EndpointEditor";
import { useParams } from "next/navigation";

export default function EndpointPage() {
  const params = useParams();
  const endpointId = params.endpointId as string;
  const { endpoints } = useAppStore();

  const endpoint = endpoints[endpointId];

  if (!endpoint) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-lg font-semibold text-(--text-primary)">Endpoint not found</h2>
        <p className="text-sm text-(--text-muted) mt-2">The endpoint you are looking for does not exist or has been deleted.</p>
      </div>
    );
  }

  return <EndpointEditor endpoint={endpoint} />;
}
