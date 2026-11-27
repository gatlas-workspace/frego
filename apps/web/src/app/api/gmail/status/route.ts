// GET /api/gmail/status → { available }: app hỏi xem máy chủ đã cấu hình Google chưa (chưa → "Sắp có").
import { gmailConfig, json, preflight } from '../_lib/gmail';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return json(req, { available: gmailConfig() !== null });
}

export function OPTIONS(req: Request) {
  return preflight(req);
}
