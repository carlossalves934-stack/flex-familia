// Hoje: voz sintetizada pt-BR. Futuro: trocar por gravações da professora sem mudar quem chama falar().
export function criarVoz(somLigado: () => boolean) {
  let voz: SpeechSynthesisVoice | null = null;
  const disponivel = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (disponivel) {
    const escolher = () => {
      const vozes = speechSynthesis.getVoices();
      voz = vozes.find(v => /pt-BR/i.test(v.lang) && /female|feminina|francisca|luciana|maria/i.test(v.name))
        ?? vozes.find(v => /pt-BR/i.test(v.lang)) ?? vozes.find(v => /^pt/i.test(v.lang)) ?? null;
    };
    escolher();
    speechSynthesis.onvoiceschanged = escolher;
  }
  return {
    falar(texto: string) {
      if (!disponivel || !somLigado()) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = 'pt-BR'; u.rate = 0.95; u.pitch = 1.15;
        if (voz) u.voice = voz;
        speechSynthesis.speak(u);
      } catch { /* sem voz: segue só com visual */ }
    },
    calar() { try { if (disponivel) speechSynthesis.cancel(); } catch { /* nada a calar */ } },
  };
}
