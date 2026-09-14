'use client';

import { useEffect, useState } from 'react';
import { createModelProvider } from '../../lib/providers';
import { models } from '../../lib/models';
import {
  listPrompts,
  saveRun,
  uid,
  type SavedPrompt,
} from '../../lib/db';

interface PaneState {
  response: string;
  loading: boolean;
  stats: { tps: number; seconds: number } | null;
  error: string | null;
}

const emptyPane: PaneState = { response: '', loading: false, stats: null, error: null };

export default function ComparePage() {
  const [input, setInput] = useState('');
  const [modelA, setModelA] = useState(models[0].id);
  const [modelB, setModelB] = useState(models[2].id);
  const [paneA, setPaneA] = useState<PaneState>(emptyPane);
  const [paneB, setPaneB] = useState<PaneState>(emptyPane);
  const [library, setLibrary] = useState<SavedPrompt[]>([]);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  const running = paneA.loading || paneB.loading;

  useEffect(() => {
    listPrompts()
      .then(setLibrary)
      .catch(() => setLibrary([]));
  }, []);

  const runModel = async (
    modelId: string,
    setPane: React.Dispatch<React.SetStateAction<PaneState>>,
    groupId: string,
  ) => {
    const provider = createModelProvider();
    const modelName = models.find((m) => m.id === modelId)?.name ?? modelId;
    setPane({ ...emptyPane, loading: true });
    const tokenCount = { n: 0 };
    try {
      await provider.load(modelId);
      const start = performance.now();
      let lastChunkAt = start;
      let out = '';
      const generator = provider.generate([input], { temperature: 0.7, maxLength: 256 });
      for await (const chunk of generator) {
        tokenCount.n += 1;
        out += chunk;
        lastChunkAt = performance.now();
        setPane((p) => ({ ...p, response: p.response + chunk }));
      }
      const seconds = Math.max((lastChunkAt - start) / 1000, 0.01);
      const tps = tokenCount.n / seconds;
      setPane((p) => ({ ...p, loading: false, stats: { tps, seconds } }));
      try {
        await saveRun({
          id: uid(),
          promptId: activePromptId,
          promptText: input,
          modelId,
          modelName,
          output: out,
          temperature: 0.7,
          maxTokens: 256,
          tokPerSec: tps,
          seconds,
          tokens: tokenCount.n,
          kind: 'compare',
          groupId,
        });
      } catch {
        /* archivage silencieux */
      }
    } catch (e) {
      setPane((p) => ({
        ...p,
        loading: false,
        error: e instanceof Error ? e.message : 'Erreur',
      }));
    } finally {
      provider.unload();
    }
  };

  const handleGenerate = async () => {
    const groupId = uid();
    // Séquentiel : deux modèles WebLLM en parallèle = double VRAM.
    await runModel(modelA, setPaneA, groupId);
    await runModel(modelB, setPaneB, groupId);
  };

  const selector = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    accent: string,
  ) => (
    <div className="flex-1">
      <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#8b94a1]">
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        {label}
      </label>
      <select
        className="w-full appearance-none rounded-xl border border-[#232830] bg-[#171b21] px-3 py-2.5 text-[13px] text-[#e6e9ee] outline-none focus:border-[#6366f1]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={running}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id} disabled={m.disabled}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );

  const pane = (label: string, modelId: string, state: PaneState, accent: string) => {
    const modelName = models.find((m) => m.id === modelId)?.name ?? modelId;
    return (
      <div className="flex min-h-[200px] flex-col rounded-xl border border-[#232830] bg-[#12151a]">
        <div className="flex items-center justify-between border-b border-[#232830] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#8b94a1]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
            {label}
          </span>
          <span className="max-w-[60%] truncate text-right normal-case tracking-normal">
            {modelName}
            {state.stats && ` · ${state.stats.tps.toFixed(1)} tok/s`}
          </span>
        </div>
        <div className="font-mono-out flex-1 whitespace-pre-wrap p-4 text-[13px] leading-relaxed text-[#c9d1dc]">
          {state.error ? (
            <span className="font-sans text-[#f87171]">⚠ {state.error}</span>
          ) : (
            state.response || (
              <span className="font-sans text-[#8b94a1]">
                {state.loading ? 'Chargement + génération…' : '—'}
              </span>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-lg font-bold">Comparaison A/B</h1>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        {selector('Modèle A', modelA, setModelA, '#34d399')}
        {selector('Modèle B', modelB, setModelB, '#e6b23a')}
      </div>

      {library.length > 0 && (
        <select
          className="w-full appearance-none rounded-xl border border-[#232830] bg-[#171b21] px-3.5 py-2.5 text-[13px] text-[#e6e9ee] outline-none focus:border-[#6366f1]"
          value={activePromptId ?? ''}
          onChange={(e) => {
            const p = library.find((x) => x.id === e.target.value);
            if (p) {
              setInput(p.content);
              setActivePromptId(p.id);
            } else {
              setActivePromptId(null);
            }
          }}
          disabled={running}
        >
          <option value="">— Charger un prompt sauvegardé… —</option>
          {library.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      )}

      <textarea
        className="min-h-[100px] w-full resize-y rounded-xl border border-[#232830] bg-[#171b21] px-3.5 py-3 text-sm text-[#e6e9ee] outline-none focus:border-[#6366f1]"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Le même prompt sera envoyé aux deux modèles, l'un après l'autre (VRAM)…"
      />
      <div className="flex items-center gap-3">
        <button
          className="h-11 rounded-xl bg-[#6366f1] px-5 text-sm font-semibold text-white transition hover:bg-[#5457e8] active:scale-95 disabled:opacity-50"
          onClick={handleGenerate}
          disabled={running || !input.trim()}
        >
          {running ? 'Génération…' : 'Comparer'}
        </button>
        <span className="text-[11.5px] text-[#5b6472]">
          Les deux runs sont archivés dans Historique.
        </span>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {pane('Réponse A', modelA, paneA, '#34d399')}
        {pane('Réponse B', modelB, paneB, '#e6b23a')}
      </div>
    </main>
  );
}
