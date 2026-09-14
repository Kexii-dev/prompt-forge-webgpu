'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createModelProvider } from '../../lib/providers';
import { models } from '../../lib/models';
import {
  listPrompts,
  savePrompt,
  deletePrompt,
  saveRun,
  uid,
  type SavedPrompt,
} from '../../lib/db';

type LoadPhase = 'idle' | 'loading-model' | 'generating';

export default function PromptMachinePage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [phase, setPhase] = useState<LoadPhase>('idle');
  const [loadPct, setLoadPct] = useState(0);
  const [selectedModel, setSelectedModel] = useState(models[1].id);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(256);
  const [stats, setStats] = useState<{ tps: number; seconds: number; tokens: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // Bibliothèque de prompts
  const [library, setLibrary] = useState<SavedPrompt[]>([]);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [libOpen, setLibOpen] = useState(false);

  const tokenCount = useRef(0);
  const startTime = useRef(0);
  const providerRef = useRef<ReturnType<typeof createModelProvider> | null>(null);
  const loadedModelRef = useRef<string | null>(null);

  const currentModel = models.find((m) => m.id === selectedModel);
  const loading = phase !== 'idle';

  const refreshLibrary = useCallback(async () => {
    try {
      setLibrary(await listPrompts());
    } catch {
      /* IndexedDB indispo — silencieux */
    }
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const handleGenerate = async () => {
    setError(null);
    setStats(null);
    setResponse('');
    tokenCount.current = 0;

    try {
      if (!providerRef.current) providerRef.current = createModelProvider();
      const provider = providerRef.current;

      if (loadedModelRef.current !== selectedModel) {
        setPhase('loading-model');
        setLoadPct(0);
        provider.unload();
        await provider.load(selectedModel, (pct) => setLoadPct(Math.round(pct)));
        loadedModelRef.current = selectedModel;
      }

      setPhase('generating');
      startTime.current = performance.now();
      let lastChunkAt = startTime.current;
      let out = '';
      const generator = provider.generate([prompt], { temperature, maxLength: maxTokens });
      for await (const chunk of generator) {
        tokenCount.current += 1;
        out += chunk;
        lastChunkAt = performance.now();
        setResponse((prev) => prev + chunk);
      }
      const seconds = Math.max((lastChunkAt - startTime.current) / 1000, 0.01);
      const tps = tokenCount.current / seconds;
      setStats({ tps, seconds, tokens: tokenCount.current });

      // Archiver le run pour comparaison ultérieure
      try {
        await saveRun({
          id: uid(),
          promptId: activePromptId,
          promptText: prompt,
          modelId: selectedModel,
          modelName: currentModel?.name ?? selectedModel,
          output: out,
          temperature,
          maxTokens,
          tokPerSec: tps,
          seconds,
          tokens: tokenCount.current,
          kind: 'studio',
          groupId: null,
        });
      } catch {
        /* run non archivé si IndexedDB indispo */
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur de génération');
    } finally {
      setPhase('idle');
    }
  };

  const handleSavePrompt = async () => {
    const title = window.prompt('Titre du prompt :', activePrompt?.title ?? prompt.slice(0, 40));
    if (title === null) return;
    try {
      await savePrompt({
        id: activePromptId ?? uid(),
        title: title.trim() || 'Sans titre',
        content: prompt,
        tags: [],
      });
      await refreshLibrary();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch {
      setError('Sauvegarde impossible (IndexedDB)');
    }
  };

  const handleLoadPrompt = (p: SavedPrompt) => {
    setPrompt(p.content);
    setActivePromptId(p.id);
    setLibOpen(false);
  };

  const handleDeletePrompt = async (id: string) => {
    await deletePrompt(id);
    if (activePromptId === id) setActivePromptId(null);
    await refreshLibrary();
  };

  const activePrompt = library.find((p) => p.id === activePromptId) ?? null;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  }, [prompt]);

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col md:grid md:grid-cols-[290px_1fr]">
      {/* Sidebar paramètres */}
      <aside className="flex flex-col gap-4 border-b border-[#232830] bg-[#12151a] p-4 md:border-b-0 md:border-r">
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

        <div>
          <label className="mb-1.5 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-[#8b94a1]">
            <span>Température</span>
            <span className="text-[#e6e9ee]">{temperature.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full accent-[#6366f1]"
          />
        </div>

        <div>
          <label className="mb-1.5 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-[#8b94a1]">
            <span>Max tokens</span>
            <span className="text-[#e6e9ee]">{maxTokens}</span>
          </label>
          <input
            type="range"
            min={32}
            max={1024}
            step={32}
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="w-full accent-[#6366f1]"
          />
        </div>

        {/* Bibliothèque de prompts */}
        <div className="rounded-xl border border-[#232830] bg-[#171b21]">
          <button
            className="flex w-full items-center justify-between px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#8b94a1]"
            onClick={() => setLibOpen(!libOpen)}
          >
            <span>Bibliothèque ({library.length})</span>
            <span className={`transition-transform ${libOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {libOpen && (
            <div className="max-h-[220px] overflow-y-auto border-t border-[#232830]">
              {library.length === 0 && (
                <p className="p-3 text-[12px] text-[#5b6472]">Aucun prompt sauvegardé.</p>
              )}
              {library.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-1 border-b border-[#232830] last:border-0 ${
                    p.id === activePromptId ? 'bg-[rgba(99,102,241,0.10)]' : ''
                  }`}
                >
                  <button
                    className="flex-1 truncate px-3 py-2.5 text-left text-[12.5px] text-[#c9d1dc] hover:text-[#e6e9ee]"
                    onClick={() => handleLoadPrompt(p)}
                    title={p.content}
                  >
                    {p.title}
                  </button>
                  <button
                    className="px-2.5 py-2.5 text-[#5b6472] hover:text-[#f87171]"
                    onClick={() => handleDeletePrompt(p.id)}
                    aria-label={`Supprimer ${p.title}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statut */}
        <div className="rounded-xl border border-[#232830] bg-[#171b21] p-3 text-xs text-[#8b94a1] md:mt-auto">
          {phase === 'loading-model' ? (
            <>
              <b className="font-semibold text-[#e6b23a]">◌ Chargement du modèle… {loadPct}%</b>
              <br />
              {currentModel?.sizeGo} Go — long uniquement la première fois (cache ensuite)
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#232830]">
                <div
                  className="h-full rounded-full bg-[#e6b23a] transition-all"
                  style={{ width: `${Math.max(loadPct, 3)}%` }}
                />
              </div>
            </>
          ) : phase === 'generating' ? (
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
                  {stats.tps.toFixed(1)} tok/s · {stats.seconds.toFixed(1)} s · {stats.tokens} tok
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
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="font-mono-out flex-1 overflow-y-auto whitespace-pre-wrap p-4 text-[13.5px] leading-relaxed text-[#c9d1dc] md:p-6">
          {error ? (
            <span className="font-sans text-[#f87171]">⚠ {error}</span>
          ) : response ? (
            <>
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[11.5px] text-[#8b94a1]">
                <span>{currentModel?.name}</span>
                {stats && (
                  <span>
                    {stats.tps.toFixed(1)} tok/s · {stats.seconds.toFixed(1)} s
                  </span>
                )}
                <span className="text-[#34d399]">run archivé dans Historique</span>
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
          {activePrompt && (
            <div className="mb-2 flex items-center gap-2 text-[11.5px] text-[#8b94a1]">
              <span className="rounded-full border border-[#232830] bg-[#171b21] px-2 py-0.5">
                📌 {activePrompt.title}
              </span>
              <button
                className="text-[#5b6472] hover:text-[#e6e9ee]"
                onClick={() => setActivePromptId(null)}
              >
                détacher
              </button>
            </div>
          )}
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
            <div className="flex flex-col gap-2 self-end sm:flex-row">
              <button
                className={`h-11 rounded-xl border px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-50 ${
                  savedFlash
                    ? 'border-[#34d399] text-[#34d399]'
                    : 'border-[#232830] bg-[#171b21] text-[#e6e9ee] hover:border-[#3a4250]'
                }`}
                onClick={handleSavePrompt}
                disabled={!prompt.trim()}
              >
                {savedFlash ? '✓ Sauvé' : 'Sauver'}
              </button>
              <button
                className="h-11 rounded-xl bg-[#6366f1] px-5 text-sm font-semibold text-white transition hover:bg-[#5457e8] active:scale-95 disabled:opacity-50"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                {loading ? '…' : 'Générer'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
