import { describe, expect, it } from 'vitest';
import { readLastModel, writeLastModel } from '../src/renderer/src/model-choice';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
  };
}

describe('dernier modèle choisi', () => {
  it('relit une valeur connue', () => {
    expect(readLastModel(memoryStorage({ 'mon-claude:model': 'sonnet' }))).toBe('sonnet');
  });

  it('valeur inconnue ou absente → « Par défaut »', () => {
    expect(readLastModel(memoryStorage({ 'mon-claude:model': 'gpt' }))).toBeUndefined();
    expect(readLastModel(memoryStorage())).toBeUndefined();
  });

  it('stockage indisponible → « Par défaut », sans planter', () => {
    const broken = { getItem: () => { throw new Error('bloqué'); } };
    expect(readLastModel(broken)).toBeUndefined();
  });

  it('écrit le choix, et « Par défaut » efface la clé', () => {
    const s = memoryStorage();
    writeLastModel(s, 'haiku');
    expect(s.data['mon-claude:model']).toBe('haiku');
    writeLastModel(s, undefined);
    expect(s.data['mon-claude:model']).toBeUndefined();
  });
});
