// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import AdminEmailAccessForm from './AdminEmailAccessForm';

let root: Root | undefined;
let container: HTMLDivElement;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(async () => { await act(async () => root?.unmount()); container?.remove(); });

async function renderForm(requestOtp: (email: string) => Promise<void>, verifyOtp: (email: string, otp: string) => Promise<void>) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(createElement(AdminEmailAccessForm, { requestOtp, verifyOtp })));
}

async function fill(id: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function submit() {
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

it('shows delivery failures without pretending a verification code was sent', async () => {
  await renderForm(async () => { throw new Error('ส่งอีเมลไม่สำเร็จ'); }, async () => {});
  await fill('admin-access-email', 'owner@example.invalid');
  await submit();
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('ส่งอีเมลไม่สำเร็จ');
  expect(container.querySelector('#admin-access-otp')).toBeNull();
  expect(container.querySelector('#admin-access-email')).not.toBeNull();
});

it('uses the requested email to verify a six-digit code and keeps errors actionable', async () => {
  const requestOtp = vi.fn(async () => {});
  const verifyOtp = vi.fn(async () => { throw new Error('รหัสไม่ถูกต้อง'); });
  await renderForm(requestOtp, verifyOtp);
  await fill('admin-access-email', 'Owner@Example.invalid');
  await submit();
  expect(requestOtp).toHaveBeenCalledWith('owner@example.invalid');
  expect(container.querySelector('[role="status"]')?.textContent).toContain('owner@example.invalid');
  const resend = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('ส่งรหัสใหม่ได้ใน'))!;
  expect(resend.disabled).toBe(true);
  await fill('admin-access-otp', '123456');
  await submit();
  expect(verifyOtp).toHaveBeenCalledWith('owner@example.invalid', '123456');
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('รหัสไม่ถูกต้อง');
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === 'เปลี่ยนอีเมล')!.click());
  expect(container.querySelector('#admin-access-email')).not.toBeNull();
  expect(container.querySelector('#admin-access-otp')).toBeNull();
});
