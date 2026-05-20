/**
 * Cálculos de distância e formatação de tempo decorrido.
 *
 * Distância em linha reta via Haversine — não é a distância real por
 * estradas, mas é suficiente como referência ("falta perto" vs "ainda
 * longe") sem custo de API externa. Se um dia quisermos rota real,
 * trocamos por uma chamada à Mapbox Directions API no servidor.
 */

const RAIO_TERRA_KM = 6371;

function paraRadianos(graus: number): number {
  return (graus * Math.PI) / 180;
}

export interface PontoGeo {
  latitude: number;
  longitude: number;
}

/**
 * Distância em linha reta entre dois pontos, em quilômetros.
 * Fórmula de Haversine, considerando a Terra como esfera.
 */
export function distanciaKm(a: PontoGeo, b: PontoGeo): number {
  const dLat = paraRadianos(b.latitude - a.latitude);
  const dLng = paraRadianos(b.longitude - a.longitude);
  const lat1 = paraRadianos(a.latitude);
  const lat2 = paraRadianos(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h));
}

/**
 * Formata uma distância em km para exibição:
 *  - < 1 km: "850 m"
 *  - < 10 km: "2,3 km"
 *  - >= 10 km: "23 km"
 */
export function formatarDistancia(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

/**
 * Formata minutos para exibição:
 *  - < 1 min: "<1 min"
 *  - < 60 min: "23 min"
 *  - >= 60 min: "1h 23min"
 */
export function formatarTempo(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos < 0) return '—';
  if (minutos < 1) return '<1 min';
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
