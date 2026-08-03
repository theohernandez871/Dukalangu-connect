import type { ComponentType } from 'react';
import {
  HomeIcon,
  BuildingOffice2Icon,
  ServerStackIcon,
  WifiIcon,
  TicketIcon,
  CreditCardIcon,
  ChartBarIcon,
  BellAlertIcon,
  Cog6ToothIcon,
  UsersIcon,
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
}

/**
 * Sidebar navigation. Items are permission-gated via RBAC.
 * `enabled: false` items render as disabled ("Inakuja") until their phase lands.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashibodi', to: ROUTES.dashboard, icon: HomeIcon, enabled: true },
  { label: 'Kampuni & Matawi', to: '/companies', icon: BuildingOffice2Icon, permission: 'company:view', enabled: false },
  { label: 'Wafanyakazi', to: '/employees', icon: UsersIcon, permission: 'employee:view', enabled: false },
  { label: 'Routers', to: '/routers', icon: ServerStackIcon, permission: 'router:view', enabled: false },
  { label: 'Hotspot', to: '/hotspot', icon: WifiIcon, permission: 'router:view', enabled: false },
  { label: 'Vifurushi', to: '/packages', icon: TicketIcon, permission: 'package:view', enabled: false },
  { label: 'Vocha', to: '/vouchers', icon: TicketIcon, permission: 'voucher:view', enabled: false },
  { label: 'Malipo', to: '/payments', icon: CreditCardIcon, permission: 'payment:view', enabled: false },
  { label: 'Ripoti', to: '/reports', icon: ChartBarIcon, permission: 'report:view', enabled: false },
  { label: 'Arifa', to: '/notifications', icon: BellAlertIcon, enabled: false },
  { label: 'Mipangilio', to: '/settings', icon: Cog6ToothIcon, permission: 'settings:manage', enabled: false },
];
