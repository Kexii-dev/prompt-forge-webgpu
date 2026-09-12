import { CreateMLCEngine } from '@mlc-ai/web-llm';
import type { MLCEngineInterface, InitProgressReport } from '@mlc-ai/web-llm';
import type { ModelProvider, GenerateOptions } from './types';

// Provider principal : WebLLM (MLC) — inférence WebGPU dans le navigateur.
export class WebLLMProvider implements ModelProvider {
  private engine: MLCEngineInterface | null = null;

  async load(modelId: string, onProgress?: (progress: number) => void): Promise<void> {
    this.engine = await CreateMLCEngine(modelId, {
      initProgressCallback: (report: InitProgressReport) => {
        // report.progress est entre 0 et 1
        onProgress?.(report.progress * 100);
      },
    });
  }

  async *generate(messages: string[], opts: GenerateOptions): AsyncGenerator<string> {
    if (!this.engine) throw new Error('Modèle non chargé');
    const stream = await this.engine.chat.completions.create({
      messages: [{ role: 'user', content: messages.join('\n') }],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxLength ?? 512,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  unload(): void {
    this.engine?.unload();
    this.engine = null;
  }

  isAvailable(): boolean {
    // WebLLM requiert WebGPU
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }
}
