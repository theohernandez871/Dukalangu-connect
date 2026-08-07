import { voucherRepository } from './voucher.repository';
import { commandService } from '@/features/routers/services/agent.service';
import type { Voucher, VoucherBatch, VoucherStatus, GenerateVouchersInput } from '../types/voucher';

export interface GenerateResult {
  batchId: string;
  pushedToRouter: boolean;
  enqueued: number;
}

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
  async generate(input: GenerateVouchersInput): Promise<GenerateResult> {
    const { data, error } = await voucherRepository.generate(input);
    if (error) throw error;
    const batchId = data as string;

    // If no router selected, we're done (DB-only vouchers).
    if (!input.routerId) {
      return { batchId, pushedToRouter: false, enqueued: 0 };
    }

    // Verify an active agent can serve this router — otherwise the commands
    // would sit in the queue forever and the user would never see them appear.
    const agents = await commandService.countActiveAgents(input.routerId).catch(() => 0);
    if (agents === 0) {
      throw new Error(
        'Vocha zimehifadhiwa, LAKINI hakuna agent inayoendesha kwa router hii. ' +
          'Endesha agent kwenye kifaa cha LAN, kisha "Peleka MikroTik" tena kutoka kwa batch.',
      );
    }

    // Push each code to the router as a hotspot user via the command queue.
    const enqueued = await voucherService.pushBatchToRouter(
      batchId,
      input.routerId,
      input.routerProfile ?? 'default',
    );
    return { batchId, pushedToRouter: true, enqueued };
  },

  /** How many active agents can serve this router (0 = none running). */
  async countAgents(routerId: string): Promise<number> {
    return commandService.countActiveAgents(routerId).catch(() => 0);
  },

  /** Enqueue a create-user command per voucher code. Returns count enqueued. */
  async pushBatchToRouter(batchId: string, routerId: string, profile: string): Promise<number> {
    const { data, error } = await voucherRepository.listVouchersByBatch(batchId);
    if (error) throw error;
    const codes = (data ?? []) as { code: string }[];
    if (codes.length === 0) {
      throw new Error('Hakuna codes za kupeleka (batch tupu au RLS imezuia kusoma).');
    }
    let count = 0;
    for (const { code } of codes) {
      await commandService.enqueueWithParams(routerId, 'hotspot.create_voucher', {
        code,
        profile,
        comment: `voucher:${batchId.slice(0, 8)}`,
      });
      count += 1;
    }
    return count;
  },

  /**
   * Quick Sell: create exactly ONE voucher for a package, push it to the router
   * as a hotspot user, and return the created voucher for immediate display /
   * printing. Reuses generate() + pushBatchToRouter() — no new write path.
   */
  async quickSell(input: GenerateVouchersInput): Promise<Voucher> {
    const result = await voucherService.generate({ ...input, count: 1 });
    const { data, error } = await voucherRepository.fullVouchersByBatch(result.batchId);
    if (error) throw error;
    const row = (data ?? [])[0] as VoucherRow | undefined;
    if (!row) throw new Error('Voucher haikuundwa. Jaribu tena.');
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
    if (error) throw error;  },

  async removeBatch(id: string): Promise<void> {
    const { error } = await voucherRepository.removeBatch(id);
    if (error) throw error;
  },
};
