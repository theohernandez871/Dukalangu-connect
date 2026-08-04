import { SignalSlashIcon } from '@heroicons/react/24/outline';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';

export function PendingAgentState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={SignalSlashIcon}
      title="Inasubiri agent"
      description="Amri imetumwa lakini agent bado haijaitekeleza. Hakikisha agent imeunganishwa."
      action={
        onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Jaribu tena
          </Button>
        ) : undefined
      }
    />
  );
}
