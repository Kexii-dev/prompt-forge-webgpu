'use client';

import { useState } from 'react';
import { createModelProvider } from '../lib/providers';
import { models } from '../lib/models';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[1].id); // Default to Équilibré

  const modelProvider = createModelProvider();

  const handleGenerate = async () => {
    setLoading(true);
    setResponse('');

    try {
      await modelProvider.load(selectedModel);
      const generator = modelProvider.generate([prompt], { temperature: 0.7, maxLength: 100 });

      for await (const chunk of generator) {
        setResponse((prev) => prev + chunk);
      }
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-3xl">
        <h1 className="text-2xl font-bold">Prompt Forge WebGPU</h1>
        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Entrez votre prompt ici..."
        />
        <div className="flex justify-between items-center">
          <span>{prompt.length} caractères</span>
          <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-500 text-white gap-2 hover:bg-blue-600 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Génération...' : 'Générer'}
          </button>
        </div>
        <div className="w-full max-w-full p-4 border border-gray-300 rounded max-h-96 overflow-y-auto overflow-x-hidden">
          <pre className="whitespace-pre-wrap break-all">{response}</pre>
        </div>
        <select
          className="w-full p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id} disabled={model.disabled}>
              {model.name} {model.disabled ? `(Désactivé - ${model.tooltip})` : ''}
            </option>
          ))}
        </select>
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
