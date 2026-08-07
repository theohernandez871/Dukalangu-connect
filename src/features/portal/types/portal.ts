export interface PortalSettings {
  company_id: string;
  slug: string | null;
  brand_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  welcome_title: string | null;
  welcome_message: string | null;
  support_phone: string | null;
  is_enabled: boolean;
}

export interface PortalAd {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
}

export interface PortalOffer {
  id: string;
  package_id: string | null;
  title: string;
  description: string | null;
  promo_price: number | null;
  badge: string | null;
  sort_order: number;
}

export interface PortalAnnouncement {
  id: string;
  title: string;
  body: string | null;
  level: 'info' | 'warning' | 'success';
  created_at: string;
}

export interface PortalData {
  settings: PortalSettings;
  ads: PortalAd[];
  offers: PortalOffer[];
  announcements: PortalAnnouncement[];
}

export interface PortalPackage {
  id: string;
  name: string;
  price: number;
  duration_value: number | null;
  duration_unit: string | null;
  data_limit_mb: number | null;
  speed_down_kbps: number | null;
  speed_up_kbps: number | null;
  description: string | null;
}

export interface RedeemResult {
  ok: boolean;
  error?: string;
  code?: string;
  package?: string | null;
  activated?: boolean;
}
