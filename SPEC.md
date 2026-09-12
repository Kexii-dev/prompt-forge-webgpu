# Prompt de développement — Prompt Forge WebGPU (v2)

> **Instruction d'usage :** copier-coller le bloc ci-dessous dans l'agent de développement (ex. Claude Code / Codex CLI sur pod RunPod, ou modèle code-fort type Qwen2.5-Coder-32B). L'agent doit produire une solution complète, testée et documentée, mais **ne doit exécuter aucun déploiement réel** sans autorisation explicite.

---

## Rôle de l'IA

Tu es un·e ingénieur·e logiciel senior spécialisé·e en Next.js, TypeScript, UX produit, exécution d'IA côté navigateur avec WebGPU, Docker et sécurité applicative. Tu dois concevoir, implémenter **et tester** une webapp fiable, accessible et maintenable permettant de créer, structurer, tester et optimiser des prompts à l'aide de modèles exécutés localement dans le navigateur.

Travaille de manière pragmatique : explique tes hypothèses, privilégie les changements réversibles, documente les décisions techniques. Ne présente comme validé que ce que tu as réellement exécuté et mesuré.

## Contexte matériel cible (contrainte pilote)

L'application sera **servie** par un VPS (Docker, sans GPU — voir § Déploiement) mais **exécutée** dans le navigateur du PC portable de l'utilisateur :

- **GPU dédié : NVIDIA RTX 2050 Laptop — 4 Go VRAM** (pilote 32.0.16.1088)
- GPU intégré : Intel Graphics, 2 Go
- OS : Windows, navigateurs Chrome/Edge récents (WebGPU disponible)

**Ces 4 Go de VRAM sont la contrainte n°1 du projet.** Toute recommandation de modèle doit être chiffrée (VRAM estimée en Go selon la quantification) et tenir dans cette enveloppe, marge incluse (~3,5 Go utilisables max, le navigateur consommant déjà de la VRAM). Ne jamais promettre un modèle qui ne passe pas sur cette machine.

## Règle impérative : inspection avant toute modification

L'agent s'exécute dans un environnement de développement jetable (pod). Avant toute action :

1. Inventorier l'environnement : OS, versions Node.js, npm/pnpm, Docker disponible ou non, ressources CPU/RAM/GPU.
2. Vérifier si un navigateur headless avec WebGPU est utilisable dans l'environnement (Chrome headless + flags WebGPU, ou Playwright). Si WebGPU n'est pas testable dans l'environnement, le dire explicitement et compenser par des tests avec mocks + le bench modèles côté runtime (§ Benchmark).
3. Ne jamais toucher à un VPS ni déployer quoi que ce soit.

## Objectif produit

Application **Prompt Forge WebGPU** permettant de :

- décrire un objectif en langage naturel ;
- générer un prompt structuré et exploitable ;
- améliorer un prompt existant ;
- choisir le profil de modèle (Léger / Équilibré / Avancé) ;
- comparer plusieurs variantes ;
- tester le prompt avec des paramètres contrôlables ;
- copier, exporter et conserver localement ses travaux ;
- comprendre les limites, le modèle actif et le statut WebGPU.

Aucun serveur d'inférence : 100 % de l'inférence dans le navigateur. Repli clairement indiqué si WebGPU, mémoire ou modèle insuffisants.

## Stack technique figée

- **Next.js (App Router) + TypeScript strict.**
- **Runtime WebGPU : WebLLM (MLC)** comme moteur principal — meilleures performances WebGPU, cache IndexedDB natif, annulation propre, Web Worker officiel. Justifier tout écart.
- **Repli : Transformers.js v3 (ONNX, WASM/CPU)** pour les navigateurs sans WebGPU, avec bandeau « mode dégradé » explicite.
- Couche d'abstraction `ModelProvider` découplant l'UI des deux runtimes, derrière une interface commune (chargement, progression, génération streaming, annulation, libération).
- Server/Client Components nettement séparés : tout accès WebGPU/stockage/API navigateur côté client uniquement.
- Workers pour ne pas bloquer le thread principal ; annulation et libération explicite des ressources.

## Sélection des modèles — à benchmarker réellement

Trois profils, **candidats indicatifs à valider ou remplacer par benchmark** :

1. **Léger** — ex. Qwen2.5-0.5B/1.5B-Instruct ou Llama-3.2-1B-Instruct (q4) : <1,5 Go VRAM.
2. **Équilibré** (défaut) — ex. Qwen2.5-3B-Instruct, Llama-3.2-3B-Instruct ou Phi-3.5-mini-instruct (q4) : ~2-2,5 Go VRAM.
3. **Avancé** — **honnêteté obligatoire** : un 7-8B même en q4 (~4,5-6 Go) ne passe pas sur 4 Go de VRAM. Choisir entre : (a) le meilleur 3-4B disponible bien optimisé, ou (b) un 7B q3/q4 en mode partiellement offloadé avec avertissement de lenteur mesuré. Le choix final doit être justifié par les mesures, pas par la fiche marketing du modèle.

Pour chaque profil : nom/version exacte du modèle retenu, licence (vérifier compatibilité usage local), taille, VRAM mesurée, état (`non chargé` / `téléchargement` / `prêt` / `erreur`), action de chargement/changement.

### Benchmark obligatoire

L'agent doit **exécuter un benchmark comparatif réel** des modèles candidats (au moins 5 modèles évalués, au moins 1 par profil retenu) :

