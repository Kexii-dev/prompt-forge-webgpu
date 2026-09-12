import { pipeline, TextStreamer } from '@huggingface/transformers';
import type { ModelProvider, GenerateOptions } from './types';

// Provider de repli : Transformers.js v3 (WASM/WebGPU via ONNX).
// Utilisé quand WebLLM n'est pas disponible. Plus lent, mais très compatible.
export class TransformersJsProvider implements ModelProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generator: any = null;

  async load(modelId: string, onProgress?: (progress: number) => void): Promise<void> {
    this.generator = await pipeline('text-generation', modelId, {
      progress_callback: (p: { status: string; progress?: number }) => {
        if (onProgress && typeof p.progress === 'number') onProgress(p.progress);
      },
    });
  }

  async *generate(messages: string[], opts: GenerateOptions): AsyncGenerator<string> {
    if (!this.generator) throw new Error('Modèle non chargé');
    // Streaming via TextStreamer : on accumule les tokens émis
    const chunks: string[] = [];
    let resolve: (() => void) | null = null;
    const streamer = new TextStreamer(this.generator.tokenizer, {
      callback_function: (text: string) => {
        chunks.push(text);
        resolve?.();
      },
    });
    const done = this.generator(messages.join('\n'), {
      max_new_tokens: opts.maxLength ?? 256,
      temperature: opts.temperature ?? 0.7,
      do_sample: true,
      streamer,
    });
    let consumed = 0;
    // Boucle de consommation : attend de nouveaux tokens jusqu'à la fin
    while (true) {
      if (chunks.length > consumed) {
        yield chunks.slice(consumed).join('');
        consumed = chunks.length;
        continue;
      }
      const finished = await Promise.race([
        done.then(() => true),
        new Promise<boolean>((r) => { resolve = () => r(false); }),
      ]);
      if (finished) {
        if (chunks.length > consumed) yield chunks.slice(consumed).join('');
        break;
      }
    }
    await done;
  }

  unload(): void {
    this.generator = null;
  }

  isAvailable(): boolean {
    return true; // WASM tourne partout
  }
}
