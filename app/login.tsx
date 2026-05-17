import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@/components/ui/form-control';
import { fetchApi } from '@/lib/api';
import { salvarToken } from '@/lib/auth';
import type { RespostaLogin } from '@/tipos';

export default function TelaLogin() {
  const router = useRouter();
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    if (!matricula || !senha) {
      setErro('Preencha a matrícula e a senha');
      return;
    }

    setErro(null);
    setCarregando(true);

    try {
      const dados = await fetchApi<RespostaLogin>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ matricula, senha }),
      });

      await salvarToken(dados.token);
      router.replace('/(motorista)');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Credenciais inválidas');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#0A2540',
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <VStack style={{ gap: 24 }}>
        {/* Logo */}
        <VStack style={{ gap: 4, marginBottom: 24 }}>
          <Heading size="3xl" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            FleetOps
          </Heading>
          <Text size="md" style={{ color: '#00C2FF' }}>
            Gestão de Frota Corporativa
          </Text>
        </VStack>

        {/* Formulário */}
        <VStack
          style={{
            gap: 16,
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: 24,
            borderRadius: 12,
          }}
        >
          <FormControl isInvalid={!!erro}>
            <FormControlLabel>
              <FormControlLabelText size="sm" style={{ color: '#FFFFFF' }}>
                Matrícula
              </FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              <InputField
                placeholderTextColor="rgba(255,255,255,0.4)"
                placeholder="0000000000"
                keyboardType="numeric"
                maxLength={10}
                value={matricula}
                onChangeText={setMatricula}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ color: '#FFFFFF' }}
              />
            </Input>
          </FormControl>

          <FormControl isInvalid={!!erro}>
            <FormControlLabel>
              <FormControlLabelText size="sm" style={{ color: '#FFFFFF' }}>
                Senha
              </FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              <InputField
                placeholderTextColor="rgba(255,255,255,0.4)"
                placeholder="••••••••"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                style={{ color: '#FFFFFF' }}
              />
            </Input>
            {erro && (
              <FormControlError>
                <FormControlErrorText style={{ color: '#F87171' }}>
                  {erro}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <Button
            onPress={handleLogin}
            isDisabled={carregando}
            style={{ backgroundColor: '#0066FF', borderRadius: 8, marginTop: 8 }}
          >
            {carregando ? (
              <ButtonSpinner color="#FFFFFF" />
            ) : (
              <ButtonText style={{ color: '#FFFFFF', fontWeight: '600' }}>Entrar</ButtonText>
            )}
          </Button>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
}
