import { z } from 'zod';

export const CANAL = 'https://www.youtube.com/@flexfamiliaonline';
export const CANAL_INSCREVER = `${CANAL}?sub_confirmation=1`;

export const PAGINAS = [
  { nome: 'Floresta', cenario: 'floresta' },
  { nome: 'Mar e Céu', cenario: 'mar' },
  { nome: 'Castelo e Jardim', cenario: 'castelo' },
] as const satisfies readonly { nome: string; cenario: 'floresta' | 'mar' | 'castelo' }[];

const VideoSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    titulo: z.string().min(1),
    categoria: z.enum(['historia', 'desafio', 'adultos']),
    duracao: z.string().regex(/^\d{1,2}:\d{2}$/),
    objetivos: z.array(z.string().min(1)).min(1),
    beneficios: z.array(z.string().min(1)).min(1),
    pagina: z.number().int().min(0).max(PAGINAS.length - 1).optional(),
    destaque: z.boolean().default(false),
    revisadoPelaProfessora: z.boolean().default(false),
  })
  .refine(v => v.categoria !== 'historia' || v.pagina !== undefined, {
    message: 'toda história precisa de uma página do livro',
  });

export type Video = z.infer<typeof VideoSchema>;
export type Categoria = Video['categoria'];

// Benefícios e objetivos são rascunhos; a professora revisa e marca revisadoPelaProfessora.
const DADOS: z.input<typeof VideoSchema>[] = [
  { id: 'MCIFwfr5iyg', slug: 'lebre', titulo: 'A Lebre e a Tartaruga', categoria: 'historia', pagina: 0, duracao: '7:19',
    objetivos: ['Acalmar'],
    beneficios: ['Alonga pernas e a parte de trás das coxas', 'Ensina a fazer com calma, no próprio ritmo', 'Une atenção à história e ao corpo'] },
  { id: '3jK7Ep7Fjmg', slug: 'leao', titulo: 'O Rato e o Leão', categoria: 'historia', pagina: 0, duracao: '6:00', destaque: true,
    objetivos: ['Força'],
    beneficios: ['Alonga braços e costas', 'Estimula a imaginação com a fábula', 'Conversa sobre amizade e ajudar o outro'] },
  { id: 'rFX-Vw-cbz4', slug: 'cachorro', titulo: 'O Cachorro e seu Osso', categoria: 'historia', pagina: 0, duracao: '5:39', destaque: true,
    objetivos: ['Equilíbrio', 'Gastar energia'],
    beneficios: ['Movimenta a coluna em quatro apoios', 'Trabalha coordenação e equilíbrio', 'Imitar bichos deixa tudo mais divertido'] },
  { id: 'EH-uvdTY2bs', slug: 'baleia', titulo: 'A Baleia no Mar', categoria: 'historia', pagina: 1, duracao: '5:55',
    objetivos: ['Acalmar', 'Antes de dormir'],
    beneficios: ['Alonga a lateral do corpo e a coluna', 'Respiração tranquila que acalma', 'Boa escolha para antes de dormir'] },
  { id: 'XnkesburZt8', slug: 'chuva', titulo: 'A Chuva', categoria: 'historia', pagina: 1, duracao: '3:01',
    objetivos: ['Pausa rápida', 'Acalmar'],
    beneficios: ['Curtinha: cabe em qualquer pausa', 'Alonga braços e ombros', 'Movimentos lentos que ajudam a relaxar'] },
  { id: 'LonFp66OCb0', slug: 'mae', titulo: 'Você é minha Mãe?', categoria: 'historia', pagina: 1, duracao: '9:16',
    objetivos: ['Antes de dormir'],
    beneficios: ['Sessão completa para o corpo todo', 'Trabalha a flexibilidade geral', 'Fala de família e acolhimento'] },
  { id: 'FhwKmpQJ7OQ', slug: 'castelo', titulo: 'Val e o Castelo', categoria: 'historia', pagina: 2, duracao: '6:25',
    objetivos: ['Equilíbrio', 'Força'],
    beneficios: ['Posições de equilíbrio que fortalecem as pernas', 'Estimula a imaginação', 'Ajuda na postura'] },
  { id: 'u-beIpngxCk', slug: 'ana', titulo: 'Ana e os Alecrins', categoria: 'historia', pagina: 2, duracao: '5:27',
    objetivos: ['Acalmar'],
    beneficios: ['Alonga pernas e quadril', 'Aproxima a criança da natureza pela história', 'Movimentos suaves para todas as idades'] },
  { id: 'AWbMAYgKn9s', slug: 'boneco', titulo: 'O Boneco de Borracha', categoria: 'historia', pagina: 2, duracao: '4:20',
    objetivos: ['Gastar energia'],
    beneficios: ['Mostra como o corpo pode ser flexível', 'Desenvolve consciência corporal', 'Muito divertido de imitar'] },
  { id: 'nH7hqLsBSyc', slug: 'pascoa', titulo: 'A Páscoa', categoria: 'historia', pagina: 2, duracao: '4:45', destaque: true,
    objetivos: ['Gastar energia', 'Equilíbrio'],
    beneficios: ['Tema especial para a Páscoa', 'Saltinhos leves e alongamentos', 'Trabalha coordenação'] },
  { id: 'RaA6PlsffA4', slug: 'aviao', titulo: 'Aviãozinho', categoria: 'desafio', duracao: '0:27',
    objetivos: ['Equilíbrio'],
    beneficios: ['Equilíbrio em um pé só', 'Fortalece pernas e costas', 'Adulto e criança fazem juntos'] },
  { id: 'Kd9wF1n3Hcs', slug: 'ombro', titulo: 'Mobilidade de Ombro', categoria: 'desafio', duracao: '0:17',
    objetivos: ['Ombros'],
    beneficios: ['Solta os ombros', 'Bom para quem passa muito tempo sentado', 'Rapidinho: menos de meio minuto'] },
  { id: 'H_UmX0C8q48', slug: 'quadril', titulo: 'Mobilidade do Quadril', categoria: 'desafio', duracao: '0:28',
    objetivos: ['Quadril'],
    beneficios: ['Melhora a mobilidade do quadril', 'Ajuda a sentar no chão com conforto', 'Desafio leve para toda a família'] },
  { id: 'M1FZADDZFlI', slug: 'office', titulo: 'Home Office Stretch', categoria: 'adultos', duracao: '1:22',
    objetivos: ['Pescoço e ombros', 'Na cadeira'],
    beneficios: ['Alivia pescoço e ombros no trabalho', 'Pode ser feito na cadeira', 'Pausa de pouco mais de um minuto'] },
  { id: 'M4HIEzNaLzQ', slug: 'soltar', titulo: 'Sequência para "Soltar Quadril"', categoria: 'adultos', duracao: '1:01',
    objetivos: ['Quadril', 'Começo do dia'],
    beneficios: ['Solta o quadril depois de muito tempo sentado', 'Sequência curta e guiada', 'Boa para começar ou terminar o dia'] },
];

