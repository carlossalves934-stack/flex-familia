import { describe, expect, it } from 'vitest';
import { TODAS, combina, listarObjetivos } from './filtros';

describe('filtros por objetivo', () => {
  const videos = [{ objetivos: ['Acalmar'] }, { objetivos: ['Força', 'Acalmar'] }, { objetivos: ['Equilíbrio'] }];

  it('lista "Todas" seguido dos objetivos sem repetir, na ordem em que aparecem', () => {
    expect(listarObjetivos(videos)).toEqual([TODAS, 'Acalmar', 'Força', 'Equilíbrio']);
  });

  it('"Todas" combina com qualquer vídeo', () => {
    expect(combina(['Força'], TODAS)).toBe(true);
  });

  it('combina só quando o vídeo tem o objetivo', () => {
    expect(combina(['Força', 'Acalmar'], 'Acalmar')).toBe(true);
    expect(combina(['Força'], 'Acalmar')).toBe(false);
  });
});
