import { describe, expect, it } from 'vitest';
import {
  VIDEOS, historias, desafios, adultos, destaques, porSlug, porId, capa,
  faixaMinutos, rotuloCategoria, pendentesDeRevisao, PAGINAS,
} from './videos';

describe('catálogo', () => {
  it('tem os 15 vídeos do canal, separados por categoria', () => {
    expect(VIDEOS).toHaveLength(15);
    expect(historias).toHaveLength(10);
    expect(desafios).toHaveLength(3);
    expect(adultos).toHaveLength(2);
  });

  it('não repete slug nem id', () => {
    expect(new Set(VIDEOS.map(v => v.slug)).size).toBe(VIDEOS.length);
    expect(new Set(VIDEOS.map(v => v.id)).size).toBe(VIDEOS.length);
  });

  it('coloca toda história numa página existente do livro', () => {
    for (const h of historias) {
      expect(h.pagina).toBeGreaterThanOrEqual(0);
      expect(h.pagina).toBeLessThan(PAGINAS.length);
    }
  });

  it('tem 3 destaques para a abertura', () => {
    expect(destaques.map(v => v.slug)).toEqual(['leao', 'pascoa', 'cachorro']);
  });

  it('encontra por slug e por id', () => {
    expect(porSlug('baleia')?.titulo).toBe('A Baleia no Mar');
    expect(porId('EH-uvdTY2bs')?.slug).toBe('baleia');
    expect(porSlug('nao-existe')).toBeUndefined();
  });

  it('monta a URL da capa', () => {
    expect(capa('EH-uvdTY2bs')).toBe('https://i.ytimg.com/vi/EH-uvdTY2bs/hqdefault.jpg');
    expect(capa('EH-uvdTY2bs', 'maxresdefault')).toBe('https://i.ytimg.com/vi/EH-uvdTY2bs/maxresdefault.jpg');
  });

  it('calcula a faixa de minutos das histórias', () => {
    expect(faixaMinutos(historias)).toEqual({ min: 3, max: 9 });
  });

  it('dá um rótulo legível para cada categoria', () => {
    expect(rotuloCategoria(porSlug('baleia')!)).toBe('Para crianças de 3 a 6 anos');
    expect(rotuloCategoria(porSlug('aviao')!)).toBe('Desafio em família');
    expect(rotuloCategoria(porSlug('office')!)).toBe('Para adultos');
  });

  it('lista tudo como pendente de revisão no início', () => {
    expect(pendentesDeRevisao()).toHaveLength(15);
  });
});
