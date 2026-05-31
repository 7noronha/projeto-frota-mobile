import { useMemo } from 'react';
import { ActivityIndicator, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import type { PontoGeo } from '@/lib/distancia';
import { montarUrlMapaEstatico, temTokenMapbox } from '@/lib/mapbox';
import type { StatusLocalizacao } from '@/lib/useLocalizacaoAtual';

interface MapaAcompanhamentoProps {
  /** Coordenadas já resolvidas (da API ou geocodificadas no app). */
  origemCoord: PontoGeo | null;
  destinoCoord: PontoGeo | null;
  /** GeoJSON LineString da rota (vinda da API), opcional. */
  rota_geometria?: unknown | null;
  /** Posição atual do motorista (GPS local) — null se inativo/indisponível. */
  posicaoMotorista: { latitude: number; longitude: number; precisao: number | null } | null;
  statusGps?: StatusLocalizacao;
  mostrarAvisoGps?: boolean;
  altura?: number;
}

/**
 * Mapa de acompanhamento da viagem — renderiza uma imagem do Mapbox Static
 * Images API (sem SDK nativo). Marcadores: origem (verde), destino (azul) e
 * posição do motorista (laranja). Auto-enquadra todos os pontos.
 */
export function MapaAcompanhamento({
  origemCoord,
  destinoCoord,
  rota_geometria,
  posicaoMotorista,
  statusGps,
  mostrarAvisoGps = false,
  altura = 260,
}: MapaAcompanhamentoProps) {
  const { width } = useWindowDimensions();

  const motorista = posicaoMotorista
    ? { latitude: posicaoMotorista.latitude, longitude: posicaoMotorista.longitude }
    : null;

  const url = useMemo(
    () =>
      montarUrlMapaEstatico({
        origem: origemCoord,
        destino: destinoCoord,
        motorista,
        rotaGeoJson: rota_geometria,
        largura: width - 32,
        altura,
      }),
    [origemCoord, destinoCoord, motorista, rota_geometria, width, altura],
  );

  // Sem token configurado: não renderiza o mapa (a distância em texto continua
  // sendo exibida pelo InfoDistancia).
  if (!temTokenMapbox()) return null;

  return (
    <View>
      <View style={[styles.container, { height: altura }]}>
        {url ? (
          <Image
            source={{ uri: url }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            accessibilityLabel="Mapa da rota da viagem"
          />
        ) : (
          <View style={styles.carregando}>
            <ActivityIndicator color="#0066FF" />
            <Text size="xs" style={styles.carregandoTexto}>
              Carregando mapa…
            </Text>
          </View>
        )}

        {mostrarAvisoGps && statusGps && statusGps !== 'ok' && (
          <View style={styles.aviso}>
            <Text size="xs" style={styles.avisoTexto}>
              {statusGps === 'sem-permissao'
                ? 'Permita o acesso ao GPS para ver sua posição no mapa.'
                : statusGps === 'indisponivel'
                  ? 'GPS indisponível. Verifique se a localização está ligada.'
                  : 'Obtendo sua localização…'}
            </Text>
          </View>
        )}
      </View>

      {/* Legenda dos marcadores */}
      <View style={styles.legenda}>
        <Legenda cor="#16A34A" rotulo="Origem" />
        <Legenda cor="#0066FF" rotulo="Destino" />
        {motorista && <Legenda cor="#F97316" rotulo="Você" />}
      </View>
    </View>
  );
}

function Legenda({ cor, rotulo }: { cor: string; rotulo: string }) {
  return (
    <View style={styles.legendaItem}>
      <View style={[styles.legendaBolinha, { backgroundColor: cor }]} />
      <Text size="xs" style={styles.legendaTexto}>
        {rotulo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#EEF2F7',
  },
  carregando: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  carregandoTexto: {
    color: '#64748B',
  },
  aviso: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  avisoTexto: {
    color: '#FFFFFF',
  },
  legenda: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendaBolinha: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendaTexto: {
    color: '#64748B',
  },
});
