import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { fetchApi } from '@/lib/api';

/**
 * Hook que registra o token Expo Push do dispositivo quando o motorista
 * está logado. Solicita permissão, captura o token, envia pra API e
 * permanece silencioso em caso de falha (sem permissão, simulador, etc).
 *
 * Deve ser usado uma vez no layout autenticado (após login).
 */
export function usePushToken(estaLogado: boolean): void {
  useEffect(() => {
    if (!estaLogado) return;
    if (!Device.isDevice) {
      // Push só funciona em dispositivo físico. Simuladores não recebem.
      return;
    }

    let cancelado = false;

    (async () => {
      try {
        // 1. Configura canal padrão no Android (obrigatório pra >= API 26)
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Padrão',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0066FF',
          });
        }

        // 2. Pede permissão (silencioso se já concedida)
        const existente = await Notifications.getPermissionsAsync();
        let status = existente.status;
        if (status !== 'granted') {
          const pedido = await Notifications.requestPermissionsAsync();
          status = pedido.status;
        }
        if (status !== 'granted') return;

        // 3. Captura o token Expo. projectId vem do EAS/app.json.
        const projectId =
          (Constants?.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) {
          // Sem projectId não dá pra emitir token. Build local (Expo Go público)
          // ainda pega um token genérico — tentamos sem o projectId.
        }

        const tokenResp = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (cancelado) return;

        // 4. Envia pra API
        await fetchApi('/usuarios/me/push-token', {
          method: 'PATCH',
          body: JSON.stringify({ token: tokenResp.data }),
        }).catch(() => {
          // Silencioso — usuário não percebe se falhar a sincronização do token
        });
      } catch {
        // Silencioso. Sem permissão, sem internet, simulador, etc.
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [estaLogado]);
}
