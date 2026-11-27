'use client';

import { Button } from '@/components/web';

/** In hoặc lưu PDF bằng hộp thoại in của trình duyệt (chọn "Lưu dưới dạng PDF"). */
export function PrintButton() {
  return (
    <Button type="button" icon="download" onClick={() => window.print()}>
      In hoặc lưu PDF
    </Button>
  );
}
