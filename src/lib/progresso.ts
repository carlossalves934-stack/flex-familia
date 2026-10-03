export interface StorageLike {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
}

export const CHAVE_PROGRESSO = 'flex-familia-progresso-v1';

interface Dados { adesivos: Record<string, true>; familia: Record<string, true>; som: boolean }

const vazio = (): Dados => ({ adesivos: {}, familia: {}, som: true });
const ehObjeto = (x: unknown): x is Record<string, true> => typeof x === 'object' && x !== null && !Array.isArray(x);

function ler(storage: StorageLike | null): Dados {
  try {
    const bruto = storage?.getItem(CHAVE_PROGRESSO);
    if (!bruto) return vazio();
    const d = JSON.parse(bruto);
    return {
      adesivos: ehObjeto(d?.adesivos) ? d.adesivos : {},
      familia: ehObjeto(d?.familia) ? d.familia : {},
      som: typeof d?.som === 'boolean' ? d.som : true,
    };
  } catch {
    return vazio();
  }
}

export function criarProgresso(storage: StorageLike | null) {
  let dados = ler(storage);
  const salvar = () => {
    try { storage?.setItem(CHAVE_PROGRESSO, JSON.stringify(dados)); } catch { /* sem armazenamento: segue sem guardar */ }
  };
  return {
    temAdesivo: (slug: string) => !!dados.adesivos[slug],
    ganhar(slug: string) {
      const novo = !dados.adesivos[slug];
      dados.adesivos[slug] = true;
      salvar();
      return novo;
    },
    temFamilia: (slug: string) => !!dados.familia[slug],
    ganharFamilia(slug: string) { dados.familia[slug] = true; salvar(); },
    contar: (slugs: string[]) => slugs.filter(s => dados.adesivos[s]).length,
    get som() { return dados.som; },
    definirSom(ligado: boolean) { dados.som = ligado; salvar(); },
    zerar() { dados = { ...vazio(), som: dados.som }; salvar(); },
  };
}

export type Progresso = ReturnType<typeof criarProgresso>;

export function storageDoNavegador(): StorageLike | null {
  try { return window.localStorage; } catch { return null; }
}
