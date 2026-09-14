export function isWebGPUSupportedSync(): boolean {
  return !!navigator.gpu;
}

// Détection fiable : `"gpu" in navigator` ne suffit pas (Brave ment parfois).
// `requestAdapter()` null = pas de WebGPU réel.
export async function isWebGPUSupported(): Promise<boolean> {
  return (await requestAdapter()) !== null;
}

export async function requestAdapter(): Promise<GPUAdapter | null> {
  if (!navigator.gpu) return null;
  return await navigator.gpu.requestAdapter();
}

export async function getAdapterLimits(): Promise<GPUSupportedLimits | null> {
  const adapter = await requestAdapter();
  return adapter ? adapter.limits : null;
}
