export const TODAS = 'Todas';

export const listarObjetivos = (videos: { objetivos: string[] }[]) =>
  [TODAS, ...new Set(videos.flatMap(v => v.objetivos))];

export const combina = (objetivos: string[], filtro: string) =>
  filtro === TODAS || objetivos.includes(filtro);
