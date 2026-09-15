import Link from 'next/link';

type AppCard = {
  href: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  accent: string;
  hrefExternal: string | null;
};

const apps: AppCard[] = [
  {
    href: '/lumina-photo',
    title: 'Lumina Photo',
    tagline: 'Édition photo assistée par IA',
    description:
      'Suppression de fond, upscale, segmentation et retouche — les modèles tournent directement dans votre navigateur via WebGPU. Vos images ne quittent jamais votre machine.',
    features: ['RMBG-1.4', 'Swin2SR upscale', 'Segment Anything', '100 % local'],
    accent: '#34d399',
    // Lumen migré VPS2 -> VPS3 (conteneur photo-editor-dev) le 15/09/2026,
    // exposé publiquement via nginx VPS1 + Let's Encrypt.
    hrefExternal: 'https://lumina.rayroud.com',
  },
  {
    href: '/prompt-machine',
    title: 'Prompt Machine',
    tagline: 'Banc d’essai LLM local',
    description:
      'Composez, sauvegardez et comparez vos prompts sur plusieurs modèles exécutés localement. Historique des runs, statistiques de vitesse, comparaison A/B.',
    features: ['WebLLM / MLC', 'Bibliothèque de prompts', 'Comparaison A/B', 'Stats tok/s'],
    accent: '#6366f1',
    hrefExternal: null,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center justify-center gap-10 px-4 py-12 md:py-20">
      <div className="text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8b94a1]">
          webgpu.rayroud.com
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#e6e9ee] md:text-4xl">
          L’IA qui tourne <span className="text-[#6366f1]">chez vous</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[560px] text-[14px] leading-relaxed text-[#8b94a1]">
          Deux outils propulsés par WebGPU. Aucun serveur d’inférence, aucune donnée envoyée :
          les modèles sont téléchargés puis exécutés sur votre GPU.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
        {apps.map((app) => (
          <div
            key={app.title}
            className="group flex flex-col rounded-2xl border border-[#232830] bg-[#12151a] p-6 transition-colors hover:border-[#3a4250]"
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: app.accent, boxShadow: `0 0 10px ${app.accent}` }}
              />
              <div>
                <h2 className="text-[17px] font-bold text-[#e6e9ee]">{app.title}</h2>
                <p className="text-[12px] text-[#8b94a1]">{app.tagline}</p>
              </div>
            </div>
            <p className="mb-5 flex-1 text-[13.5px] leading-relaxed text-[#b6bdcb]">
              {app.description}
            </p>
            <div className="mb-5 flex flex-wrap gap-2">
              {app.features.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-[#232830] bg-[#171b21] px-2.5 py-1 text-[11px] text-[#8b94a1]"
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="flex gap-2.5">
              {app.hrefExternal ? (
                <a
                  href={app.hrefExternal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl py-2.5 text-center text-[13.5px] font-semibold text-white transition active:scale-95"
                  style={{ background: app.accent, color: '#0b0d10' }}
                >
                  Ouvrir {app.title} ↗
                </a>
              ) : (
                <Link
                  href={app.href}
                  className="flex-1 rounded-xl py-2.5 text-center text-[13.5px] font-semibold text-white transition hover:brightness-110 active:scale-95"
                  style={{ background: app.accent }}
                >
                  Ouvrir {app.title} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[11.5px] text-[#5b6472]">
        WebGPU requis — Chrome, Edge ou Brave récents. Les modèles sont mis en cache dans le
        navigateur après le premier téléchargement.
      </p>
    </main>
  );
}
