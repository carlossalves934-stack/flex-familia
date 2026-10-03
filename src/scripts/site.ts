import { capa, destaques, porId, rotuloCategoria } from '../data/videos';
import { combina } from '../lib/filtros';
import { carregarYouTube, HOST_PRIVADO, type YTPlayer } from '../lib/youtube';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let fundo: YTPlayer | null = null;

function iniciarPlayer() {
  const player = $('player');
  if (!player) return;
  let ultimoFoco: HTMLElement | null = null;

  const abrir = (id: string) => {
    const v = porId(id);
    if (!v) return false;
    ultimoFoco = document.activeElement as HTMLElement | null;
    const quadro = document.createElement('iframe');
    quadro.src = `${HOST_PRIVADO}/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    quadro.title = v.titulo;
    quadro.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    quadro.allowFullscreen = true;
    $('player-tela')!.replaceChildren(quadro);
    $('player-titulo')!.textContent = v.titulo;
    $('player-meta')!.textContent = `${rotuloCategoria(v)} · ${v.duracao} min`;
    $('player-beneficios')!.replaceChildren(...v.beneficios.map(b => { const li = document.createElement('li'); li.textContent = b; return li; }));
    $<HTMLAnchorElement>('player-yt')!.href = `https://www.youtube.com/watch?v=${v.id}`;
    player.classList.remove('oculto');
    document.body.style.overflow = 'hidden';
    $('player-fechar')!.focus();
    try { fundo?.pauseVideo(); } catch { /* fundo indisponível */ }
    return true;
  };
  const fechar = () => {
    player.classList.add('oculto');
    $('player-tela')!.innerHTML = '';
    document.body.style.overflow = '';
    ultimoFoco?.focus();
    try { fundo?.playVideo(); } catch { /* fundo indisponível */ }
  };

  document.addEventListener('click', e => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.card[data-id]');
    if (!card) return;
    const me = e as MouseEvent;
    if (me.ctrlKey || me.metaKey || me.shiftKey || me.button !== 0) return; // nova aba continua indo para a página do vídeo
    if (abrir(card.dataset.id!)) e.preventDefault();
  });
  $('player-fechar')!.addEventListener('click', fechar);
  player.addEventListener('click', e => { if (e.target === player) fechar(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !player.classList.contains('oculto')) fechar(); });
  $('agora')?.addEventListener('click', () => {
    const ativa = document.querySelector<HTMLElement>('#fundo img.ativa');
    if (ativa?.dataset.id) abrir(ativa.dataset.id);
  });
}

function iniciarFiltros() {
  const filtros = $('filtros');
  if (!filtros) return;
  filtros.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.filtro');
    if (!b) return;
    filtros.querySelectorAll('.filtro').forEach(f => f.setAttribute('aria-pressed', String(f === b)));
    let n = 0;
    document.querySelectorAll<HTMLElement>('#grade-historias .card').forEach(c => {
      const mostra = combina(c.dataset.obj!.split('|'), b.dataset.obj!);
      c.classList.toggle('some', !mostra);
      if (mostra) n++;
    });
    $('vazio')!.classList.toggle('oculto', n > 0);
  });
}

function iniciarAbertura() {
  const imgs = [...document.querySelectorAll<HTMLImageElement>('#fundo img')];
  if (!imgs.length || reduzido()) return;
  let atual = 0;
  let videoPronto = false;

  setInterval(() => {
    if (document.hidden || !$('player')!.classList.contains('oculto')) return;
    atual = (atual + 1) % destaques.length;
    imgs.forEach((im, i) => im.classList.toggle('ativa', i === atual));
    const v = destaques[atual];
    $('agora-titulo')!.textContent = v.titulo;
    $('agora')!.querySelector('img')!.src = capa(v.id);
    document.querySelectorAll('#agora .barrinhas i').forEach((b, i) => b.classList.toggle('on', i === atual));
    if (videoPronto) try { fundo?.loadVideoById({ videoId: v.id, startSeconds: 45 }); } catch { /* segue com a capa */ }
  }, 14000);

  // Vídeo mudo de fundo; se a API não carregar, a capa continua no lugar.
  carregarYouTube().then(YT => {
    fundo = new YT.Player('bg-yt', {
      host: HOST_PRIVADO,
      videoId: destaques[0].id,
      playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, start: 45 },
      events: {
        onReady: (e: { target: YTPlayer }) => { e.target.mute(); e.target.playVideo(); },
        onStateChange: (e: { data: number }) => {
          if (e.data === YT.PlayerState.PLAYING) { videoPronto = true; $('bgvideo')!.classList.add('pronto'); }
        },
      },
    });
  }).catch(() => { /* sem vídeo de fundo */ });
}

function iniciarMenu() {
  const menu = $('menu');
  const hamb = $('hamb');
  if (!menu || !hamb) return;
  // Sem abertura escura (páginas de vídeo), o menu já começa sólido.
  const temAbertura = !!document.querySelector('.abertura');
  const solido = () => menu.classList.toggle('solido', !temAbertura || scrollY > 40 || menu.classList.contains('aberto'));
  addEventListener('scroll', solido, { passive: true });
  solido();
  hamb.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    hamb.setAttribute('aria-expanded', String(aberto));
    solido();
  });
  $('nav')!.addEventListener('click', e => {
    if ((e.target as HTMLElement).tagName !== 'A') return;
    menu.classList.remove('aberto');
    hamb.setAttribute('aria-expanded', 'false');
    solido();
  });
}

export function iniciarSite() {
  iniciarPlayer();
  iniciarFiltros();
  iniciarAbertura();
  iniciarMenu();
}
