// Tipagem mínima da IFrame API que usamos.
export interface YTPlayer {
  playVideo(): void; pauseVideo(): void; stopVideo(): void; mute(): void;
  loadVideoById(arg: string | { videoId: string; startSeconds?: number }): void;
  getPlayerState?(): number;
}
export interface YTNamespace {
  Player: new (el: string | HTMLElement, opcoes: Record<string, unknown>) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
}
declare global {
  interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void }
}

export const HOST_PRIVADO = 'https://www.youtube-nocookie.com';

let carregando: Promise<YTNamespace> | null = null;

export function carregarYouTube(timeoutMs = 8000): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (carregando) return carregando;
  carregando = new Promise<YTNamespace>((resolve, reject) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { anterior?.(); resolve(window.YT!); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => reject(new Error('YouTube indisponível'));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('YouTube demorou demais')), timeoutMs);
  }).catch(erro => { carregando = null; throw erro; });
  return carregando;
}