export const VIDEOS: Video[] = z.array(VideoSchema).parse(DADOS);

export const historias = VIDEOS.filter(v => v.categoria === 'historia');
export const desafios = VIDEOS.filter(v => v.categoria === 'desafio');
export const adultos = VIDEOS.filter(v => v.categoria === 'adultos');
// Ordem da abertura: leão, páscoa, cachorro (capas em alta resolução e sem título escrito por cima).
export const destaques = ['leao', 'pascoa', 'cachorro'].map(s => VIDEOS.find(v => v.slug === s)!).filter(v => v.destaque);

export const porSlug = (slug: string) => VIDEOS.find(v => v.slug === slug);
export const porId = (id: string) => VIDEOS.find(v => v.id === id);

export const capa = (id: string, qualidade: 'hqdefault' | 'maxresdefault' = 'hqdefault') =>
  `https://i.ytimg.com/vi/${id}/${qualidade}.jpg`;

export function faixaMinutos(videos: Video[]) {
  const minutos = videos.map(v => Number(v.duracao.split(':')[0]));
  return { min: Math.min(...minutos), max: Math.max(...minutos) };
}

export function rotuloCategoria(v: Video) {
  if (v.categoria === 'adultos') return 'Para adultos';
  if (v.categoria === 'desafio') return 'Desafio em família';
  return 'Para crianças de 3 a 6 anos';
}

export const pendentesDeRevisao = () => VIDEOS.filter(v => !v.revisadoPelaProfessora);
