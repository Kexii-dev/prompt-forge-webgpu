'use client';

import { useState } from 'react';
import { createModelProvider } from '../../lib/providers';
import type { ModelProvider } from '../../lib/providers';
import { models } from '../../lib/models';

export default function ComparePage() {
  const [input, setInput] = useState('');
  const [responseA, setResponseA] = useState('');
  const [responseB, setResponseB] = useState('');
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  const modelProviderA = createModelProvider();
  const modelProviderB = createModelProvider();

  const handleGenerate = async () => {
    setLoadingA(true);
    setLoadingB(true);
    setResponseA('');
    setResponseB('');

    const generateResponse = async (provider: ModelProvider, modelId: string, setResponse: (updater: (prev: string) => string) => void) => {
      try {
        await provider.load(modelId);
        const generator = provider.generate([input], { temperature: 0.7, maxLength: 100 });

        for await (const chunk of generator) {
          setResponse((prev) => prev + chunk);
        }
      } catch (error) {
        console.error('Error generating response:', error);
      } finally {
        provider.unload();
      }
    };

    Promise.all([
      generateResponse(modelProviderA, models[0].id, setResponseA),
      generateResponse(modelProviderB, models[2].id, setResponseB),
    ]).finally(() => {
      setLoadingA(false);
      setLoadingB(false);
    });
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-gray-950">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start text-white">
        <h1 className="text-2xl font-bold">Comparaison A/B</h1>
        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Entrez votre input ici..."
        />
        <div className="flex justify-between items-center">
          <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-500 text-white gap-2 hover:bg-blue-600 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            onClick={handleGenerate}
            disabled={loadingA || loadingB}
          >
            {loadingA || loadingB ? 'Génération...' : 'Générer'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="w-full p-4 border border-gray-300 rounded bg-gray-900">
            <h2 className="text-lg font-bold">Réponse A</h2>
            <pre>{responseA}</pre>
          </div>
          <div className="w-full p-4 border border-gray-300 rounded bg-gray-900">
            <h2 className="text-lg font-bold">Réponse B</h2>
            <pre>{responseB}</pre>
          </div>
        </div>
      </main>
    </div>
  );
}
