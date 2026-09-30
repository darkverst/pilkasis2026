"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared SSR-safe hook for determining whether the component has mounted on
 * the client AND whether WebGL is available.
 *
 * Uses `useSyncExternalStore` with a real subscribe function that triggers
 * a re-render on the first animation frame after hydration. This avoids the
 * `react-hooks/set-state-in-effect` lint error while ensuring the component
 * re-renders after hydration to show the WebGL canvas.
 */

let clientMounted = false;
let webglAvailable = false;
const listeners = new Set<() => void>();
let initialized = false;

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    return !!gl;
  } catch {
    return false;
  }
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  // Schedule the mount transition on the next animation frame so it
  // happens after React hydration completes.
  requestAnimationFrame(() => {
    clientMounted = true;
    webglAvailable = detectWebGL();
    listeners.forEach((l) => l());
  });
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  ensureInitialized();
  return () => {
    listeners.delete(callback);
  };
}

function getMountedSnapshot(): boolean {
  return clientMounted;
}

function getWebGLSnapshot(): boolean {
  return webglAvailable;
}

function getServerSnapshot(): boolean {
  return false;
}

export interface WebGLReadyState {
  mounted: boolean;
  webglOk: boolean;
}

export function useWebGLReady(): WebGLReadyState {
  const mounted = useSyncExternalStore(
    subscribe,
    getMountedSnapshot,
    getServerSnapshot,
  );
  const webglOk = useSyncExternalStore(
    subscribe,
    getWebGLSnapshot,
    getServerSnapshot,
  );
  return { mounted, webglOk };
}
