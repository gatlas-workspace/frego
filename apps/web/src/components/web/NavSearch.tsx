'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cx } from './cx';
import { WebIcon, type AnyIconName } from './WebIcon';

export type NavSearchItem = { label: string; href: string; group: string; icon: AnyIconName };

/** Bỏ dấu để tìm "tien" ra "Tiền và đối soát". */
function fold(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

/**
 * Hộp "Tìm kiếm" (Ctrl K) của thanh bên: gõ để lọc các trang trong menu, ↑/↓ để chọn, Enter để mở.
 * Chỉ tìm trong menu (chưa có tìm kiếm toàn văn).
 */
export function NavSearch({ items, onClose }: { items: NavSearchItem[]; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const titleId = useId();

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return items;
    return items.filter((it) => fold(`${it.label} ${it.group}`).includes(q));
  }, [items, query]);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    input.current?.focus();
    return () => prev?.focus?.();
  }, []);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-overlay px-4 pt-[12vh]">
      <button type="button" aria-label="Đóng tìm kiếm" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default border-0 bg-transparent" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[520px] overflow-hidden rounded-frame bg-white text-ink shadow-pop"
      >
        <h2 id={titleId} className="sr-only">
          Tìm trang
        </h2>
        <div className="flex h-12 items-center gap-2 border-b border-line px-3.5">
          <WebIcon name="search" size={18} className="text-nav-icon" />
          <input
            ref={input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[current] ? `${listId}-${current}` : undefined}
            aria-label="Tìm trang"
            placeholder="Tìm trang, vd. Chiến dịch, Ví…"
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && results[current]) {
                e.preventDefault();
                go(results[current].href);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
            className="web-field h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none focus-visible:outline-none"
          />
          <kbd className="rounded-tag bg-grey px-1.5 py-0.5 font-sans text-[11px] text-muted">Esc</kbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Kết quả" className="m-0 max-h-[50vh] list-none overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-2.5 py-3 text-[14px] text-ink-2">Không có trang nào khớp.</li>
          ) : (
            results.map((it, i) => (
              <li
                key={it.href}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === current}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(it.href)}
                className={cx(
                  'flex h-9 cursor-pointer items-center gap-2.5 rounded-frame px-2.5 text-[14px]',
                  i === current ? 'bg-hover' : '',
                )}
              >
                <WebIcon name={it.icon} size={18} className="text-nav-icon" />
                <span className="min-w-0 flex-1 truncate font-medium">{it.label}</span>
                <span className="text-[12px] text-ink-2">{it.group}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
