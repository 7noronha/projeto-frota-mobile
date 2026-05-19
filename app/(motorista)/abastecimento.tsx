import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@/components/ui/form-control';
import { fetchApi, ErroApi } from '@/lib/api';
import { useNotificar } from '@/lib/notificar';
import type { CriarAbastecimento, TipoCombustivel } from '@/tipos';

const COMBUSTIVEIS: { valor: TipoCombustivel; rotulo: string }[] = [
  { valor: 'gasolina', rotulo: 'Gasolina' },
  { valor: 'etanol', rotulo: 'Etanol' },
  { valor: 'diesel', rotulo: 'Diesel' },
  { valor: 'gnv', rotulo: 'GNV' },
  { valor: 'flex', rotulo: 'Flex' },
];

// Aceita vírgula (pt-BR) ou ponto
function paraNumero(v: string): number {
  return parseFloat(v.replace(',', '.'));
}

export default function TelaAbastecimento() {
  const { viagemId, placa } = useLocalSearchParams<{ viagemId: string; placa?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const notificar = useNotificar();

  const [litros, setLitros] = useState('');
  const [precoLitro, setPrecoLitro] = useState('');
  const [valor, setValor] = useState('');
  const [combustivel, setCombustivel] = useState<TipoCombustivel | null>(null);
  const [odometro, setOdometro] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const totalCalculado = useMemo(() => {
    const l = paraNumero(litros);
    const p = paraNumero(precoLitro);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) return (l * p).toFixed(2);
    return null;
  }, [litros, precoLitro]);

  const mutacao = useMutation({
    mutationFn: (corpo: CriarAbastecimento) =>
      fetchApi(`/viagens/${viagemId}/despesas`, {
        method: 'POST',
        body: JSON.stringify(corpo),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viagem', viagemId] });
      notificar.sucesso({
        titulo: 'Abastecimento registrado',
        descricao: 'A despesa foi lançada na viagem.',
      });
      router.back();
    },
    onError: (e) => {
      const msg = e instanceof ErroApi ? e.message : 'Erro ao registrar abastecimento';
      setErro(msg);
      notificar.erro({ titulo: 'Não foi possível registrar', descricao: msg });
    },
  });

  function handleSalvar() {
    const l = paraNumero(litros);
    const p = paraNumero(precoLitro);
    const v = valor.trim() ? paraNumero(valor) : Number(totalCalculado);

    if (isNaN(l) || l <= 0) return setErro('Informe os litros (maior que zero)');
    if (isNaN(p) || p <= 0) return setErro('Informe o preço por litro (maior que zero)');
    if (!combustivel) return setErro('Selecione o tipo de combustível');
    if (isNaN(v) || v <= 0) return setErro('Informe o valor total (maior que zero)');

    const odo = odometro.trim() ? parseInt(odometro, 10) : undefined;
    if (odometro.trim() && (odo === undefined || isNaN(odo) || odo < 0)) {
      return setErro('Odômetro inválido');
    }

    setErro(null);
    mutacao.mutate({
      valor: Number(v.toFixed(2)),
      litros: l,
      precoLitro: p,
      tipoCombustivel: combustivel,
      odometro: odo,
      observacoes: observacoes.trim() || undefined,
    });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
    >
      <VStack style={{ gap: 16, paddingHorizontal: 16, paddingVertical: 16 }}>
        <Box>
          <Heading size="lg" style={{ color: '#0F172A' }}>
            Novo abastecimento
          </Heading>
          {placa ? (
            <Text style={{ color: '#94A3B8', marginTop: 4 }}>Veículo {placa}</Text>
          ) : null}
        </Box>

        <FormControl isInvalid={!!erro}>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Litros
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              keyboardType="decimal-pad"
              value={litros}
              onChangeText={(v) => {
                setLitros(v);
                setErro(null);
              }}
              placeholder="Ex.: 42,137"
            />
          </Input>
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Preço por litro (R$)
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              keyboardType="decimal-pad"
              value={precoLitro}
              onChangeText={(v) => {
                setPrecoLitro(v);
                setErro(null);
              }}
              placeholder="Ex.: 6,829"
            />
          </Input>
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Valor total (R$)
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={(v) => {
                setValor(v);
                setErro(null);
              }}
              placeholder={totalCalculado ?? 'Ex.: 287,50'}
            />
          </Input>
          {totalCalculado && !valor.trim() ? (
            <Text size="xs" style={{ color: '#94A3B8', marginTop: 4 }}>
              Calculado: R$ {totalCalculado} (litros × preço)
            </Text>
          ) : null}
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Combustível
            </FormControlLabelText>
          </FormControlLabel>
          <HStack style={{ gap: 8, flexWrap: 'wrap' }}>
            {COMBUSTIVEIS.map((c) => {
              const ativo = combustivel === c.valor;
              return (
                <Pressable
                  key={c.valor}
                  onPress={() => {
                    setCombustivel(c.valor);
                    setErro(null);
                  }}
                  style={{
                    backgroundColor: ativo ? '#0066FF' : '#FFFFFF',
                    borderColor: ativo ? '#0066FF' : '#CBD5E1',
                    borderWidth: 1,
                    borderRadius: 9999,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    size="sm"
                    style={{ color: ativo ? '#FFFFFF' : '#334155', fontWeight: '600' }}
                  >
                    {c.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Odômetro (km) — opcional
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              keyboardType="numeric"
              value={odometro}
              onChangeText={(v) => {
                setOdometro(v);
                setErro(null);
              }}
              placeholder="Ex.: 152340"
            />
          </Input>
        </FormControl>

        <FormControl isInvalid={!!erro}>
          <FormControlLabel>
            <FormControlLabelText size="sm" style={{ color: '#334155' }}>
              Observações — opcional
            </FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" style={{ backgroundColor: '#FFFFFF' }}>
            <InputField
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Ex.: Posto BR, BR-153 km 12"
            />
          </Input>
          {erro && (
            <FormControlError>
              <FormControlErrorText>{erro}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        <Button
          onPress={handleSalvar}
          isDisabled={mutacao.isPending}
          style={{ backgroundColor: '#0066FF', borderRadius: 8 }}
        >
          {mutacao.isPending ? (
            <ButtonSpinner color="#FFFFFF" />
          ) : (
            <ButtonText style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Salvar abastecimento
            </ButtonText>
          )}
        </Button>
      </VStack>
    </ScrollView>
  );
}
