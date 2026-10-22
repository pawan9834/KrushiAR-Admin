import { Suspense } from "react";
import { INITIAL_SEEDS } from "@/lib/mockData";
import { SeedDetailClient } from "./SeedDetailClient";

export function generateStaticParams() {
  return INITIAL_SEEDS.map((s) => ({
    id: s.id,
  }));
}

export default function SeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8 text-xs text-slate-500">Loading seed variety details...</div>}>
      <SeedDetailClient params={params} />
    </Suspense>
  );
}
