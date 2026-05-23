import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Text } from '@/components/ui/text';
import type { StatusLocalizacao } from '@/lib/useLocalizacaoAtual';

interface MapaAcompanhamentoProps {
  origem_latitude: number | null;
  origem_longitude: number | null;
  destino_latitude: number | null;
  destino_longitude: number | null;
  /** Posição atual do motorista (hoisted) — null se GPS inativo/indisponível. */
  posicaoMotorista: { latitude: number; longitude: number; precisao: number | null } | null;
  /** Estado da permissão/GPS do motorista (para aviso visual). */
  statusGps?: StatusLocalizacao;
  /** Quando true, mostra o aviso amarelo se status != 'ok'. */
  mostrarAvisoGps?: boolean;
  altura?: number;
}

interface Ponto {
  latitude: number;
  longitude: number;
}

function regiaoEnquadrandoPontos(pontos: Ponto[]): Region {
  if (pontos.length === 0) {
    return { latitude: -15.7942, longitude: -47.8822, latitudeDelta: 30, longitudeDelta: 30 };
  }
  const lats = pontos.map((p) => p.latitude);
  const lngs = pontos.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const padding = 1.4;
  const latitudeDelta = Math.max((maxLat - minLat) * padding, 0.01);
  const longitudeDelta = Math.max((maxLng - minLng) * padding, 0.01);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}

/**
 * Mapa do acompanhamento da viagem.
 * - Marcador verde: origem (sede)
 * - Marcador azul: destino
 * - Marcador laranja: posição atual do motorista (em memória, GPS local)
 *
 * Auto-enquadra origem + destino na carga inicial. A posição atual é só
 * exibida — não é persistida em lugar nenhum.
 */
export function MapaAcompanhamento({
  origem_latitude,
  origem_longitude,
  destino_latitude,
  destino_longitude,
  posicaoMotorista,
  statusGps,
  mostrarAvisoGps = false,
  altura = 260,
}: MapaAcompanhamentoProps) {
  const mapRef = useRef<MapView>(null);

  const origem = useMemo<Ponto | null>(
    () =>
      origem_latitude != null && origem_longitude != null
        ? { latitude: origem_latitude, longitude: origem_longitude }
        : null,
    [origem_latitude, origem_longitude],
  );
  const destino = useMemo<Ponto | null>(
    () =>
      destino_latitude != null && destino_longitude != null
        ? { latitude: destino_latitude, longitude: destino_longitude }
        : null,
    [destino_latitude, destino_longitude],
  );

  const minha = posicaoMotorista;
  const status = statusGps;

  const regiaoInicial = useMemo(() => {
    const pontos: Ponto[] = [];
    if (origem) pontos.push(origem);
    if (destino) pontos.push(destino);
    return regiaoEnquadrandoPontos(pontos);
  }, [origem, destino]);

  // Quando o motorista vira visível pela primeira vez, reenquadra incluindo ele.
  useEffect(() => {
    if (!mapRef.current || !minha) return;
    const pontos: Ponto[] = [{ latitude: minha.latitude, longitude: minha.longitude }];
    if (origem) pontos.push(origem);
    if (destino) pontos.push(destino);
    mapRef.current.animateToRegion(regiaoEnquadrandoPontos(pontos), 600);
  }, [minha, origem, destino]);

  if (!origem && !destino) {
    return null;
  }

  return (
    <View style={[styles.container, { height: altura }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={regiaoInicial}
        showsUserLocation={false}
        showsCompass
        toolbarEnabled={false}
      >
        {origem && (
          <Marker
            coordinate={origem}
            title="Origem"
            description="Saída"
            pinColor="#16A34A"
          />
        )}
        {destino && (
          <Marker
            coordinate={destino}
            title="Destino"
            description="Chegada"
            pinColor="#0066FF"
          />
        )}
        {minha && (
          <Marker
            coordinate={{ latitude: minha.latitude, longitude: minha.longitude }}
            title="Você está aqui"
            description={
              minha.precisao != null
                ? `Precisão: ${Math.round(minha.precisao)} m`
                : undefined
            }
            pinColor="#F97316"
          />
        )}
      </MapView>

      {mostrarAvisoGps && status && status !== 'ok' && (
        <View style={styles.aviso}>
          <Text size="xs" style={styles.avisoTexto}>
            {status === 'sem-permissao'
              ? 'Permita o acesso ao GPS para ver sua posição no mapa.'
              : status === 'indisponivel'
                ? 'GPS indisponível. Verifique se a localização está ligada.'
                : 'Obtendo sua localização…'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
});
