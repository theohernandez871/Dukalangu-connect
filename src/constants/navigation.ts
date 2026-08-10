import type { ComponentType } from 'react';
import {
  HomeIcon,
  BuildingOffice2Icon,
  ServerStackIcon,
  WifiIcon,
  TicketIcon,
  BoltIcon,
  CreditCardIcon,
  ChartBarIcon,
  BellAlertIcon,
  Cog6ToothIcon,
  UsersIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import type { Permission } from '@/types/rbac';
import { ROUTES } from './routes';

export interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  /** If set, item shows only when the user has this permission. */
  permission?: Permission;
  /** Phase that enables this route; used to mark "coming soon". */
  enabled: boolean;
  hidden?: boolean;
}

/**
 * Sidebar navigation. Items are permission-gated via RBAC.
 * `enabled: false` items render as disabled ("Inakuja") until their phase lands.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashibodi', to: ROUTES.dashboard, icon: HomeIcon, enabled: true },
  { label: 'Kampuni & Matawi', to: ROUTES.companies, icon: BuildingOffice2Icon, permission: 'company:view', enabled: true },
  { label: 'Wafanyakazi', to: ROUTES.employees, icon: UsersIcon, permission: 'employee:view', enabled: true },
  { label: 'Ruhusa', to: ROUTES.permissions, icon: ShieldCheckIcon, permission: 'employee:view', enabled: true },
  { label: 'Kumbukumbu', to: ROUTES.activity, icon: ClipboardDocumentListIcon, permission: 'audit:view', enabled: true },
  { label: 'Routers', to: ROUTES.routers, icon: ServerStackIcon, permission: 'router:view', enabled: true },
  { label: 'TP-Link', to: ROUTES.tplink, icon: WifiIcon, permission: 'router:view', enabled: true },
  { label: 'Hotspot', to: '/hotspot', icon: WifiIcon, permission: 'router:view', enabled: false, hidden: true },
  { label: 'Vifurushi', to: ROUTES.packages, icon: TicketIcon, permission: 'package:view', enabled: true },
  { label: 'Vocha', to: ROUTES.vouchers, icon: TicketIcon, permission: 'voucher:view', enabled: true },
  { label: 'Uza Haraka', to: ROUTES.quickSell, icon: BoltIcon, permission: 'voucher:manage', enabled: true },
  { label: 'Portal ya Wateja', to: ROUTES.portalAdmin, icon: GlobeAltIcon, permission: 'settings:manage', enabled: true },
  { label: 'Malipo', to: ROUTES.payments, icon: CreditCardIcon, permission: 'payment:view', enabled: true },
  { label: 'Ripoti', to: ROUTES.reports, icon: ChartBarIcon, permission: 'report:view', enabled: true },
  { label: 'Arifa', to: ROUTES.notifications, icon: BellAlertIcon, enabled: true },
  { label: 'Mipangilio', to: '/settings', icon: Cog6ToothIcon, permission: 'settings:manage', enabled: false, hidden: true },
];
