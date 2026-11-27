'use client';

import { useState, useTransition } from 'react';
import type { BizMemberView } from '@frego/core';
import { Avatar, Button, Input, List, ListRow, Panel, Segmented, Status } from '@/components/web';
import type { FormState } from '@/app/doanh-nghiep/_lib/form-state';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { inviteMemberAction, removeMemberAction } from '../actions';

/** Khung Thành viên: danh sách + "Mời" mở form email, vai trò (WebDnHoSo). */
export function MembersPanel({ members, canManage }: { members: BizMemberView[]; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('accountant');
  const { state, pending, onSubmit } = useFormSubmit(async (prev: FormState, fd: FormData) => {
    const next = await inviteMemberAction(prev, fd);
    if (next.status === 'ok') setOpen(false);
    return next;
  });
  const emailError = state.status === 'error' ? state.fieldErrors?.email ?? state.message : undefined;
  // Xóa thành viên: bấm "Xóa" → hỏi lại ngay trên dòng → xóa.
  const [asking, setAsking] = useState<string | null>(null);
  const [removeMsg, setRemoveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [removing, startRemove] = useTransition();
  const remove = (id: string) =>
    startRemove(async () => {
      const r = await removeMemberAction(id);
      setRemoveMsg({ ok: r.status === 'ok', text: r.message ?? '' });
      setAsking(null);
    });
  return (
    <Panel
      title="Thành viên"
      id="hs-tv"
      gap={8}
      action={
        canManage && !open ? (
          <Button variant="secondary" size="sm" icon="plus" onClick={() => setOpen(true)}>
            Mời
          </Button>
        ) : null
      }
    >
      <List label="Thành viên cửa hàng">
        {members.map((m) => (
          <ListRow
            key={m.id}
            padding={8}
            strong={false}
            leading={<Avatar initials={m.initials} />}
            title={m.email}
            sub={<span className="text-[12px]">{m.permissions}</span>}
            trailing={
              <span className="flex flex-wrap items-center justify-end gap-1.5">
                <Status text={m.roleLabel} tone="grey" shape="tag" />
                {canManage && !m.isMe ? (
                  asking === m.id ? (
                    <>
                      <Button variant="danger" size="sm" disabled={removing} onClick={() => remove(m.id)}>
                        Xóa {m.email}?
                      </Button>
                      <Button variant="ghost" size="sm" disabled={removing} onClick={() => setAsking(null)}>
                        Không
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" aria-label={`Xóa thành viên ${m.email}`} onClick={() => setAsking(m.id)}>
                      Xóa
                    </Button>
                  )
                ) : null}
              </span>
            }
          />
        ))}
      </List>
      {open ? (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2.5 pt-1">
          <Input
            label="Email người được mời"
            id="hs-moi-email"
            name="email"
            type="email"
            autoComplete="off"
            placeholder="VD: ketoan@cuahang.vn"
            autoFocus
            error={emailError}
          />
          <Segmented
            items={[
              { value: 'accountant', label: 'Kế toán: ví, hóa đơn' },
              { value: 'owner', label: 'Chủ cửa hàng' },
            ]}
            name="role"
            label="Vai trò"
            value={role}
            onChange={setRole}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={pending}>
              Gửi lời mời
            </Button>
          </div>
        </form>
      ) : null}
      {removeMsg ? (
        <p role={removeMsg.ok ? 'status' : 'alert'} className={`m-0 text-[13px] ${removeMsg.ok ? 'text-good-ink' : 'text-danger'}`}>
          {removeMsg.text}
        </p>
      ) : null}
      {state.status === 'ok' && !open ? (
        <p role="status" className="m-0 text-[13px] text-good-ink">
          {state.message} Người được mời đăng ký bằng email này để vào cổng.
        </p>
      ) : null}
    </Panel>
  );
}
