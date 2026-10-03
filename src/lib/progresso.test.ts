import { describe, expect, it } from 'vitest';
import { CHAVE_PROGRESSO, criarProgresso, type StorageLike } from './progresso';

function memoria(inicial: Record<string, string> = {}): StorageLike & { dados: Record<string, string> } {
  const dados = { ...inicial };
  return { dados, getItem: k => dados[k] ?? null, setItem: (k, v) => { dados[k] = v; } };
}

describe('progresso', () => {
  it('começa vazio e com som ligado', () => {
    const p = criarProgresso(memoria());
    expect(p.temAdesivo('baleia')).toBe(false);
    expect(p.som).toBe(true);
  });

  it('ganhar devolve true só na primeira vez e salva', () => {
    const s = memoria();
    const p = criarProgresso(s);
    expect(p.ganhar('baleia')).toBe(true);
    expect(p.ganhar('baleia')).toBe(false);
    expect(criarProgresso(s).temAdesivo('baleia')).toBe(true);
  });

  it('guarda adesivos da família separados', () => {
    const p = criarProgresso(memoria());
    p.ganharFamilia('aviao');
    expect(p.temFamilia('aviao')).toBe(true);
    expect(p.temAdesivo('aviao')).toBe(false);
  });

  it('conta adesivos de uma lista', () => {
    const p = criarProgresso(memoria());
    p.ganhar('baleia'); p.ganhar('chuva');
    expect(p.contar(['baleia', 'chuva', 'lebre'])).toBe(2);
  });

  it('zerar apaga adesivos mas mantém o som', () => {
    const p = criarProgresso(memoria());
    p.ganhar('baleia'); p.definirSom(false); p.zerar();
    expect(p.temAdesivo('baleia')).toBe(false);
    expect(p.som).toBe(false);
  });

  it('ignora dados corrompidos', () => {
    const p = criarProgresso(memoria({ [CHAVE_PROGRESSO]: '{não é json' }));
    expect(p.temAdesivo('baleia')).toBe(false);
  });

  it('ignora campos com formato errado', () => {
    const p = criarProgresso(memoria({ [CHAVE_PROGRESSO]: JSON.stringify({ adesivos: 'x', som: 'sim' }) }));
    expect(p.temAdesivo('x')).toBe(false);
    expect(p.som).toBe(true);
  });

  it('funciona sem armazenamento e quando o armazenamento lança erro', () => {
    const quebrado: StorageLike = {
      getItem: () => { throw new Error('bloqueado'); },
      setItem: () => { throw new Error('bloqueado'); },
    };
    for (const s of [null, quebrado]) {
      const p = criarProgresso(s);
      expect(p.ganhar('baleia')).toBe(true);
      expect(p.temAdesivo('baleia')).toBe(true);
    }
  });
});
