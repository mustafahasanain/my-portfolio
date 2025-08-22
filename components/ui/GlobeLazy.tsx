"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { GlobeConfig } from "./Globe";

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

const GlobeComponent = dynamic(
  () => import("./Globe").then((mod) => ({ default: mod.World })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-[400px] bg-gradient-to-b from-transparent to-neutral-900/20 rounded-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm text-neutral-400">
            Loading interactive globe...
          </p>
        </div>
      </div>
    ),
  }
);

export function LazyGlobe(props: WorldProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-[400px] bg-gradient-to-b from-transparent to-neutral-900/20 rounded-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm text-neutral-400">
              Loading interactive globe...
            </p>
          </div>
        </div>
      }
    >
      <GlobeComponent {...props} />
    </Suspense>
  );
}
