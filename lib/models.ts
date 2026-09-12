export interface Model {
  id: string;
  name: string;
  sizeGo: number;
  vramRequise: number;
  tier: 'Léger' | 'Équilibré' | 'Avancé';
  disabled: boolean;
  tooltip?: string;
}

export const models: Model[] = [
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    sizeGo: 0.5,
    vramRequise: 1,
    tier: 'Léger',
    disabled: false,
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    sizeGo: 1.5,
    vramRequise: 1.5,
    tier: 'Léger',
    disabled: false,
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    sizeGo: 3.2,
    vramRequise: 2.5,
    tier: 'Équilibré',
    disabled: false,
  },
  {
    id: 'Advanced-Model',
    name: 'Advanced Model',
    sizeGo: 7,
    vramRequise: 4.5,
    tier: 'Avancé',
    disabled: true,
    tooltip: 'VRAM insuffisante',
  },
];
