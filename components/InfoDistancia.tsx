import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Clock, Navigation } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import {
  distanciaKm,
  formatarDistancia,
  formatarTempo,
  type PontoGeo,
} from '@/lib/distancia';

interface InfoDistanciaProps {
  posicaoAtual: PontoGeo | null;
  destino: PontoGeo | null;
  /** ISO 8601 do início real da viagem. */
  inicioReal: string | null;
}

/**
 * Card compacto com:
 *  - "Faltam X km" — distância em linha reta até o destino
 *  - "Em viagem há Y" — tempo decorrido desde o início real
 *
 * Não persiste nada. Atualiza o tempo decorrido a cada 30s.
 */
export function InfoDistancia({ posicaoAtual, destino, inicioReal }: InfoDistanciaProps) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!inicioReal) return;
    const t = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [inicioReal]);

  const restanteKm = useMemo(() => {
    if (!posicaoAtual || !destino) return null;
    return distanciaKm(posicaoAtual, destino);
  }, [posicaoAtual, destino]);

  const decorridoMin = useMemo(() => {
    if (!inicioReal) return null;
    const inicioMs = new Date(inicioReal).getTime();
    if (!Number.isFinite(inicioMs)) return null;
    return Math.max((agora - inicioMs) / 60_000, 0);
  }, [inicioReal, agora]);

  if (restanteKm == null && decorridoMin == null) return null;

  return (
    <View style={styles.card}>
      <View style={styles.linha}>
        {restanteKm != null && (
          <View style={styles.metrica}>
            <Navigation size={18} color="#0066FF" />
            <View>
              <Text size="xs" style={styles.rotulo}>
                Faltam
              </Text>
              <Text size="md" style={styles.valor}>
                {formatarDistancia(restanteKm)}
              </Text>
            </View>
          </View>
        )}

        {restanteKm != null && decorridoMin != null && (
          <View style={styles.separador} />
        )}

        {decorridoMin != null && (
          <View style={styles.metrica}>
            <Clock size={18} color="#0066FF" />
            <View>
              <Text size="xs" style={styles.rotulo}>
                Em viagem há
              </Text>
              <Text size="md" style={styles.valor}>
                {formatarTempo(decorridoMin)}
              </Text>
            </View>
          </View>
        )}
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
  metrica: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  separador: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
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
});
