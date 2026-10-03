import { desafios, historias, PAGINAS, porSlug, type Video } from '../data/videos';
import { criarProgresso, storageDoNavegador } from '../lib/progresso';
import { criarSegurar } from '../lib/segurar';
import { criarSons } from '../lib/sons';
import { criarVoz } from '../lib/voz';
import { carregarYouTube, HOST_PRIVADO, type YTPlayer } from '../lib/youtube';
import { esc } from '../lib/html';
import { ARTE, CENARIOS, I, arte } from './arte';

type Tela = 'mundo' | 'video' | 'festa' | 'album' | 'familia';
const TELAS: Tela[] = ['mundo', 'video', 'festa', 'album', 'familia'];

export function iniciarModoCrianca(opcoes: { teste: boolean }) {
  const $ = (id: string) => document.getElementById(id)!;
  const progresso = criarProgresso(storageDoNavegador());
  const voz = criarVoz(() => progresso.som);
  const som = criarSons(() => progresso.som);
  const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  let paginaAtual = 0;
  let videoAtual: Video | null = null;
  let player: YTPlayer | null = null;
  let pronto = false;
  let idCriado = '';
  let tocando = false;
  let telaAtual: Tela = 'mundo';

  $('bt-fim').classList.toggle('oculto', !opcoes.teste);

  /* ---------- Navegação ---------- */
  function ir(tela: Tela) {
    telaAtual = tela;
    TELAS.forEach(t => $('tela-' + t).classList.toggle('oculto', t !== tela));
    const naCasa = tela === 'mundo';
    $('bt-casa').classList.toggle('oculto', naCasa || tela === 'video');
    $('bt-album').classList.toggle('oculto', !naCasa);
    $('bt-familia').classList.toggle('oculto', !naCasa);
    $('bt-pais').classList.toggle('oculto', tela === 'video');
    if (tela !== 'video') { pararVideo(); videoAtual = null; }
    if (naCasa) desenharPagina();
  }

  /* ---------- Mundo Flex ---------- */
  function desenharPagina(direcao?: 'vira-prox' | 'vira-ant') {
    const p = PAGINAS[paginaAtual];
    const itens = historias.filter(v => v.pagina === paginaAtual);
    const el = $('pagina');
    el.innerHTML = CENARIOS[p.cenario] + `<h1>${esc(p.nome)}</h1>
      <div class="personagens">${itens.map(v => `
        <div class="personagem" data-slug="${v.slug}">
          <button class="figura" aria-label="${esc(v.titulo)}">${arte(v.slug)}</button>
          <span class="nome" aria-hidden="true">${esc(v.titulo)}</span>
          ${progresso.temAdesivo(v.slug) ? `<span class="estrela">${I.estrela}</span>` : ''}
          <button class="play" aria-label="Assistir ${esc(v.titulo)}">${I.play}</button>
        </div>`).join('')}
      </div>
      ${paginaAtual > 0 ? `<button class="orelha ant" aria-label="Página anterior">${I.setaE}</button>` : ''}
      ${paginaAtual < PAGINAS.length - 1 ? `<button class="orelha prox" aria-label="Próxima página">${I.seta}</button>` : ''}`;
    if (direcao) { el.classList.remove('vira-prox', 'vira-ant'); void el.offsetWidth; el.classList.add(direcao); }
    $('pontos').innerHTML = PAGINAS.map((_, i) => `<span class="${i === paginaAtual ? 'atual' : ''}"></span>`).join('');

    el.querySelectorAll<HTMLElement>('.personagem').forEach(card => {
      const v = porSlug(card.dataset.slug!)!;
      card.querySelector<HTMLButtonElement>('.figura')!.onclick = () => {
        if (card.classList.contains('escolhido')) { abrirVideo(v); return; }
        el.querySelectorAll('.personagem').forEach(c => c.classList.remove('escolhido'));
        card.classList.add('escolhido');
        const f = card.querySelector('.figura svg')!;
        f.classList.remove('balanca'); void (f as HTMLElement).getBoundingClientRect(); f.classList.add('balanca');
        som.pop(); voz.falar(`${v.titulo}! Vamos alongar?`);
      };
      card.querySelector<HTMLButtonElement>('.play')!.onclick = () => abrirVideo(v);
    });
    el.querySelector<HTMLButtonElement>('.orelha.prox')?.addEventListener('click', () => virar(1));
    el.querySelector<HTMLButtonElement>('.orelha.ant')?.addEventListener('click', () => virar(-1));
  }

  function virar(d: 1 | -1) {
    const n = paginaAtual + d;
    if (n < 0 || n >= PAGINAS.length) return;
    paginaAtual = n;
    som.papel();
    desenharPagina(d > 0 ? 'vira-prox' : 'vira-ant');
    setTimeout(() => voz.falar(PAGINAS[n].nome), 300);
  }

  let x0: number | null = null;
  $('pagina').addEventListener('pointerdown', e => { x0 = e.clientX; });
  $('pagina').addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 70) virar(dx < 0 ? 1 : -1);
  });

  /* ---------- Player ---------- */
  function avisoVideo(msg: string) {
    const a = $('aviso-video');
    a.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true">${ARTE.chuva}</svg><div>${msg}</div>`;
    a.classList.remove('oculto');
  }

  function abrirVideo(v: Video) {
    videoAtual = v;
    ir('video');
    $('aviso-video').classList.add('oculto');
    $('bt-voltar-video').innerHTML = I.casa;
    $('bt-playpause').innerHTML = I.play;
    voz.calar();
    if (player) { if (pronto) player.loadVideoById(v.id); return; }
    carregarYouTube().then(YT => {
      if (telaAtual !== 'video' || videoAtual !== v) return;
      if (player) { if (pronto) player.loadVideoById(v.id); return; }
      idCriado = v.id;
      player = new YT.Player('yt', {
        host: HOST_PRIVADO,
        videoId: v.id,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, autoplay: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            pronto = true;
            if (telaAtual === 'video' && videoAtual) {
              if (videoAtual.id !== idCriado) e.target.loadVideoById(videoAtual.id); else e.target.playVideo();
            } else e.target.stopVideo();
          },
          onStateChange: (e: { data: number }) => {
            tocando = e.data === YT.PlayerState.PLAYING;
            $('bt-playpause').innerHTML = tocando ? I.pause : I.play;
            if (e.data === YT.PlayerState.ENDED) fimDoVideo();
          },
          onError: () => avisoVideo('Esse vídeo não quis abrir agora. Vamos escolher outro?'),
        },
      });
    }).catch(() => avisoVideo('Sem internet? O vídeo precisa de conexão para tocar.'));
  }

  function alternarPlay() {
    if (!player || !pronto) return;
    if (tocando) player.pauseVideo(); else player.playVideo();
  }
  function pararVideo() {
    if (pronto) { try { player?.stopVideo(); } catch { /* player indisponível */ } }
    tocando = false;
  }
  function fimDoVideo() {
    const v = videoAtual;
    pararVideo();
    if (!v || telaAtual !== 'video') return;
    if (v.categoria === 'desafio') festaDesafio(v);
    else festaHistoria(v);
  }
  $('cobre').onclick = alternarPlay;
  $('bt-playpause').onclick = alternarPlay;
  $('bt-voltar-video').onclick = () => (videoAtual?.categoria === 'desafio' ? abrirFamilia() : ir('mundo'));
  $('bt-fim').onclick = fimDoVideo;

  /* ---------- Festa! ---------- */
  function festaHistoria(v: Video) {
    ir('festa');
    const novo = progresso.ganhar(v.slug);
    const prox = historias.find(h => !progresso.temAdesivo(h.slug)) ?? historias[(historias.indexOf(v) + 1) % historias.length];
    $('festa').innerHTML = `<h2>Muito bem!</h2>
      <div class="adesivo carimba">${arte(v.slug)}</div>
      <div class="botoes">
        <button class="bt-icone bt-grande" id="f-casa" aria-label="Voltar para o livro">${I.casa}</button>
        <button class="bt-icone bt-grande" id="f-album" aria-label="Ver meu álbum">${I.album}</button>
        <button class="bt-icone bt-grande destaque" id="f-mais" aria-label="Mais uma história: ${esc(prox.titulo)}">${I.mais}</button>
      </div>`;
    som.festa(); setTimeout(() => som.carimbo(), 350); confete();
    voz.falar(novo ? `Muito bem! Você ganhou o adesivo ${v.titulo}!` : 'Muito bem! Que alongamento lindo!');
    $('f-casa').onclick = () => ir('mundo');
    $('f-album').onclick = () => abrirAlbum();
    $('f-mais').onclick = () => abrirVideo(prox);
  }

  function festaDesafio(v: Video) {
    ir('festa');
    const feito = { crianca: false, adulto: false };
    const estrela = I.estrela.replace('<svg', '<svg class="est"');
    $('festa').innerHTML = `<h2>Conseguiram?</h2>
      <div class="dupla">
        <button class="cartao-pessoa" data-q="crianca" aria-pressed="false">${I.crianca}<span>Criança</span>${estrela}</button>
        <button class="cartao-pessoa" data-q="adulto" aria-pressed="false">${I.adulto}<span>Adulto</span>${estrela}</button>
      </div>
      <div id="premio"></div>
      <div class="botoes"><button class="bt-icone bt-grande" id="f-volta" aria-label="Voltar aos desafios">${I.familia}</button></div>`;
    voz.falar('Desafio feito? Toquem na estrela de quem conseguiu!');
    $('festa').querySelectorAll<HTMLButtonElement>('.cartao-pessoa').forEach(b => {
      b.onclick = () => {
        const q = b.dataset.q as 'crianca' | 'adulto';
        if (feito[q]) return;
        feito[q] = true;
        b.classList.add('feito'); b.setAttribute('aria-pressed', 'true'); som.pop();
        if (feito.crianca && feito.adulto) {
          progresso.ganharFamilia(v.slug);
          $('premio').innerHTML = `<div class="adesivo carimba" style="margin-top:14px">${arte('familia')}</div>`;
          som.festa(); setTimeout(() => som.carimbo(), 350); confete();
          voz.falar('Adesivo da família! Vocês são um time!');
        } else voz.falar(q === 'crianca' ? 'Agora o adulto!' : 'Agora a criança!');
      };
    });
    $('f-volta').onclick = () => abrirFamilia();
  }

  /* ---------- Confete de papel picado ---------- */
  function confete() {
    if (reduzido()) return;
    const cv = $('confete') as HTMLCanvasElement, c = cv.getContext('2d');
    if (!c) return;
    cv.width = innerWidth; cv.height = innerHeight;
    const cores = ['#b5543a', '#7f9c96', '#d9a441', '#d98f7e', '#8fb3bf', '#f6ecd9'];
    const ps = Array.from({ length: 140 }, () => ({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5, w: 6 + Math.random() * 10, h: 4 + Math.random() * 8,
      vy: 2 + Math.random() * 3.5, vx: -1.5 + Math.random() * 3, r: Math.random() * 6, vr: -0.15 + Math.random() * 0.3,
      cor: cores[(Math.random() * cores.length) | 0],
    }));
    const t0 = performance.now();
    const quadro = (t: number) => {
      c.clearRect(0, 0, cv.width, cv.height);
      for (const p of ps) {
        p.x += p.vx + Math.sin((t + p.r * 100) / 300); p.y += p.vy; p.r += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.cor; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
      }
      if (t - t0 < 3200) requestAnimationFrame(quadro); else c.clearRect(0, 0, cv.width, cv.height);
    };
    requestAnimationFrame(quadro);
  }

  /* ---------- Álbum ---------- */
  function abrirAlbum() {
    ir('album');
    const n = progresso.contar(historias.map(h => h.slug));
    const nf = desafios.filter(d => progresso.temFamilia(d.slug)).length;
    $('album').innerHTML = `<h1>Meu Álbum</h1>
      <p class="sub">${n} de ${historias.length} histórias</p>
      <div class="grade-adesivos">${historias.map(h => `
        <button class="adesivo ${progresso.temAdesivo(h.slug) ? '' : 'vazio'}" data-slug="${h.slug}" aria-label="${esc(h.titulo)}">${arte(h.slug)}</button>`).join('')}
      </div>
      <div class="secao-titulo">Adesivos da Família · ${nf} de ${desafios.length}</div>
      <div class="grade-adesivos">${desafios.map(d => `
        <button class="adesivo ${progresso.temFamilia(d.slug) ? '' : 'vazio'}" data-slug="${d.slug}" aria-label="${esc(d.titulo)}">${arte(progresso.temFamilia(d.slug) ? 'familia' : d.slug)}</button>`).join('')}
      </div>`;
    voz.falar(n === 0 ? 'Seu álbum está esperando os primeiros adesivos!' : `Você já tem ${n} adesivos!`);
    $('album').querySelectorAll<HTMLButtonElement>('.adesivo').forEach(b => {
      b.onclick = () => {
        const v = porSlug(b.dataset.slug!)!;
        if (b.classList.contains('vazio')) voz.falar(`Esse ainda falta! É ${v.titulo}.`);
        else { som.pop(); voz.falar(v.titulo); }
      };
    });
  }

  /* ---------- Modo Família ---------- */
  function abrirFamilia() {
    ir('familia');
    $('familia').innerHTML = `<h1>Modo Família</h1>
      <p class="sub">Criança e adulto fazem juntos!</p>
      <div class="desafios">${desafios.map(d => `
        <button class="desafio" data-slug="${d.slug}" aria-label="Desafio ${esc(d.titulo)}">
          <div class="figura">${arte(d.slug)}</div>
          <span class="nome">${esc(d.titulo)}</span>
          <span class="duo">${progresso.temFamilia(d.slug) ? I.estrela + I.estrela + ' feito!' : esc(d.duracao)}</span>
        </button>`).join('')}
      </div>`;
    voz.falar('Modo Família! Escolha um desafio para fazer junto com um adulto.');
    $('familia').querySelectorAll<HTMLButtonElement>('.desafio').forEach(b => {
      b.onclick = () => abrirVideo(porSlug(b.dataset.slug!)!);
    });
  }

  /* ---------- Saída para adultos: segurar 3 s ---------- */
  const alvo = $('segurar');
  const anel = alvo.querySelector('circle')!;
  const segurar = criarSegurar({ duracaoMs: 3000, aoConcluir: () => { location.href = '/'; } });
  const comecar = (e: Event) => {
    e.preventDefault();
    anel.style.transition = 'stroke-dashoffset 3s linear';
    anel.style.strokeDashoffset = '0';
    segurar.comecar();
  };
  const cancelar = () => {
    segurar.cancelar();
    anel.style.transition = 'stroke-dashoffset .3s';
    anel.style.strokeDashoffset = '440';
  };
  alvo.addEventListener('pointerdown', comecar);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => alvo.addEventListener(t, cancelar));
  alvo.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) comecar(e); });
  alvo.addEventListener('keyup', cancelar);
  $('barreira-fechar').onclick = () => { cancelar(); $('barreira').classList.add('oculto'); };
  $('bt-pais').onclick = () => {
    voz.calar();
    anel.style.transition = 'none';
    anel.style.strokeDashoffset = '440';
    $('barreira').classList.remove('oculto');
  };

  /* ---------- Barra ---------- */
  const desenharSom = () => { $('bt-som').innerHTML = progresso.som ? I.somOn : I.somOff; };
  $('bt-casa').innerHTML = I.casa;
  $('bt-album').innerHTML = I.album;
  $('bt-familia').innerHTML = I.familia;
  $('bt-pais').innerHTML = I.cadeado;
  desenharSom();
  $('bt-casa').onclick = () => { som.pop(); ir('mundo'); };
  $('bt-album').onclick = () => { som.pop(); abrirAlbum(); };
  $('bt-familia').onclick = () => { som.pop(); abrirFamilia(); };
  $('bt-som').onclick = () => {
    progresso.definirSom(!progresso.som);
    desenharSom();
    if (progresso.som) som.pop(); else voz.calar();
  };

  ir('mundo');
}
