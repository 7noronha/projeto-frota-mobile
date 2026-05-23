import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Clock, Info, MapPin, Navigation } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import {
  distanciaKm,
  formatarDistancia,
  formatarTempo,
  type PontoGeo,
} from '@/lib/distancia';

interface InfoDistanciaProps {
  /** Posição atual do motorista (GPS). Quando ausente, só mostra a planejada. */
  posicaoAtual: PontoGeo | null;
  origem: PontoGeo | null;
  destino: PontoGeo | null;
  /** ISO 8601 do início real da viagem (para "em viagem há"). */
  inicioReal: string | null;
  /** Distância real por estrada (km) vinda da rota Mapbox cacheada no banco.
   * Quando presente, substitui Haversine no cálculo de ETA. */
  rota_distancia_km?: number | null;
  /** Velocidade média histórica do motorista (km/h). Quando presente,
   * substitui o fallback de 40 km/h no cálculo de ETA. */
  velocidade_media_km_h?: number | null;
}

interface Metrica {
  rotulo: string;
  valor: string;
  Icone: typeof Navigation;
}

/**
 * Card de métricas da viagem. Mostra três blocos conforme dados disponíveis:
 *  - **Distância planejada** (origem→destino) — sempre que houver coords
 *  - **Faltam X km** (posição atual→destino) — quando o motorista está em
 *    viagem (GPS ativo)
 *  - **Em viagem há Y** — desde o início real
 *
 * Sem nenhum dos três, não renderiza nada.
 */
export function InfoDistancia({
  posicaoAtual,
  origem,
  destino,
  inicioReal,
  rota_distancia_km,
  velocidade_media_km_h,
}: InfoDistanciaProps) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!inicioReal) return;
    const t = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [inicioReal]);

  const metricas = useMemo<Metrica[]>(() => {
    const itens: Metrica[] = [];

    // 1. Distância planejada — prioriza rota real por estrada; cai pra
    // linha reta (Haversine) se não houver cache da rota
    if (origem && destino) {
      const km = rota_distancia_km ?? distanciaKm(origem, destino);
      itens.push({
        rotulo: 'Distância planejada',
        valor: formatarDistancia(km),
        Icone: MapPin,
      });
    }

    // 2. Distância restante — só quando motorista está dirigindo
    if (posicaoAtual && destino) {
      const kmRestante = distanciaKm(posicaoAtual, destino);
      itens.push({
        rotulo: 'Faltam',
        valor: formatarDistancia(kmRestante),
        Icone: Navigation,
      });

      // 2b. ETA — usa velocidade calibrada do motorista quando disponível
      const velocidadeKmH = velocidade_media_km_h ?? 40;
      if (velocidadeKmH > 0) {
        const minutos = (kmRestante / velocidadeKmH) * 60;
        itens.push({
          rotulo: 'Chega em',
          valor: formatarTempo(minutos),
          Icone: Clock,
        });
      }
    }

    // 3. Tempo decorrido — só quando a viagem já começou E não temos ETA
    // (pra não inflar a UI com 4 métricas)
    if (inicioReal && !(posicaoAtual && destino)) {
      const inicioMs = new Date(inicioReal).getTime();
      if (Number.isFinite(inicioMs)) {
        itens.push({
          rotulo: 'Em viagem há',
          valor: formatarTempo(Math.max((agora - inicioMs) / 60_000, 0)),
          Icone: Clock,
        });
      }
    }

    return itens;
  }, [origem, destino, posicaoAtual, inicioReal, agora, rota_distancia_km, velocidade_media_km_h]);

  if (metricas.length === 0) {
    // Sem coords e sem inicioReal: card informativo discreto pra usuário
    // entender por que não há cálculo (em vez de simplesmente não aparecer).
    return (
      <View style={styles.card}>
        <View style={styles.metrica}>
          <Info size={18} color="#94A3B8" />
          <View style={styles.textos}>
            <Text size="xs" style={styles.rotulo}>
              Distância até o destino
            </Text>
            <Text size="sm" style={styles.placeholder}>
              Aguardando coordenadas do endereço.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.linha}>
        {metricas.map((m, i) => (
          <View key={m.rotulo} style={[styles.metricaWrapper, i > 0 && styles.separador]}>
            <View style={styles.metrica}>
              <m.Icone size={18} color="#0066FF" />
              <View style={styles.textos}>
                <Text size="xs" style={styles.rotulo}>
                  {m.rotulo}
                </Text>
                <Text size="md" style={styles.valor}>
                  {m.valor}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricaWrapper: {
    flex: 1,
  },
  separador: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 12,
    marginLeft: 4,
  },
  metrica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textos: {
    flexShrink: 1,
  },
  rotulo: {
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valor: {
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 2,
  },
  placeholder: {
    color: '#64748B',
    marginTop: 2,
  },
});
