import { useEffect, useMemo, useState } from 'react';
import type { PontoGeo } from './distancia';
import { geocodificarEndereco } from './mapbox';

/**
 * Resolve a coordenada de um endereço: usa a coordenada vinda da API quando
 * presente; senão geocodifica o endereço (texto) pela Mapbox no próprio app.
 * Mantém o fluxo "tudo por endereço" funcionando mesmo sem coords da API.
 */
export function useEnderecoCoord(
  endereco: string | null | undefined,
  latProp: number | null,
  lngProp: number | null,
): PontoGeo | null {
  const [geo, setGeo] = useState<PontoGeo | null>(null);

  useEffect(() => {
    if ((latProp != null && lngProp != null) || geo || !endereco) return;
    let vivo = true;
    void geocodificarEndereco(endereco).then((c) => {
      if (vivo && c) setGeo(c);
    });
    return () => {
      vivo = false;
    };
  }, [endereco, latProp, lngProp, geo]);

  return useMemo<PontoGeo | null>(
    () => (latProp != null && lngProp != null ? { latitude: latProp, longitude: lngProp } : geo),
    [latProp, lngProp, geo],
  );
}
