import { useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/api';

interface PosicaoAtual {
  latitude: number;
  longitude: number;
  precisao: number | null;
}

interface Args {
  /** ID da viagem EM_ANDAMENTO. Quando null/undefined, o hook não envia nada. */
  viagemId: string | null | undefined;
  /** Posição GPS atual (do useLocalizacaoAtual). */
  posicao: PosicaoAtual | null;
  /** Se true, o envio está ativo. False = no-op. */
  ativo: boolean;
  /** Intervalo em ms entre envios. Default 3 min. */
  intervaloMs?: number;
}

const INTERVALO_PADRAO_MS = 3 * 60 * 1000;

/**
 * Envia a posição GPS atual do motorista pra API a cada N minutos
 * enquanto a viagem está EM_ANDAMENTO. Padrão: 3 minutos.
 *
 * Comportamento:
 *  - Envia uma vez imediatamente quando ativa
 *  - Depois envia a cada intervaloMs enquanto continuar ativo
 *  - Se a posição estiver indisponível na hora do envio, pula esse ciclo
 *    (próximo ciclo tenta de novo)
 *  - Falhas de rede/auth são silenciosas (não atrapalham o motorista)
 *
 * Usa uma ref pra sempre ler a posição mais recente sem reinstanciar o
 * setInterval — assim o intervalo é estável.
 */
export function useEnviarPosicao({ viagemId, posicao, ativo, intervaloMs = INTERVALO_PADRAO_MS }: Args): void {
  const posicaoRef = useRef<PosicaoAtual | null>(posicao);
  useEffect(() => {
    posicaoRef.current = posicao;
  }, [posicao]);

  useEffect(() => {
    if (!ativo || !viagemId) return;

    const enviar = (): void => {
      const atual = posicaoRef.current;
      if (!atual) return;
      const corpo = {
        latitude: atual.latitude,
        longitude: atual.longitude,
        precisaoM: atual.precisao ?? undefined,
        capturadoEm: new Date().toISOString(),
      };
      fetchApi(`/viagens/${viagemId}/posicoes`, {
        method: 'POST',
        body: JSON.stringify(corpo),
      }).catch(() => {
        // Silencioso — sem internet, sem token, viagem mudou de status, etc
      });
    };

    // Envia imediatamente ao ativar (pra operador ver a posição inicial)
    enviar();
    const id = setInterval(enviar, intervaloMs);
    return () => clearInterval(id);
  }, [viagemId, ativo, intervaloMs]);
}
