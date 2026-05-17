import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';

type Variante = 'sucesso' | 'erro' | 'info';

interface MostrarOpcoes {
  titulo: string;
  descricao?: string;
  variante?: Variante;
  duracao?: number;
}

const CORES: Record<Variante, { fundo: string; texto: string }> = {
  sucesso: { fundo: '#10B981', texto: '#FFFFFF' },
  erro: { fundo: '#DC2626', texto: '#FFFFFF' },
  info: { fundo: '#0066FF', texto: '#FFFFFF' },
};

const ACAO: Record<Variante, 'success' | 'error' | 'info'> = {
  sucesso: 'success',
  erro: 'error',
  info: 'info',
};

/**
 * Hook que retorna funções para disparar toasts via Gluestack v2.
 * Uso:
 *   const notificar = useNotificar();
 *   notificar.sucesso({ titulo: 'Viagem iniciada' });
 */
export function useNotificar(): {
  sucesso: (opts: Omit<MostrarOpcoes, 'variante'>) => void;
  erro: (opts: Omit<MostrarOpcoes, 'variante'>) => void;
  info: (opts: Omit<MostrarOpcoes, 'variante'>) => void;
} {
  const toast = useToast();

  function mostrar(opts: MostrarOpcoes): void {
    const variante = opts.variante ?? 'info';
    const cor = CORES[variante];
    // Erros precisam de mais tempo de leitura que sucesso/info.
    const duracaoPadrao = variante === 'erro' ? 7000 : 5000;
    toast.show({
      placement: 'top',
      duration: opts.duracao ?? duracaoPadrao,
      render: ({ id }: { id: string }) => (
        <Toast
          nativeID={`toast-${id}`}
          action={ACAO[variante]}
          variant="solid"
          style={{ backgroundColor: cor.fundo }}
        >
          <VStack>
            <ToastTitle style={{ color: cor.texto, fontWeight: '600' }}>
              {opts.titulo}
            </ToastTitle>
            {opts.descricao && (
              <ToastDescription size="sm" style={{ color: cor.texto }}>
                {opts.descricao}
              </ToastDescription>
            )}
          </VStack>
        </Toast>
      ),
    });
  }

  return {
    sucesso: (opts) => mostrar({ ...opts, variante: 'sucesso' }),
    erro: (opts) => mostrar({ ...opts, variante: 'erro' }),
    info: (opts) => mostrar({ ...opts, variante: 'info' }),
  };
}
