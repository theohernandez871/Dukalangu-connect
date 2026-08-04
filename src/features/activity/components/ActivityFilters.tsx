import { Select } from '@/components/ui/Select';

const ACTION_OPTIONS = [
  { value: '', label: 'Vitendo vyote' },
  { value: 'user.signup', label: 'Usajili' },
  { value: 'employee.joined', label: 'Kujiunga kwa mfanyakazi' },
  { value: 'branch.create', label: 'Kuunda tawi' },
  { value: 'branch.update', label: 'Kuhariri tawi' },
  { value: 'branch.delete', label: 'Kufuta tawi' },
];

interface ActivityFiltersProps {
  value: string;
  onChange: (value: string) => void;
}

export function ActivityFilters({ value, onChange }: ActivityFiltersProps) {
  return (
    <div className="max-w-xs">
      <Select options={ACTION_OPTIONS} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
