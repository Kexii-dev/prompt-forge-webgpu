'use client';

import { useState } from 'react';
import { createModelProvider } from '../../lib/providers';
import { models } from '../../lib/models';

export default function ComparePage() {
  const [input, setInput] = useState('');
  const [responseA, setResponseA] = useState('');
  const [responseB, setResponseB] = useState('');
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  const modelProviderA = createModelProvider();
  const modelProviderB = createModelProvider();

  const handleGenerateA = async () => {
    setLoadingA(true);
    setResponseA('');

    try {
      await modelProviderA.load(models[0].id); // Léger
      const generator = modelProviderA.generate([input], { temperature: 0.7, maxLength: 100 });

      for await (const chunk of generator) {
        setResponseA((prev) => prev + chunk);
      }
    } catch (error) {
      console.error('Error generating response A:', error);
    } finally {
      setLoadingA(false);
    }
  };

  const handleGenerateB = async () => {
    setLoadingB(true);
    setResponseB('');

    try {
      await modelProviderB.load(models[2].id); // Équilibré
      const generator = modelProviderB.generate([input], { temperature: 0.7, maxLength: 100 });

      for await (const chunk of generator) {
        setResponseB((prev) => prev + chunk);
      }
    } catch (error) {
      console.error('Error generating response B:', error);
    } finally {
      setLoadingB(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-2xl font-bold">Comparaison A/B</h1>
        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Entrez votre input ici..."
        />
        <div className="flex justify-between items-center">
          <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-500 text-white gap-2 hover:bg-blue-600 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            onClick={handleGenerateA}
            disabled={loadingA}
          >
            {loadingA ? 'Génération A...' : 'Générer A'}
          </button>
          <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-500 text-white gap-2 hover:bg-blue-600 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            onClick={handleGenerateB}
            disabled={loadingB}
          >
            {loadingB ? 'Génération B...' : 'Générer B'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="w-full p-4 border border-gray-300 rounded">
            <h2 className="text-lg font-bold">Réponse A</h2>
            <pre>{responseA}</pre>
          </div>
          <div className="w-full p-4 border border-gray-300 rounded">
            <h2 className="text-lg font-bold">Réponse B</h2>
            <pre>{responseB}</pre>
          </div>
        </div>
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
