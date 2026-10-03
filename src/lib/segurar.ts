export function criarSegurar(opcoes: { duracaoMs: number; aoConcluir: () => void }) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    comecar() {
      if (timer) return;
      timer = setTimeout(() => { timer = null; opcoes.aoConcluir(); }, opcoes.duracaoMs);
    },
    cancelar() {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
    },
    get ativo() { return timer !== null; },
  };
}
