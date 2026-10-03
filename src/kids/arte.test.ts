import { describe, expect, it } from 'vitest';
import { desafios, historias } from '../data/videos';
import { ARTE } from './arte';

describe('arte do Modo Criança', () => {
  it.each([...historias, ...desafios].map(v => v.slug))('%s tem arte', slug => {
    expect(ARTE[slug]?.length ?? 0).toBeGreaterThan(0);
  });
});
