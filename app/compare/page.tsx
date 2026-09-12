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

  const pane = (
    label: string,
    modelName: string,
    response: string,
    loading: boolean
  ) => (
    <div className="flex min-h-[200px] flex-col rounded-xl border border-[#232830] bg-[#12151a]">
      <div className="flex items-center justify-between border-b border-[#232830] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#8b94a1]">
        <span>{label}</span>
        <span className="normal-case tracking-normal">{modelName}</span>
      </div>
      <div className="font-mono-out flex-1 whitespace-pre-wrap p-4 text-[13px] leading-relaxed text-[#c9d1dc]">
        {response || (
          <span className="font-sans text-[#8b94a1]">
            {loading ? 'Génération…' : '—'}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-lg font-bold">Comparaison A/B</h1>
      <textarea
        className="min-h-[100px] w-full resize-y rounded-xl border border-[#232830] bg-[#171b21] px-3.5 py-3 text-sm text-[#e6e9ee] outline-none focus:border-[#6366f1]"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Entrez votre input ici…"
      />
      <div>
        <button
          className="h-11 rounded-xl bg-[#6366f1] px-5 text-sm font-semibold text-white transition hover:bg-[#5457e8] active:scale-95 disabled:opacity-50"
          onClick={handleGenerate}
          disabled={loadingA || loadingB || !input.trim()}
        >
          {loadingA || loadingB ? 'Génération…' : 'Générer'}
        </button>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {pane('Réponse A', models[0].name, responseA, loadingA)}
        {pane('Réponse B', models[2].name, responseB, loadingB)}
      </div>
    </main>
  );
}
