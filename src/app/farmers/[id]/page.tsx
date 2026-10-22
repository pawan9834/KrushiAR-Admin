import { Suspense } from "react";
import { FarmerDetailClient } from "./FarmerDetailClient";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 text-xs text-slate-500">
          Loading farmer audit details...
        </div>
      }
    >
      <FarmerDetailClient params={params} />
    </Suspense>
  );
}
