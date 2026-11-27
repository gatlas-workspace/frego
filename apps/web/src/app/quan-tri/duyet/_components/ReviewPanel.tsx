'use client';

import { useActionState, useState, type ReactNode } from 'react';
import type { ReviewKind } from '@frego/core';
import { Button, Callout, Columns, DetailHeader, Input, Panel, Status, SubHeading, type StatusTone } from '@/components/web';
import { reviewAction, type ReviewState } from '../actions';

export type ReviewPanelProps = {
  kind: ReviewKind;
  id: string;
  title: string;
  sub: string;
  leading: ReactNode;
  /** null = đang chờ duyệt. */
  decision: { text: string; tone: StatusTone } | null;
  /** Cột trái: "Người dùng sẽ thấy" + thông số, hoặc hồ sơ doanh nghiệp. */
  left: ReactNode;
  /** Các dòng <Check> (cột phải, dưới "Kiểm tra tự động"). */
  checks: ReactNode;
  /** Có câu hỏi → bấm Duyệt phải xác nhận lại (hồ sơ thiếu giấy phép / ảnh mặt tiền). */
  approveConfirm?: string | null;
};

/**
 * Khung chi tiết một mục chờ duyệt (WebQtDuyet): nút Từ chối / Duyệt ở đầu khung, ô lý do dưới phần kiểm tra.
 * Cả khung là một <form>; nút bấm gửi decision=approve|reject. Xong thì trang tải lại, đầu khung hiện nhãn kết quả.
 */
export function ReviewPanel({ kind, id, title, sub, leading, decision, left, checks, approveConfirm }: ReviewPanelProps) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewAction, null);
  const [asking, setAsking] = useState(false);
  const reasonId = `ly-do-${id}`;
  return (
    <Panel padding="xl" gap={16} label={title}>
      <form action={action} className="flex min-w-0 flex-col gap-4" aria-busy={pending || undefined}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <DetailHeader
          leading={leading}
          title={title}
          sub={sub}
          // Màn hẹp: tên chiếm cả dòng cạnh logo, nút Từ chối / Duyệt xuống dòng dưới.
          className="pb-3.5! max-[600px]:flex-wrap max-[600px]:[&>div:first-of-type]:basis-[calc(100%-52px)]"
          trailing={
            decision ? (
              <span role="status">
                <Status text={decision.text} tone={decision.tone} />
              </span>
            ) : (
              <>
                <Button variant="danger" type="submit" name="decision" value="reject" disabled={pending}>
                  Từ chối
                </Button>
                {approveConfirm ? (
                  <Button icon="check" type="button" disabled={pending || asking} onClick={() => setAsking(true)}>
                    Duyệt
                  </Button>
                ) : (
                  <Button icon="check" type="submit" name="decision" value="approve" disabled={pending}>
                    Duyệt
                  </Button>
                )}
              </>
            )
          }
        />
        {approveConfirm && asking && !decision ? (
          <div role="alertdialog" aria-label="Xác nhận duyệt" className="flex flex-col gap-2">
            <Callout tone="amber" text={approveConfirm} />
            <input type="hidden" name="confirmMissing" value="1" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={pending} onClick={() => setAsking(false)}>
                Xem lại hồ sơ
              </Button>
              <Button icon="check" type="submit" name="decision" value="approve" disabled={pending}>
                Vẫn duyệt
              </Button>
            </div>
          </div>
        ) : null}
        {state && !state.field ? <Callout tone="red" icon="x" role="alert" text={state.error} /> : null}
        <Columns template="minmax(0,1fr) minmax(0,1fr)" gap={32} stackBelow="sm">
          <div className="flex min-w-0 flex-col gap-3">{left}</div>
          <div className="flex min-w-0 flex-col gap-3">
            <SubHeading>Kiểm tra tự động</SubHeading>
            {checks}
            {decision ? null : (
              <div className="mt-1">
                <Input
                  label="Lý do gửi doanh nghiệp nếu từ chối"
                  id={reasonId}
                  name="reason"
                  placeholder="VD: Ảnh có số điện thoại"
                  maxLength={300}
                  error={state?.field === 'reason' ? state.error : undefined}
                />
              </div>
            )}
          </div>
        </Columns>
      </form>
    </Panel>
  );
}
