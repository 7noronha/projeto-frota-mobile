import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type LarguraSkeleton = number | 'auto' | `${number}%`;

interface SkeletonProps {
  width?: LarguraSkeleton;
  height?: number;
  borderRadius?: number;
}

/**
 * Skeleton com animação suave de opacidade (pulse) para indicar
 * carregamento. Sem dependencia adicional — Animated nativo.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
}: SkeletonProps): React.ReactElement {
  const opacidade = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacidade, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacidade]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#E2E8F0',
        opacity: opacidade,
      }}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    />
  );
}
