// Hóa đơn tháng dạng trang in được (thay nút "Tải PDF" chưa chạy): trình duyệt in hoặc lưu thành PDF.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Button, FregoLogo } from '@/components/web';
import { bizService } from '@/lib/server/data';
import { PrintButton } from './PrintButton';

export const metadata: Metadata = { title: 'Hóa đơn', robots: { index: false, follow: false } };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { svc } = await bizService();
  const inv = await svc.getInvoice(decodeURIComponent(id));
  if (!inv) notFound();
  return (
    <main id="noi-dung" className="mx-auto flex min-h-screen max-w-[760px] flex-col gap-5 bg-white px-6 py-8 text-ink print:px-0 print:py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" icon="back" href="/doanh-nghiep/vi#vi-hd">
          Về Ví và hóa đơn
        </Button>
        <PrintButton />
      </div>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div className="flex flex-col gap-1">
          <FregoLogo text="Frego" href={null} />
          <p className="m-0 text-[13px] leading-normal text-ink-2">
            {inv.seller.name}
            <br />
            {inv.seller.email} · {inv.seller.hotline}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <h1 className="m-0 text-[22px] font-bold">{inv.title}</h1>
          <span className="text-[13px] text-ink-2">
            {inv.statusText}
            {inv.issuedText ? ` · ngày ${inv.issuedText}` : ''}
          </span>
        </div>
      </header>
      <section aria-label="Bên mua" className="flex flex-col gap-1 text-[14px] leading-normal">
        <h2 className="m-0 text-[13px] font-semibold uppercase tracking-wide text-ink-2">Bên mua</h2>
        <span className="font-semibold">{inv.buyer.name}</span>
        {inv.buyer.taxCode ? <span>Mã số thuế: {inv.buyer.taxCode}</span> : null}
        {inv.buyer.address ? <span>Địa chỉ: {inv.buyer.address}</span> : null}
        {inv.buyer.email ? <span>Email nhận hóa đơn: {inv.buyer.email}</span> : null}
      </section>
      <dl className="m-0 grid grid-cols-[160px_minmax(0,1fr)] gap-x-4 gap-y-2 border-y border-line py-4 text-[14px] max-[480px]:grid-cols-1">
        {inv.lines.map((l) => (
          <div key={l.label} className="contents">
            <dt className="text-ink-2">{l.label}</dt>
            <dd className="m-0">{l.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-baseline justify-between gap-4 text-[16px]">
        <span className="font-semibold">Tổng tiền</span>
        <span className="text-[22px] font-bold tabular-nums">{inv.totalText}</span>
      </div>
      {!inv.issued ? (
        <p className="m-0 text-[13px] text-ink-2">Số tạm tính, có thể đổi tới khi hóa đơn được xuất đầu tháng sau.</p>
      ) : (
        <p className="m-0 text-[13px] text-ink-2">Bản điện tử có chữ ký số được gửi tới email nhận hóa đơn.</p>
      )}
    </main>
  );
}
