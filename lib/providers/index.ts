import { WebLLMProvider } from './webllm';
import { TransformersJsProvider } from './transformers';
import type { ModelProvider } from './types';
import { isWebGPUSupportedSync } from '../webgpu';

export function createModelProvider(): ModelProvider {
  return isWebGPUSupportedSync() ? new WebLLMProvider() : new TransformersJsProvider();
}

export type { ModelProvider, GenerateOptions } from './types';
export { WebLLMProvider } from './webllm';
export { TransformersJsProvider } from './transformers';