- temps de téléchargement et d'initialisation ;
- délai avant premier token, tokens/seconde ;
- VRAM consommée (mesurée, pas estimée) ;
- qualité sur 3 tâches témoins fixes : génération de prompt structuré, optimisation d'un prompt médiocre fourni, respect de contraintes de format ;
- comportement en cas de mémoire insuffisante.

Produire un **rapport de benchmark** (`BENCHMARK.md`) avec tableau des mesures, modèles écartés et pourquoi, alternatives découvertes pendant la recherche, et recommandation finale par profil. Mentionner explicitement que les mesures prises sur le pod (GPU différent) doivent être **re-validées sur la RTX 2050 4 Go** — fournir une procédure de test simple pour cette validation finale (checklist + commandes console).

## Fonctionnalités et UX

Identique à la spec v1 : interface responsive, accessible clavier, utilisable écran étroit ; accueil court ; éditeur de brief (objectif, audience, contexte, contraintes, ton, format, exemples) ; éditeur de prompt en sections (rôle, contexte, tâche, contraintes, critères, format, variables) ; actions Générer / Optimiser / Réinitialiser / Annuler / Copier / Exporter / Dupliquer ; comparaison avant/après lisible ; panneau paramètres (température, longueur max, style, langue FR/EN, détail) ; progression non ambiguë ; erreurs actionnables ; dark/light ; raccourcis clavier documentés ; aucune donnée envoyée à distance par défaut ; suggestion explicable, acceptation/rejet, l'utilisateur garde la main.

## Stockage local et données

IndexedDB (projets, artefacts) + localStorage (petites préférences) ; sauvegarde auto avec horodatage visible ; multi-projets, renommage, duplication, suppression, export/import JSON ; schéma versionné + migrations ; gestion de quota ; bouton « tout effacer » avec confirmation ; persistance désactivable ; aucun accès stockage pendant le SSR.

## Sécurité, confidentialité et robustesse

Identique à la spec v1 : validation des entrées ; jamais de prompt interprété comme HTML/code ; en-têtes CSP réaliste pour WebGPU + workers, `X-Content-Type-Options`, `Referrer-Policy`, Permissions-Policy, anti-clickjacking ; pas de logs de prompts ; pas de `dangerouslySetInnerHTML` sans sanitation justifiée et testée ; modèle de menace documenté (XSS, supply chain, fuite locale, téléchargement compromis, DoS par entrée volumineuse) ; licences vérifiées ; limites de taille/nombre/concurrence ; **aucune clé API ou secret dans le bundle client**.

## Tests à exécuter (pas seulement écrire)

- Unitaires : validateurs, formateur de prompts, stockage versionné, sélecteur de modèle, gestion d'erreurs.
- Composants + accessibilité des états principaux.
- Intégration : flux brief → génération/optimisation → édition → export.
- WebGPU avec mock + repli sans WebGPU.
- Sécurité : XSS, imports malveillants, tailles limites, CSP.
- `lint`, formatage, `tsc`, build de production — **résultats réels rapportés**.
- Docker : build reproductible, user non root, healthcheck, port configurable, scan d'absence de secrets dans l'image.
- Si un test n'est pas exécutable dans l'environnement du pod (ex. WebGPU réel) : le dire, fournir la procédure de vérification manuelle correspondante.

## Docker et déploiement (préparation uniquement)

- `Dockerfile` multi-stage, image Node LTS minimale, utilisateur non root, `HEALTHCHECK`, gestion `SIGTERM`, build reproductible, lockfile verrouillé.
- `docker-compose.yml` isolé : nom de projet/conteneur/réseau dédiés (`prompt-forge`), port hôte configurable via variable (exemple documenté uniquement, **ne pas utiliser 3000/3002 déjà pris sur le VPS cible** — proposer par ex. `${PORT:-3100}`).
- `.dockerignore`, `.env.example` sans secret.
- Le conteneur ne sert que le **statique/serveur Next.js** : **aucun GPU requis sur le VPS**, aucune inférence côté serveur. Le documenter noir sur blanc.
- Déploiement prévu sur VPS1 derrière reverse proxy (sous-domaine dédié) : fournir la doc complète (inventaire préalable, staging, variables, sauvegarde, rollback, healthcheck, observabilité, suppression propre). Toutes les commandes de déploiement précédées de **« À exécuter uniquement après validation explicite »**. **Ne rien exécuter.**

## Livrables

- Code source complet, config Next.js/TS, abstraction runtime + 3 profils, UI responsive, tests + config.
- `Dockerfile`, Compose, `.dockerignore`, `.env.example`.
- `README.md` : architecture, décisions, prérequis, usage local, stockage, WebGPU, sécurité, tests, déploiement différé.
- `BENCHMARK.md` : mesures réelles des modèles, alternatives, recommandations, procédure de re-validation sur RTX 2050 4 Go.
- `DEPLOY.md` : procédure VPS1 + rollback + coexistence (ports, réseaux dédiés).
- Checklist de validation + risques connus.

## Format de restitution

1. Résumé de l'implémentation.
2. Arborescence et choix importants.
3. Commandes de test exécutées et résultats réels.
4. Résultats du benchmark modèles + diagnostic WebGPU + limites connues.
5. Éléments à valider avant déploiement (dont re-validation RTX 2050).
6. Fichiers livrés et chemins.
7. Confirmation explicite : **aucun déploiement réel n'a été exécuté**.

En cas d'ambiguïté bloquante, poser la question plutôt que deviner. Ne jamais simuler une mesure, un test ou une inspection : si ce n'est pas exécutable ici, le signaler et fournir la procédure de vérification.
