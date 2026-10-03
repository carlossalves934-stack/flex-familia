import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarSegurar } from './segurar';

describe('segurar para confirmar', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('conclui depois do tempo inteiro', () => {
    const aoConcluir = vi.fn();
    const s = criarSegurar({ duracaoMs: 3000, aoConcluir });
    s.comecar();
    expect(s.ativo).toBe(true);
    vi.advanceTimersByTime(2999);
    expect(aoConcluir).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(aoConcluir).toHaveBeenCalledOnce();
    expect(s.ativo).toBe(false);
  });

  it('soltar antes cancela', () => {
    const aoConcluir = vi.fn();
    const s = criarSegurar({ duracaoMs: 3000, aoConcluir });
    s.comecar();
    vi.advanceTimersByTime(2000);
    s.cancelar();
    vi.advanceTimersByTime(5000);
    expect(aoConcluir).not.toHaveBeenCalled();
  });

  it('começar duas vezes não reinicia a contagem', () => {
    const aoConcluir = vi.fn();
    const s = criarSegurar({ duracaoMs: 3000, aoConcluir });
    s.comecar();
    vi.advanceTimersByTime(2000);
    s.comecar();
    vi.advanceTimersByTime(1000);
    expect(aoConcluir).toHaveBeenCalledOnce();
  });
});
