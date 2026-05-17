import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Divider } from '@/components/ui/divider';
import { Skeleton } from './Skeleton';

function SecaoSkeleton(): React.ReactElement {
  return (
    <Box
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
    >
      <Skeleton height={12} width={80} />
      <Box style={{ marginTop: 12 }}>
        <Skeleton height={14} width="60%" />
        <Box style={{ marginTop: 8 }}>
          <Skeleton height={14} width="80%" />
        </Box>
        <Box style={{ marginTop: 8 }}>
          <Skeleton height={14} width="70%" />
        </Box>
      </Box>
    </Box>
  );
}

export function DetalheViagemSkeleton(): React.ReactElement {
  return (
    <VStack style={{ gap: 12, paddingHorizontal: 16, paddingVertical: 16 }}>
      <HStack style={{ justifyContent: 'flex-end' }}>
        <Skeleton height={24} width={100} borderRadius={9999} />
      </HStack>

      <Box>
        <Skeleton height={28} width="90%" />
        <Box style={{ marginTop: 8 }}>
          <Skeleton height={14} width="60%" />
        </Box>
      </Box>

      <Divider />

      <SecaoSkeleton />
      <SecaoSkeleton />
    </VStack>
  );
}
