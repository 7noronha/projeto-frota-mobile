import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import {
  distanciaKm,
  formatarDistancia,
  formatarTempo,
  tempoEstimadoMinutos,
  type PontoGeo,
} from '@/lib/distancia';

interface InfoDistanciaProps {
  posicaoAtual: PontoGeo | null;
  origem: PontoGeo | null;
  destino: PontoGeo | null;
}

/**
 * Card compacto mostrando distância em linha reta até o destino e tempo
 * estimado (velocidade média 40 km/h). Também calcula uma barra de
 * progresso usando a distância total origem→destino como referência.
 *
 * Não renderiza nada se faltar posição atual ou destino — assim a tela
 * não fica poluída em viagens criadas (sem GPS ativo) ou finalizadas.
 */
export function InfoDistancia({ posicaoAtual, origem, destino }: InfoDistanciaProps) {
  const calculado = useMemo(() => {
    if (!posicaoAtual || !destino) return null;
    const restante = distanciaKm(posicaoAtual, destino);
    const tempo = tempoEstimadoMinutos(restante);
    const total = origem ? distanciaKm(origem, destino) : null;
    const progresso =
      total && total > 0
        ? Math.min(Math.max(1 - restante / total, 0), 1)
        : null;
    return { restante, tempo, progresso };
  }, [posicaoAtual, origem, destino]);

  if (!calculado) return null;

  return (
    <View style={styles.card}>
      <View style={styles.linha}>
        <View style={styles.metrica}>
          <Navigation size={18} color="#0066FF" />
          <View>
            <Text size="xs" style={styles.rotulo}>
              Faltam
            </Text>
            <Text size="md" style={styles.valor}>
              {formatarDistancia(calculado.restante)}
            </Text>
          </View>
        </View>

        <View style={styles.separador} />

        <View style={styles.metrica}>
          <MapPin size={18} color="#0066FF" />
          <View>
            <Text size="xs" style={styles.rotulo}>
              Tempo estimado
            </Text>
            <Text size="md" style={styles.valor}>
              {formatarTempo(calculado.tempo)}
            </Text>
          </View>
        </View>
      </View>

      {calculado.progresso != null && (
        <View style={styles.barraTrilha}>
          <View
            style={[
              styles.barraPreenchida,
              { width: `${Math.round(calculado.progresso * 100)}%` },
            ]}
          />
        </View>
      )}

      <Text size="xs" style={styles.aviso}>
        Distância em linha reta · tempo estimado a 40 km/h
      </Text>
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
    gap: 10,
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
  barraTrilha: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  barraPreenchida: {
    height: '100%',
    backgroundColor: '#0066FF',
  },
  aviso: {
    color: '#94A3B8',
  },
});
