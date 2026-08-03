import { ServerStackIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/feedback/EmptyState';

export function RouterStatusWidget() {
  return (
    <Card>
      <CardHeader title="Hali ya Routers" subtitle="MikroTik / TP-Link" />
      <EmptyState
        icon={ServerStackIcon}
        title="Hakuna router bado"
        description="Unganisha router yako ya kwanza katika Phase 4."
      />
    </Card>
  );
}
