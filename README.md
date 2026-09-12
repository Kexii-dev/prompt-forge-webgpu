# Prompt Forge WebGPU

## Présentation

Prompt Forge WebGPU est une application permettant de créer, structurer, tester et optimiser des prompts à l'aide de modèles exécutés localement dans le navigateur. Cette application utilise WebGPU pour des performances optimales et offre trois profils de modèle : Léger, Équilibré et Avancé.

## Prérequis

- Navigateur WebGPU compatible (Chrome/Edge 113+)

## Développement

### Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-repo/prompt-forge-webgpu.git
   cd prompt-forge-webgpu
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

### Lancement du serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir le résultat.

## Construction

Pour construire l'application en mode production :

```bash
npm run build
```

## Docker

### Construction de l'image Docker

```bash
docker build -t prompt-forge-webgpu .
```

### Exécution du conteneur Docker

```bash
docker run -p 3000:3000 prompt-forge-webgpu
```

## Catalogue des modèles

- **Léger** : Qwen2.5-0.5B/1.5B-Instruct ou Llama-3.2-1B-Instruct (q4) (<1,5 Go VRAM)
- **Équilibré** : Qwen2.5-3B-Instruct, Llama-3.2-3B-Instruct ou Phi-3.5-mini-instruct (q4) (~2-2,5 Go VRAM)
- **Avancé** : Non disponible pour VRAM < 6 Go

## Limites connues

- Le profil Avancé est désactivé pour les configurations avec moins de 6 Go de VRAM.
