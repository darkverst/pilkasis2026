"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared SSR-safe hook for determining whether the component has mounted on
 * the client AND whether WebGL is available.
 *
 * Uses `useSyncExternalStore` so that:
 *   - On the server, both values are `false`.
 *   - During client hydration, both values are `false` (matches SSR — no
 *     hydration mismatch).
 *   - After hydration, `mounted` flips to `true` and `webglOk` reflects the
 *     actual WebGL availability.
 *
 * This avoids the `react-hooks/set-state-in-effect` lint error that arises
 * when using `useEffect + setState(true)` to track mounting.
 */

let cachedWebGL: boolean | null = null;

function detectWebGLClient(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

function emptySubscribe(): () => void {
  return () => {};
}

function getMountedSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

function getWebGLSnapshot(): boolean {
  if (cachedWebGL === null) {
    cachedWebGL = detectWebGLClient();
  }
  return cachedWebGL;
}

export interface WebGLReadyState {
  /** True after hydration on the client. Always false on the server. */
  mounted: boolean;
  /** True if WebGL is available on the client. Always false on the server. */
  webglOk: boolean;
}

export function useWebGLReady(): WebGLReadyState {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getMountedSnapshot,
    getServerSnapshot
  );
  const webglOk = useSyncExternalStore(
    emptySubscribe,
    getWebGLSnapshot,
    getServerSnapshot
  );
  return { mounted, webglOk };
}
