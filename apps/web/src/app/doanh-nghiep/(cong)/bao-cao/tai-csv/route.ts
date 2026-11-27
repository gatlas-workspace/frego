// "Tải file CSV" ở Báo cáo chuyến đến: chỉ số liệu tổng hợp của doanh nghiệp đang đăng nhập.
import { bizService } from '@/lib/server/data';

export async function GET() {
  const { svc } = await bizService();
  const { fileName, csv } = await svc.getReportCsv();
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
