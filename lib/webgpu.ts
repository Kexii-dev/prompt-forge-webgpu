export function isWebGPUSupported(): boolean {
  return !!navigator.gpu;
}

export async function requestAdapter(): Promise<GPUAdapter | null> {
  if (!navigator.gpu) return null;
  return await navigator.gpu.requestAdapter();
}

export async function getAdapterLimits(): Promise<GPUSupportedLimits | null> {
  const adapter = await requestAdapter();
  return adapter ? adapter.limits : null;
}
