'use client';

import { useState, useEffect } from 'react';
import { isWebGPUSupported, getAdapterLimits } from '../../lib/webgpu';
import { models } from '../../lib/models';

export default function SettingsPage() {
  const [webGPUSupported, setWebGPUSupported] = useState(false);
  const [adapterLimits, setAdapterLimits] = useState<GPUSupportedLimits | null>(null);
  const [selectedModel, setSelectedModel] = useState(models[1].id); // Default to Équilibré

  useEffect(() => {
    setWebGPUSupported(isWebGPUSupported());
    getAdapterLimits().then(setAdapterLimits);
  }, []);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <div>
          <label className="block mb-2 font-medium">Choix du modèle</label>
          <select
            className="w-full p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-500 text-white gap-2 hover:bg-blue-600 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            onClick={() => console.log('Clear cache')}
          >
            Tout effacer
          </button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Apprendre
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Exemples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Aller vers nextjs.org →
        </a>
      </footer>
    </div>
  );
}
