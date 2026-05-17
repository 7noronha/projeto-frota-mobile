import { buscarToken, removerToken } from './auth';

// Em Android Emulator, 10.0.2.2 aponta para localhost da máquina host
// Em iOS Simulator, usar localhost diretamente
// Em dispositivo físico, usar o IP da máquina na rede local
const URL_API = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001';

export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ErroApi';
  }
}

/**
 * Callback registrado pelo app root para reagir a 401 globalmente
 * (limpa token + redireciona para login). Evita acoplar fetchApi
 * ao expo-router diretamente.
 */
let handlerNaoAutenticado: (() => void) | null = null;

export function registrarHandlerNaoAutenticado(handler: () => void): void {
  handlerNaoAutenticado = handler;
}

export async function fetchApi<T>(caminho: string, init?: RequestInit): Promise<T> {
  const token = await buscarToken();

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ErroApi(0, 'Sem conexão com o servidor. Verifique sua internet.');
  }

  // 401 (token expirado/inválido) → limpa storage e dispara handler
  if (resposta.status === 401) {
    await removerToken();
    handlerNaoAutenticado?.();
    throw new ErroApi(401, 'Sessão expirada. Faça login novamente.');
  }

  if (resposta.status === 204 || resposta.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const dados = (await resposta.json().catch(() => ({}))) as unknown;

  if (!resposta.ok) {
    const corpo = dados as { message?: string | string[] };
    const mensagem = Array.isArray(corpo.message)
      ? corpo.message[0]
      : (corpo.message ?? 'Erro na requisição');
    throw new ErroApi(resposta.status, mensagem);
  }

  return dados as T;
}
