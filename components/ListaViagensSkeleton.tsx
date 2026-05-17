import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Skeleton } from './Skeleton';

function CartaoSkeleton(): React.ReactElement {
  return (
    <Box
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
    >
      <HStack
        style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}
      >
        <Box style={{ flex: 1, marginRight: 8 }}>
          <Skeleton height={18} width="80%" />
        </Box>
        <Skeleton height={24} width={90} borderRadius={9999} />
      </HStack>
      <HStack style={{ gap: 12, marginTop: 4 }}>
        <Skeleton height={14} width={80} />
        <Skeleton height={14} width={100} />
      </HStack>
    </Box>
  );
}

interface ListaViagensSkeletonProps {
  quantidade?: number;
}

export function ListaViagensSkeleton({
  quantidade = 4,
}: ListaViagensSkeletonProps): React.ReactElement {
  return (
    <VStack style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      {Array.from({ length: quantidade }).map((_, i) => (
        <CartaoSkeleton key={i} />
      ))}
    </VStack>
  );
}
