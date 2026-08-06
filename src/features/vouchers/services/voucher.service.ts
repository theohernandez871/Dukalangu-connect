import { voucherRepository } from './voucher.repository';
import { commandService } from '@/features/routers/services/agent.service';
import type { Voucher, VoucherBatch, VoucherStatus, GenerateVouchersInput } from '../types/voucher';

interface BatchRow {
  id: string;
  company_id: string;
  branch_id: string | null;
  package_id: string | null;
  count: number;
  prefix: string | null;
  notes: string | null;
  created_at: string;
  package: { name: string } | { name: string }[] | null;
}

interface VoucherRow {
  id: string;
  batch_id: string | null;
  package_id: string | null;
  code: string;
  status: VoucherStatus;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  package: { name: string } | { name: string }[] | null;
}

function pkgName(p: { name: string } | { name: string }[] | null): string | null {
  const v = Array.isArray(p) ? p[0] : p;
  return v?.name ?? null;
}

export const voucherService = {
  async generate(input: GenerateVouchersInput): Promise<string> {
    const { data, error } = await voucherRepository.generate(input);
    if (error) throw error;
    const batchId = data as string;

    // Push each voucher to the router as a hotspot user, so it appears under
    // Hotspot -> Users on the MikroTik. The DB write above only records the
    // voucher; without this step it never reaches the router.
    if (input.routerId) {
      await voucherService.pushBatchToRouter(batchId, input.routerId, input.routerProfile ?? 'default');
    }
    return batchId;
  },

  /** Enqueue a create-user command per voucher code in a batch. */
  async pushBatchToRouter(batchId: string, routerId: string, profile: string): Promise<void> {
    const { data, error } = await voucherRepository.listVouchersByBatch(batchId);
    if (error) throw error;
    const codes = (data ?? []) as { code: string }[];
    // Sequential enqueue keeps ordering and avoids overwhelming the queue; the
    // agent executes them serially and auto-syncs after mutations.
    for (const { code } of codes) {
      await commandService.enqueueWithParams(routerId, 'hotspot.create_voucher', {
        code,
        profile,
        comment: `voucher:${batchId.slice(0, 8)}`,
      });
    }
  },

  async listBatches(companyId: string): Promise<VoucherBatch[]> {
    const { data, error } = await voucherRepository.listBatches(companyId);
    if (error) throw error;
    return (data ?? []).map((r) => {
      const row = r as BatchRow;
      return {
        id: row.id,
        companyId: row.company_id,
        branchId: row.branch_id,
        packageId: row.package_id,
        packageName: pkgName(row.package),
        count: row.count,
        prefix: row.prefix,
        notes: row.notes,
        createdAt: row.created_at,
      };
    });
  },

  async listVouchers(companyId: string, batchId?: string, status?: string): Promise<Voucher[]> {
    const { data, error } = await voucherRepository.listVouchers(companyId, batchId, status);
    if (error) throw error;
    return (data ?? []).map((r) => {
      const row = r as VoucherRow;
      return {
        id: row.id,
        batchId: row.batch_id,
        packageId: row.package_id,
        packageName: pkgName(row.package),
        code: row.code,
        status: row.status,
        usedAt: row.used_at,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      };
    });
  },

  async setStatus(id: string, status: VoucherStatus): Promise<void> {
    const { error } = await voucherRepository.setStatus(id, status);
    if (error) throw error;
  },

  async removeBatch(id: string): Promise<void> {
    const { error } = await voucherRepository.removeBatch(id);
    if (error) throw error;
  },
};
