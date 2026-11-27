// DN 6 · Chi tiết chiến dịch (thiết kế WebDnChiTietChienDich.dc.html): tạm dừng / chạy tiếp, sửa ngân sách, lịch sử.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  BarChart,
  Button,
  Callout,
  Columns,
  Hint,
  KeyValue,
  KeyValueList,
  PageBody,
  PageHeader,
  Panel,
  StatCard,
  StatGroup,
  Status,
  Timeline,
  Topbar,
} from '@/components/web';
import { bizService } from '@/lib/server/data';
import { AdViewsRow } from '@/app/doanh-nghiep/_components/AdViewsRow';
import { BudgetEditor } from './_components/BudgetEditor';
import { PauseButton } from './_components/PauseButton';

export const metadata: Metadata = { title: 'Chi tiết chiến dịch', robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, svc } = await bizService();
  const v = await svc.getCampaignDetail(id);
  if (!v) notFound();
  const bizName = session.businessName ?? 'Cửa hàng';

  let actions: React.ReactNode = null;
  if (v.canPause || v.canResume) actions = <PauseButton id={v.id} running={v.canPause} />;
  else if (v.resubmitHref) actions = <Button href={v.resubmitHref}>Sửa và gửi lại</Button>;

  return (
    <>
      <Topbar crumbs={[{ label: bizName, href: '/doanh-nghiep' }, { label: 'Chiến dịch', href: '/doanh-nghiep/chien-dich' }, { label: v.name }]} />
      <PageBody>
        <PageHeader
          title={v.name}
          titleAddon={<Status text={v.statusLabel} tone={v.statusTone} />}
          description={v.subtitle}
          actions={actions}
        />
        {v.status === 'paused' ? (
          <div role="status">
            <Callout tone="grey" text="Đã tạm dừng. Mã đã tặng vẫn dùng được đến hết hạn, Frego không tặng thêm mã mới." />
          </div>
        ) : null}
        {v.status === 'pending' ? (
          <Callout
            tone="amber"
            icon="clock"
            text="Frego đang duyệt, thường trong 1 ngày làm việc. Chưa có mã nào được tặng và ví chưa bị trừ tiền."
          />
        ) : null}
        {v.status === 'rejected' ? (
          <Callout tone="red" icon="x" text={`Frego từ chối, lý do: ${v.rejectReason ?? 'Frego đã gửi lý do qua email.'} Sửa rồi gửi lại để Frego duyệt.`} />
        ) : null}
        {v.status === 'draft' ? <Callout tone="grey" text="Bản nháp, chưa gửi Frego duyệt." /> : null}
        {v.status === 'scheduled' ? (
          <Callout
            tone="blue"
            icon="clock"
            text={`${v.statusLabel}. Frego chưa tặng mã và ví chưa bị trừ tiền cho tới ngày bắt đầu.`}
          />
        ) : null}
        <StatGroup label="Số liệu chiến dịch">
          {v.stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
          ))}
        </StatGroup>
        <AdViewsRow stat={v.adViews} />
        <Columns template="minmax(0,1fr) 380px" stackBelow="lg">
          <div className="flex min-w-0 flex-col gap-5">
            <Panel title={v.chart.title} id="ct-ngay">
              {v.chart.bars.length ? (
                <BarChart bars={v.chart.bars} height={130} summary={v.chart.summary} labelHeader="Ngày" valueHeader="Mã được dùng" />
              ) : (
                <Hint className="mt-0!">Chưa có mã nào được dùng. Biểu đồ hiện khi chiến dịch bắt đầu chạy.</Hint>
              )}
            </Panel>
            <Panel title="Lịch sử" id="ct-ls" gap={6}>
              {v.history.length ? (
                <Timeline label="Lịch sử chiến dịch" items={v.history} />
              ) : (
                <Hint className="mt-0!">Chưa có thay đổi nào.</Hint>
              )}
            </Panel>
          </div>
          <Panel as="aside" title="Cài đặt" id="ct-cd" gap={10}>
            <KeyValueList>
              {v.settings.map((s) => (
                <KeyValue key={s.label} label={s.label}>
                  {s.value}
                </KeyValue>
              ))}
            </KeyValueList>
            {v.canEditBudget ? (
              <BudgetEditor id={v.id} budget={v.budget} budgetText={v.budgetText} />
            ) : (
              <div className="pt-1.5 text-[14px]">
                Ngân sách tối đa <b className="font-medium tabular-nums">{v.budgetText}</b>
              </div>
            )}
          </Panel>
        </Columns>
      </PageBody>
    </>
  );
}
