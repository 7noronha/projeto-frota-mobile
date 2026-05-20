import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type StatusLocalizacao =
  | 'verificando'
  | 'sem-permissao'
  | 'indisponivel'
  | 'ok';

export interface Coordenadas {
  latitude: number;
  longitude: number;
  precisao: number | null;
  obtidoEm: number;
}

interface OpcoesUseLocalizacao {
  /**
   * Distância mínima em metros que o motorista precisa se mover antes de
   * gerar um novo update. Default: 10m.
   */
  distanciaMinima?: number;
  /**
   * Intervalo mínimo entre atualizações, em milissegundos. Default: 5s.
   */
  intervaloMinimo?: number;
  /**
   * Quando `false`, o hook não pede permissão nem começa o watch.
   * Útil pra suspender o GPS quando a viagem não está em andamento.
   */
  ativo?: boolean;
}

/**
 * Lê a localização atual do dispositivo via expo-location e mantém um
 * watcher enquanto montado. Tudo em memória — nada é persistido no
 * servidor. Não bloqueia a UI se permissão for negada.
 */
export function useLocalizacaoAtual(opcoes: OpcoesUseLocalizacao = {}): {
  status: StatusLocalizacao;
  coords: Coordenadas | null;
  erro: string | null;
} {
  const { distanciaMinima = 10, intervaloMinimo = 5000, ativo = true } = opcoes;
  const [status, setStatus] = useState<StatusLocalizacao>('verificando');
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!ativo) {
      setStatus('verificando');
      setCoords(null);
      setErro(null);
      return;
    }

    let assinaturaWatch: Location.LocationSubscription | null = null;
    let cancelado = false;

    (async () => {
      try {
        const { status: statusPermissao } =
          await Location.requestForegroundPermissionsAsync();
        if (cancelado) return;
        if (statusPermissao !== 'granted') {
          setStatus('sem-permissao');
          return;
        }

        const servicosLigados = await Location.hasServicesEnabledAsync();
        if (cancelado) return;
        if (!servicosLigados) {
          setStatus('indisponivel');
          setErro('GPS desligado no dispositivo');
          return;
        }

        // Primeira leitura (rápida) — usa o último fix conhecido se houver.
        const inicial =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));
        if (cancelado) return;
        if (inicial) {
          setCoords({
            latitude: inicial.coords.latitude,
            longitude: inicial.coords.longitude,
            precisao: inicial.coords.accuracy ?? null,
            obtidoEm: inicial.timestamp,
          });
          setStatus('ok');
        }

        // Watch contínuo (movimento + tempo mínimo).
        assinaturaWatch = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: distanciaMinima,
            timeInterval: intervaloMinimo,
          },
          (pos) => {
            setCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              precisao: pos.coords.accuracy ?? null,
              obtidoEm: pos.timestamp,
            });
            setStatus('ok');
          },
        );
      } catch (e) {
        if (cancelado) return;
        setStatus('indisponivel');
        setErro(e instanceof Error ? e.message : 'Erro ao obter localização');
      }
    })();

    return () => {
      cancelado = true;
      assinaturaWatch?.remove();
    };
  }, [ativo, distanciaMinima, intervaloMinimo]);

  return { status, coords, erro };
}
