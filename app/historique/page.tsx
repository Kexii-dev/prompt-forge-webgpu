'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { listRuns, deleteRun, clearRuns, type Run } from '../../lib/db';

export default function HistoriquePage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRuns(await listRuns());
    } catch {
      setRuns([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const modelNames = useMemo(() => [...new Set(runs.map((r) => r.modelName))], [runs]);

  const filtered = useMemo(
    () =>
      runs.filter((r) => {
        if (modelFilter !== 'all' && r.modelName !== modelFilter) return false;
        if (query && !r.promptText.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [runs, modelFilter, query],
  );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleDelete = async (id: string) => {
    await deleteRun(id);
    await refresh();
  };

  const handleClear = async () => {
    if (!window.confirm(`Supprimer les ${runs.length} runs archivés ?`)) return;
    await clearRuns();
    await refresh();
  };

  // Stats par modèle (pour comparer les LLM en un coup d'œil)
  const perModel = useMemo(() => {
    const map = new Map<string, { n: number; tpsSum: number; tpsN: number }>();
    for (const r of runs) {
      const e = map.get(r.modelName) ?? { n: 0, tpsSum: 0, tpsN: 0 };
      e.n += 1;
      if (r.tokPerSec) {
        e.tpsSum += r.tokPerSec;
        e.tpsN += 1;
      }
      map.set(r.modelName, e);
    }
    return [...map.entries()].map(([name, e]) => ({
      name,
      runs: e.n,
      avgTps: e.tpsN > 0 ? e.tpsSum / e.tpsN : null,
    }));
  }, [runs]);

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold">Historique des runs</h1>
        {runs.length > 0 && (
          <button
            className="rounded-lg border border-[#232830] bg-[#171b21] px-3 py-1.5 text-[12.5px] text-[#8b94a1] hover:text-[#f87171]"
            onClick={handleClear}
          >
            Tout effacer ({runs.length})
          </button>
        )}
      </div>

      {perModel.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {perModel.map((m) => (
            <div key={m.name} className="rounded-xl border border-[#232830] bg-[#12151a] p-3">
              <p className="truncate text-[12.5px] font-semibold text-[#e6e9ee]">{m.name}</p>
              <p className="mt-1 text-[11.5px] text-[#8b94a1]">
                {m.runs} run{m.runs > 1 ? 's' : ''}
                {m.avgTps !== null && ` · ${m.avgTps.toFixed(1)} tok/s en moyenne`}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          className="flex-1 rounded-xl border border-[#232830] bg-[#171b21] px-3.5 py-2.5 text-[13px] text-[#e6e9ee] outline-none focus:border-[#6366f1]"
          placeholder="Rechercher dans les prompts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="appearance-none rounded-xl border border-[#232830] bg-[#171b21] px-3.5 py-2.5 text-[13px] text-[#e6e9ee] outline-none focus:border-[#6366f1]"
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
        >
          <option value="all">Tous les modèles</option>
          {modelNames.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {loaded && filtered.length === 0 && (
        <p className="py-10 text-center text-[13px] text-[#5b6472]">
          {runs.length === 0
            ? 'Aucun run archivé. Génère une réponse dans le Studio ou une comparaison — tout est conservé ici.'
            : 'Aucun run ne correspond aux filtres.'}
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.map((r) => {
          const open = expanded.has(r.id);
          return (
            <div key={r.id} className="overflow-hidden rounded-xl border border-[#232830] bg-[#12151a]">
              <button
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left"
                onClick={() => toggle(r.id)}
              >
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                    r.kind === 'compare'
                      ? 'bg-[rgba(230,178,58,0.14)] text-[#e6b23a]'
                      : 'bg-[rgba(99,102,241,0.14)] text-[#a5a8ff]'
                  }`}
                >
                  {r.kind === 'compare' ? 'A/B' : 'Studio'}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-[#e6e9ee]">
                  {r.promptText}
                </span>
                <span className="text-[11.5px] text-[#8b94a1]">
                  {new Date(r.createdAt).toLocaleString('fr-CH', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className={`text-[#5b6472] transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {open && (
                <div className="border-t border-[#232830] p-4">
                  <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-[#8b94a1]">
                    <span className="text-[#e6e9ee]">{r.modelName}</span>
                    {r.tokPerSec && <span>{r.tokPerSec.toFixed(1)} tok/s</span>}
                    {r.seconds && <span>{r.seconds.toFixed(1)} s</span>}
                    <span>T° {r.temperature}</span>
                    <span>max {r.maxTokens} tok</span>
                  </div>
                  <div className="font-mono-out max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#232830] bg-[#0b0d10] p-3 text-[12.5px] leading-relaxed text-[#c9d1dc]">
                    {r.output}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {r.promptId && (
                      <Link
                        href="/prompt-machine"
                        className="rounded-lg border border-[#232830] bg-[#171b21] px-3 py-1.5 text-[12px] text-[#8b94a1] hover:text-[#e6e9ee]"
                      >
                        Rouvrir le prompt
                      </Link>
                    )}
                    <button
                      className="rounded-lg border border-[#232830] bg-[#171b21] px-3 py-1.5 text-[12px] text-[#8b94a1] hover:text-[#f87171]"
                      onClick={() => handleDelete(r.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
