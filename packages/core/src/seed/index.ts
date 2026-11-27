import type { BaseTableName, Seed } from '../db/schema';
import * as base from './base';
import { businessSeed } from './web-business';
import { adminSeed } from './web-admin';
import { adminOpsSeed } from './web-admin-ops';
import { baseStats } from './stats';
import { businessStats } from './stats-business';
import { adminStats } from './stats-admin';
import { adminOpsStats } from './stats-admin-ops';

export * from './base';
export { series, novDays } from './stats';

const empty = (): Seed => ({
  places: [],
  fare_tables: [],
  profiles: [],
  consents: [],
  notification_prefs: [],
  saved_places: [],
  recent_searches: [],
  partners: [],
  linked_accounts: [],
  businesses: [],
  business_members: [],
  campaigns: [],
  campaign_events: [],
  frego_codes: [],
  rewards: [],
  user_vouchers: [],
  public_codes: [],
  code_votes: [],
  trips: [],
  points_ledger: [],
  notifications: [],
  wallet_transactions: [],
  invoices: [],
  redemptions: [],
  support_tickets: [],
  audit_logs: [],
  broadcasts: [],
  stats: [],
});

/** Seed đầy đủ (bản sao mới mỗi lần gọi). */
export function createSeed(): Seed {
  const s = empty();
  const add = (part: Partial<Seed>) => {
    for (const [k, rows] of Object.entries(part) as [BaseTableName, unknown[]][]) {
      if (rows) (s[k] as unknown[]).push(...rows);
    }
  };
  add({
    places: base.places,
    fare_tables: base.fareTables,
    profiles: base.profiles,
    consents: base.consents,
    notification_prefs: base.notificationPrefs,
    saved_places: base.savedPlaces,
    recent_searches: base.recentSearches,
    partners: base.partners,
    linked_accounts: base.linkedAccounts,
    businesses: base.businesses,
    business_members: base.businessMembers,
    campaigns: base.campaigns,
    campaign_events: base.campaignEvents,
    frego_codes: base.fregoCodes,
    rewards: base.rewards,
    user_vouchers: base.userVouchers,
    public_codes: base.publicCodes,
    trips: base.trips,
    points_ledger: base.pointsLedger,
    notifications: base.notifications,
  });
  add(businessSeed);
  add(adminSeed);
  add(adminOpsSeed);
  add({ stats: [...baseStats, ...businessStats, ...adminStats, ...adminOpsStats] });
  return JSON.parse(JSON.stringify(s));
}
