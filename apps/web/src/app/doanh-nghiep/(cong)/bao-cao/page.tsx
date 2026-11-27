// DN 4 · Báo cáo chuyến đến (thiết kế WebDnBaoCao.dc.html). Chỉ số liệu tổng hợp (bảng stats), không có người nhận mã.
import type { Metadata } from 'next';
import {
  BarChart,
  Callout,
  Columns,
  Hint,
  Meter,
  PageBody,
  PageHeader,
  Panel,
  StatCard,
  StatGroup,
  Topbar,
  WebIcon,
  buttonClass,
} from '@/components/web';
import { bizService } from '@/lib/server/data';

export const metadata: Metadata = { title: 'Báo cáo chuyến đến', robots: { index: false, follow: false } };

export default async function Page() {
  const { session, svc } = await bizService();
  const v = await svc.getReport();
  const bizName = session.businessName ?? 'Cửa hàng';
  return (
    <>
      <Topbar crumbs={`${bizName} / Báo cáo`} />
      <PageBody>
        <PageHeader
          title="Báo cáo chuyến đến"
          description={v.description}
          actions={
            <a href="/doanh-nghiep/bao-cao/tai-csv" download className={buttonClass({ variant: 'secondary' })}>
              <WebIcon name="downloadWeb" size={16} strokeWidth={2} />
              Tải file CSV
            </a>
          }
        />
        <StatGroup label="Số liệu tháng này">
          {v.stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
          ))}
        </StatGroup>
        <Columns template="minmax(0,2fr) minmax(0,1fr)" align="stretch">
          <Panel title="Theo giờ trong ngày" id="bc-gio" description={v.hours.peakText}>
            {v.hours.bars.length ? (
              <>
                {/* Màn hẹp: nhãn giờ thưa hơn (7h, 10h, 13h…) để không chồng lên nhau. */}
                <BarChart
                  bars={v.hours.bars}
                  height={140}
                  summary={v.hours.summary}
                  labelHeader="Giờ"
                  valueHeader="Chuyến"
                  className="@max-[520px]:hidden"
                />
                <BarChart
                  bars={v.hours.bars.map((b, i) => ({ ...b, label: i % 3 === 0 ? b.label : '' }))}
                  height={140}
                  summary={v.hours.summary}
                  labelHeader="Giờ"
                  valueHeader="Chuyến"
                  className="@min-[520px]:hidden"
                />
              </>
            ) : (
              <Hint className="mt-0!">Chưa có chuyến nào trong tháng.</Hint>
            )}
          </Panel>
          <Panel title="Theo hãng và loại xe" id="bc-hang" gap={14}>
            {v.services.length ? (
              v.services.map((m) => (
                <Meter key={m.key} logo={m.providerId} label={m.label} value={m.valueText} percent={m.percent} tone={m.tone} />
              ))
            ) : (
              <Hint className="mt-0!">Chưa có chuyến nào trong tháng.</Hint>
            )}
            {v.servicesNote ? <Callout tone="grey" text={v.servicesNote} /> : null}
          </Panel>
        </Columns>
        <Columns template="minmax(0,1.4fr) minmax(0,1fr)" align="stretch">
          <Panel title="Khách đi từ đâu" id="bc-khu-vuc" description="Gộp theo quận nơi đón khách, không có địa chỉ cụ thể" gap={14}>
            {v.districts.length ? (
              <div className="grid grid-cols-1 gap-x-7 gap-y-3.5 @min-[560px]:grid-cols-2">
                {v.districts.map((m) => (
                  <Meter key={m.key} label={m.label} value={m.valueText} percent={m.percent} tone="blue" />
                ))}
              </div>
            ) : (
              <Hint className="mt-0!">Chưa có số liệu.</Hint>
            )}
          </Panel>
          <Panel title="Theo ngày trong tuần" id="bc-tuan">
            {v.weekdays.bars.length ? (
              <BarChart bars={v.weekdays.bars} height={130} summary={v.weekdays.summary} labelHeader="Thứ" valueHeader="Chuyến" />
            ) : (
              <Hint className="mt-0!">Chưa có số liệu.</Hint>
            )}
          </Panel>
        </Columns>
      </PageBody>
    </>
  );
}
