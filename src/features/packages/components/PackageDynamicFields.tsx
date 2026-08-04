import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DURATION_UNITS } from '../types/package';
import { DURATION_UNIT_LABELS, PACKAGE_TYPE_META } from '../constants/packageMeta';
import type { PackageFormInput } from '../schemas/package.schema';
import type { PackageType } from '../types/package';

interface Props {
  type: PackageType;
  register: UseFormRegister<PackageFormInput>;
  errors: FieldErrors<PackageFormInput>;
}

const unitOptions = DURATION_UNITS.map((u) => ({ value: u, label: DURATION_UNIT_LABELS[u] }));

/** Renders only the fields relevant to the selected package type. */
export function PackageDynamicFields({ type, register, errors }: Props) {
  const f = PACKAGE_TYPE_META[type].fields;

  return (
    <>
      {f.duration && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Muda"
            type="number"
            placeholder="3"
            error={errors.durationValue?.message}
            {...register('durationValue', { valueAsNumber: true })}
          />
          <Select label="Kipimo" options={unitOptions} placeholder="Chagua" error={errors.durationUnit?.message} {...register('durationUnit')} />
        </div>
      )}

      {f.data && (
        <Input
          label="Kikomo cha data (MB)"
          type="number"
          placeholder="500 (acha wazi = bila kikomo)"
          error={errors.dataLimitMb?.message}
          {...register('dataLimitMb', { valueAsNumber: true })}
        />
      )}

      {f.speed && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Download (kbps)"
            type="number"
            placeholder="5000"
            error={errors.speedDownKbps?.message}
            {...register('speedDownKbps', { valueAsNumber: true })}
          />
          <Input
            label="Upload (kbps)"
            type="number"
            placeholder="2000"
            error={errors.speedUpKbps?.message}
            {...register('speedUpKbps', { valueAsNumber: true })}
          />
        </div>
      )}
    </>
  );
}
