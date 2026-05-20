import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Text } from '@/components/ui/text';
import { useLocalizacaoAtual } from '@/lib/useLocalizacaoAtual';

interface MapaAcompanhamentoProps {
  origemLatitude: number | null;
  origemLongitude: number | null;
  destinoLatitude: number | null;
  destinoLongitude: number | null;
  /**
   * Quando true, ativa o GPS e mostra a posição do motorista.
   * Use só quando a viagem estiver EM_ANDAMENTO.
   */
  rastrearMotorista?: boolean;
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
  origemLatitude,
  origemLongitude,
  destinoLatitude,
  destinoLongitude,
  rastrearMotorista = false,
  altura = 260,
}: MapaAcompanhamentoProps) {
  const mapRef = useRef<MapView>(null);

  const origem = useMemo<Ponto | null>(
    () =>
      origemLatitude != null && origemLongitude != null
        ? { latitude: origemLatitude, longitude: origemLongitude }
        : null,
    [origemLatitude, origemLongitude],
  );
  const destino = useMemo<Ponto | null>(
    () =>
      destinoLatitude != null && destinoLongitude != null
        ? { latitude: destinoLatitude, longitude: destinoLongitude }
        : null,
    [destinoLatitude, destinoLongitude],
  );

  const { coords: minha, status } = useLocalizacaoAtual({ ativo: rastrearMotorista });

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

      {rastrearMotorista && status !== 'ok' && (
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
