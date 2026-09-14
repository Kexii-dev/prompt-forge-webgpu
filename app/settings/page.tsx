'use client';

import { useState, useEffect } from 'react';
import { isWebGPUSupported, getAdapterLimits } from '../../lib/webgpu';
import { models } from '../../lib/models';

const card = 'rounded-xl border border-[#232830] bg-[#12151a] p-4 md:p-5';
const h2 = 'mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#8b94a1]';

export default function SettingsPage() {
  const [webGPUSupported, setWebGPUSupported] = useState(false);
  const [adapterLimits, setAdapterLimits] = useState<GPUSupportedLimits | null>(null);
  const [selectedModel, setSelectedModel] = useState(models[1].id); // Default to Équilibré
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null);
  const [cacheNames, setCacheNames] = useState<string[]>([]);
  const [cacheApiAvailable, setCacheApiAvailable] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  useEffect(() => {
    isWebGPUSupported().then(setWebGPUSupported);
    getAdapterLimits().then(setAdapterLimits);
    navigator.storage?.estimate?.().then((e) =>
      setStorageEstimate({ usage: e.usage ?? 0, quota: e.quota ?? 0 }),
    );
    if (typeof caches !== 'undefined') {
      setCacheApiAvailable(true);
      caches.keys().then((keys) => setCacheNames(keys.map(key => key.toString())));
    }
  }, []);

  const handleDeleteCache = async (cacheName: string) => {
    await caches.delete(cacheName);
    setCacheNames(cacheNames.filter(name => name !== cacheName));
  };

  const handleDeleteAllCaches = async () => {
    if (confirmDeleteAll) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
      setCacheNames([]);
    }
    setConfirmDeleteAll(!confirmDeleteAll);
  };

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-lg font-bold">Réglages</h1>

      <section className={card}>
        <h2 className={h2}>Modèle par défaut</h2>
        <select
          className="w-full appearance-none rounded-lg border border-[#232830] bg-[#171b21] px-3 py-2.5 text-[13.5px] text-[#e6e9ee] outline-none focus:border-[#6366f1]"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id} disabled={model.disabled}>
              {model.name} {model.disabled ? `(${model.tooltip})` : ''}
            </option>
          ))}
        </select>
      </section>

      <section className={card}>
        <h2 className={h2}>Diagnostic WebGPU</h2>
        <p className="text-sm">
          Support WebGPU :{' '}
          {webGPUSupported ? (
            <span className="font-semibold text-[#34d399]">Oui</span>
          ) : (
            <span className="font-semibold text-[#e6b23a]">Non</span>
          )}
        </p>
        {adapterLimits && (
          <ul className="font-mono-out mt-3 space-y-1 text-[12px] text-[#8b94a1]">
            <li>Texture 2D max : {adapterLimits.maxTextureDimension2D}</li>
            <li>Storage buffers / stage : {adapterLimits.maxStorageBuffersPerShaderStage}</li>
            <li>Buffer max : {adapterLimits.maxBufferSize}</li>
            <li>Bind groups max : {adapterLimits.maxBindGroups}</li>
            <li>Uniform / binding : {adapterLimits.maxUniformBufferBindingSize}</li>
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className={h2}>Stockage local</h2>
        <p className="text-sm text-[#8b94a1]">
          Les prompts sauvegardés et l&apos;historique des runs sont stockés dans IndexedDB, sur cet
          appareil uniquement.
        </p>
        {storageEstimate && (
          <p className="font-mono-out mt-2 text-[12px] text-[#8b94a1]">
            {(storageEstimate.usage / 1e9).toFixed(2)} Go utilisés /{' '}
            {(storageEstimate.quota / 1e9).toFixed(0)} Go disponibles (poids + données)
          </p>
        )}
      </section>

      <section className={card}>
        <h2 className={h2}>Cache des poids</h2>
        {!cacheApiAvailable && (
          <p className="text-sm text-[#e6b23a]">
            API Cache indisponible : HTTPS ou localhost requis.
          </p>
        )}
        {cacheNames.length === 0 ? (
          <p className="text-sm text-[#8b94a1]">Aucun cache.</p>
        ) : (
          <ul className="space-y-2">
            {cacheNames.map((cacheName) => (
              <li key={cacheName} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate">{cacheName}</span>
                <button
                  className="shrink-0 rounded-lg bg-[#7f1d1d] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#991b1b]"
                  onClick={() => handleDeleteCache(cacheName)}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          className="mt-4 rounded-lg border border-[#232830] bg-[#171b21] px-4 py-2 text-[13px] font-medium text-[#e6e9ee] hover:border-[#e6b23a]"
          onClick={handleDeleteAllCaches}
        >
          {confirmDeleteAll ? 'Confirmer : tout effacer ?' : 'Tout effacer'}
        </button>
      </section>
    </main>
  );
}
