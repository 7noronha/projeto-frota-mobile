/**
 * Helpers de Mapbox para o app mobile.
 *
 * O app NÃO usa SDK nativo de mapa (sem react-native-maps / Google). Em vez
 * disso renderiza uma imagem do Mapbox Static Images API — funciona em
 * qualquer build (inclusive Expo Go), sem configuração nativa.
 *
 * Tudo parte de endereços: quando a API ainda não geocodificou origem/destino,
 * o próprio app geocodifica via Mapbox (token público EXPO_PUBLIC_MAPBOX_TOKEN).
 */
import type { PontoGeo } from './distancia';

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

export function temTokenMapbox(): boolean {
  return TOKEN.length > 0;
}

/** Geocodifica um endereço (texto) em coordenada via Mapbox. */
export async function geocodificarEndereco(endereco: string): Promise<PontoGeo | null> {
  if (!TOKEN || !endereco.trim()) return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(endereco)}.json` +
      `?access_token=${TOKEN}&country=BR&limit=1&language=pt`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const json: unknown = await resp.json();
    const center = (json as { features?: Array<{ center?: number[] }> })?.features?.[0]?.center;
    if (!Array.isArray(center) || center.length < 2) return null;
    return { latitude: center[1]!, longitude: center[0]! };
  } catch {
    return null;
  }
}

interface OpcoesMapaEstatico {
  origem: PontoGeo | null;
  destino: PontoGeo | null;
  motorista: PontoGeo | null;
  /** GeoJSON LineString da rota (vindo da API), opcional. */
  rotaGeoJson?: unknown | null;
  largura: number;
  altura: number;
}

/** Reduz a quantidade de pontos da rota para caber no limite de URL. */
function amostrarLinha(coords: number[][], maximo = 80): number[][] {
  if (coords.length <= maximo) return coords;
  const passo = Math.ceil(coords.length / maximo);
  const saida: number[][] = [];
  for (let i = 0; i < coords.length; i += passo) saida.push(coords[i]!);
  const ultimo = coords[coords.length - 1]!;
  if (saida[saida.length - 1] !== ultimo) saida.push(ultimo);
  return saida;
}

/**
 * Monta a URL do Mapbox Static Images com a rota (se houver) + marcadores de
 * origem (verde), destino (azul) e posição do motorista (laranja).
 * Retorna null quando não há token ou nenhum ponto para exibir.
 */
export function montarUrlMapaEstatico(opts: OpcoesMapaEstatico): string | null {
  if (!TOKEN) return null;

  const overlays: string[] = [];

  // Rota primeiro (fica por baixo dos marcadores).
  const geo = opts.rotaGeoJson as { type?: string; coordinates?: number[][] } | null;
  if (geo?.type === 'LineString' && Array.isArray(geo.coordinates) && geo.coordinates.length > 1) {
    const feature = {
      type: 'Feature',
      properties: { stroke: '#0047B3', 'stroke-width': 4, 'stroke-opacity': 0.85 },
      geometry: { type: 'LineString', coordinates: amostrarLinha(geo.coordinates) },
    };
    overlays.push(`geojson(${encodeURIComponent(JSON.stringify(feature))})`);
  }

  if (opts.origem) {
    overlays.push(`pin-s+16a34a(${opts.origem.longitude},${opts.origem.latitude})`);
  }
  if (opts.destino) {
    overlays.push(`pin-l+0066ff(${opts.destino.longitude},${opts.destino.latitude})`);
  }
  if (opts.motorista) {
    overlays.push(`pin-s-car+f97316(${opts.motorista.longitude},${opts.motorista.latitude})`);
  }

  if (overlays.length === 0) return null;

  const w = Math.min(Math.max(Math.round(opts.largura), 200), 1280);
  const h = Math.min(Math.max(Math.round(opts.altura), 120), 1280);

  return (
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `${overlays.join(',')}/auto/${w}x${h}@2x?padding=40&access_token=${TOKEN}`
  );
}
