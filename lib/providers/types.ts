export interface ModelProvider {
  load(modelId: string, onProgress?: (progress: number) => void): Promise<void>;
  generate(messages: string[], opts: GenerateOptions): AsyncGenerator<string>;
  unload(): void;
  isAvailable(): boolean;
}

export interface GenerateOptions {
  temperature?: number;
  maxLength?: number;
  // Add other options as needed
}
