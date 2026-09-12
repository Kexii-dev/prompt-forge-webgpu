'use client';

import { useState, useRef, useEffect } from 'react';
import { createModelProvider } from '../lib/providers';
import { models } from '../lib/models';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[1].id); // Default to Équilibré
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState<{ tps: number; seconds: number } | null>(null);
  const tokenCount = useRef(0);
  const startTime = useRef(0);

  const modelProvider = createModelProvider();

  const currentModel = models.find((m) => m.id === selectedModel);

  const handleGenerate = async () => {
    setLoading(true);
    setResponse('');
    setStats(null);
    tokenCount.current = 0;
    startTime.current = performance.now();
    let lastChunkAt = startTime.current;

    try {
      await modelProvider.load(selectedModel);
      const generator = modelProvider.generate([prompt], { temperature: 0.7, maxLength: 100 });

      for await (const chunk of generator) {
        tokenCount.current += 1;
        lastChunkAt = performance.now();
        setResponse((prev) => prev + chunk);
      }
      const seconds = (lastChunkAt - startTime.current) / 1000;
      setStats({ tps: seconds > 0 ? tokenCount.current / seconds : 0, seconds });
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setLoading(false);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  }, [prompt]);

  return (
    <main className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 md:grid-cols-[300px_1fr]">
      {/* Sidebar paramètres */}
      <aside
        className={`fixed inset-x-0 top-[45px] z-20 flex max-h-[70vh] flex-col gap-5 overflow-y-auto border-b border-[#232830] bg-[#12151a] p-4 transition-transform duration-200 md:static md:max-h-none md:translate-y-0 md:border-b-0 md:border-r ${
          drawerOpen ? 'translate-y-0' : '-translate-y-[110%]'
        }`}
      >
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#8b94a1]">
            Modèle
          </label>
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
        </div>

        <div className="mt-auto rounded-xl border border-[#232830] bg-[#171b21] p-3 text-xs text-[#8b94a1]">
          {loading && !response ? (
            <>
              <b className="font-semibold text-[#e6b23a]">◌ Chargement du modèle…</b>
              <br />
              {currentModel?.sizeGo} Go — la première fois peut être longue
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#232830]">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#e6b23a]" />
              </div>
            </>
          ) : loading ? (
            <>
              <b className="font-semibold text-[#6366f1]">● Génération en cours…</b>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#232830]">
                <div className="h-full w-full animate-pulse rounded-full bg-[#6366f1]" />
              </div>
            </>
          ) : (
            <>
              <b className="font-semibold text-[#34d399]">● Prêt</b> — {currentModel?.name}
              <br />
              {currentModel?.sizeGo} Go · VRAM ~{currentModel?.vramRequise} Go
              {stats && (
                <>
                  <br />
                  {stats.tps.toFixed(1)} tok/s · {stats.seconds.toFixed(1)} s
                </>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#232830]">
                <div className="h-full w-full rounded-full bg-[#34d399]" />
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Stage */}
      <section className="flex min-w-0 flex-col">
        <div className="font-mono-out flex-1 overflow-y-auto whitespace-pre-wrap p-5 text-[13.5px] leading-relaxed text-[#c9d1dc] md:p-6">
          {response ? (
            <>
              <div className="mb-3 flex gap-4 font-sans text-[11.5px] text-[#8b94a1]">
                <span>{currentModel?.name}</span>
                {stats && <span>{stats.tps.toFixed(1)} tok/s</span>}
              </div>
              {response}
            </>
          ) : (
            <span className="font-sans text-[#8b94a1]">
              {loading ? 'Génération…' : 'La réponse apparaîtra ici.'}
            </span>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-[#232830] bg-[#12151a] p-3.5 md:p-5">
          <div className="flex gap-2.5">
            <textarea
              ref={textareaRef}
              className="min-h-[52px] flex-1 resize-none rounded-xl border border-[#232830] bg-[#171b21] px-3.5 py-3 text-sm text-[#e6e9ee] outline-none focus:border-[#6366f1]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading && prompt.trim()) handleGenerate();
                }
              }}
              placeholder="Décris ce que tu veux générer… (Entrée pour envoyer)"
              rows={1}
            />
            <button
              className="h-11 self-end rounded-xl bg-[#6366f1] px-5 text-sm font-semibold text-white transition hover:bg-[#5457e8] active:scale-95 disabled:opacity-50"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              {loading ? '…' : 'Générer'}
            </button>
          </div>
        </div>
      </section>

      {/* Bouton drawer mobile */}
      <button
        className="fixed bottom-20 right-4 z-20 rounded-full border border-[#232830] bg-[#171b21] px-4 py-2 text-[12.5px] text-[#e6e9ee] shadow-lg md:hidden"
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        ⚙ Modèle
      </button>
    </main>
  );
}
