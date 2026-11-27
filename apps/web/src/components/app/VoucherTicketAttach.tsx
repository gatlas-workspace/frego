"use client";

import { useState } from "react";
import { VoucherTicket, type VoucherTicketProps } from "./VoucherTicket";

export type VoucherTicketAttachProps = Omit<VoucherTicketProps, "mode" | "attached" | "onToggle"> & {
  /** Trạng thái ban đầu. */
  defaultAttached?: boolean;
  /** Báo ra ngoài sau mỗi lần bấm. */
  onAttachedChange?: (attached: boolean) => void;
};

/** Vé voucher chế độ "attach" tự giữ trạng thái Gắn / Đã gắn (client component nhỏ). */
export function VoucherTicketAttach({ defaultAttached = false, onAttachedChange, ...props }: VoucherTicketAttachProps) {
  const [attached, setAttached] = useState(defaultAttached);
  return (
    <VoucherTicket
      {...props}
      mode="attach"
      attached={attached}
      onToggle={() => {
        const next = !attached;
        setAttached(next);
        onAttachedChange?.(next);
      }}
    />
  );
}
