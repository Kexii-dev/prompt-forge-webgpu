'use client';

import { useState, useEffect } from 'react';
import { isWebGPUSupported, getAdapterLimits } from '../../lib/webgpu';
import { models } from '../../lib/models';

export default function SettingsPage() {
  const [webGPUSupported, setWebGPUSupported] = useState(false);
  const [adapterLimits, setAdapterLimits] = useState<GPUSupportedLimits | null>(null);
  const [selectedModel, setSelectedModel] = useState(models[1].id); // Default to Équilibré
  const [cacheNames, setCacheNames] = useState<string[]>([]);
  const [cacheApiAvailable, setCacheApiAvailable] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  useEffect(() => {
    setWebGPUSupported(isWebGPUSupported());
    getAdapterLimits().then(setAdapterLimits);
    if (typeof caches !== 'undefined') {
      setCacheApiAvailable(true);
      caches.keys().then((keys) => setCacheNames(keys.map(key => key.toString())));
    }
  }, []);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

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
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-gray-950">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start text-white">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <div>
          <label className="block mb-2 font-medium">Choix du modèle</label>
          <select
            className="w-full p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white"
            value={selectedModel}
            onChange={handleModelChange}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id} disabled={model.disabled}>
                {model.name} {model.disabled ? `(Désactivé - ${model.tooltip})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <h2 className="text-lg font-bold">Diagnostic WebGPU</h2>
          <p>Support WebGPU : {webGPUSupported ? 'Oui' : 'Non'}</p>
          {adapterLimits && (
            <div>
              <p>Limites de l&apos;adaptateur GPU:</p>
              <ul>
                <li>Taille texture 2D max : {adapterLimits.maxTextureDimension2D}</li>
                <li>Buffers de storage max / stage : {adapterLimits.maxStorageBuffersPerShaderStage}</li>
                <li>Taille buffer max : {adapterLimits.maxBufferSize}</li>
                <li>Bind groups max : {adapterLimits.maxBindGroups}</li>
                <li>Mémoire uniform par binding : {adapterLimits.maxUniformBufferBindingSize}</li>
              </ul>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold">Gestion du cache des poids</h2>
          {!cacheApiAvailable && (
            <p className="text-sm text-yellow-400">
              API Cache indisponible : la page est servie en HTTP hors contexte sécurisé
              (localhost ou HTTPS requis par le navigateur).
            </p>
          )}
          <ul>
            {cacheNames.map((cacheName) => (
              <li key={cacheName} className="flex justify-between items-center">
                {cacheName}
                <button
                  className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-500 text-white gap-2 hover:bg-red-600 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
                  onClick={() => handleDeleteCache(cacheName)}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
          <button
            className="mt-4 rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-500 text-white gap-2 hover:bg-blue-600 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            onClick={handleDeleteAllCaches}
          >
            {confirmDeleteAll ? 'Confirmer Tout Effacer' : 'Tout Effacer'}
          </button>
        </div>
      </main>
    </div>
  );
}
