// @vitest-environment happy-dom
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';

const { uploadImageToCloudflare } = vi.hoisted(() => ({ uploadImageToCloudflare: vi.fn() }));
vi.mock('@/app/lib/cloudflare/uploadImage', () => ({ uploadImageToCloudflare }));
import ArticleCoverImageField from './ArticleCoverImageField';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLDivElement;

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  container?.remove();
  uploadImageToCloudflare.mockReset();
});

it('previews a selected cover without uploading until the author confirms', async () => {
  const selectedFile = new File(['image bytes'], 'cover.jpg', { type: 'image/jpeg' });
  const createObjectURL = vi.fn(() => 'blob:cover-preview');
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
  uploadImageToCloudflare.mockResolvedValue({ originalUrl: '/media/original/cover.jpg' });

  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const onImageChange = vi.fn();
  const onAltChange = vi.fn();
  function CoverImageHarness() {
    const [imageUrl, setImageUrl] = useState<string>();
    return createElement(ArticleCoverImageField, {
      imageUrl,
      onImageChange: (url) => { onImageChange(url); setImageUrl(url); },
      onAltChange,
    });
  }
  await act(async () => {
    root.render(createElement(CoverImageHarness));
  });

  const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(fileInput, 'files', { configurable: true, value: [selectedFile] });
  await act(async () => { fileInput.dispatchEvent(new Event('change', { bubbles: true })); });

  expect(uploadImageToCloudflare).not.toHaveBeenCalled();
  expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:cover-preview');
  expect(container.textContent).toContain('ภาพที่เลือกยังไม่ถูกอัปโหลด');

  const uploadButton = container.querySelector<HTMLButtonElement>('button[aria-label="อัปโหลดภาพปก"]');
  expect(uploadButton).toBeTruthy();
  expect(uploadButton?.className).toContain('article-cover-upload-button');
  await act(async () => { uploadButton?.click(); });

  expect(uploadImageToCloudflare).toHaveBeenCalledWith(selectedFile, { watermarkText: null });
  expect(onImageChange).toHaveBeenCalledWith('/media/original/cover.jpg');
  expect(container.querySelector('img')?.getAttribute('src')).toBe('/media/original/cover.jpg');
  expect(container.textContent).not.toContain('ภาพที่เลือกยังไม่ถูกอัปโหลด');
  expect(container.querySelector('button[aria-label="เปลี่ยนภาพปก"]')?.textContent).toBe('');
  expect(container.querySelector('button[aria-label="นำภาพปกออก"]')?.textContent).toBe('');
});

it('keeps the selected cover available for retry and shows the upload reference after failure', async () => {
  uploadImageToCloudflare.mockRejectedValue(new Error('อัปโหลดภาพขนาดย่อไม่สำเร็จ (HTTP 503 · รหัส 123e4567-e89b-12d3-a456-426614174000)'));
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(ArticleCoverImageField, { onImageChange: vi.fn(), onAltChange: vi.fn() })); });

  const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(fileInput, 'files', { configurable: true, value: [new File(['image bytes'], 'cover.jpg', { type: 'image/jpeg' })] });
  await act(async () => { fileInput.dispatchEvent(new Event('change', { bubbles: true })); });

  expect(container.querySelector('button[aria-label="เลือกภาพอื่น"]')?.textContent).toBe('');
  expect(container.querySelector('button[aria-label="ยกเลิกการเลือกภาพ"]')?.textContent).toBe('');
  await act(async () => { container.querySelector<HTMLButtonElement>('button[aria-label="อัปโหลดภาพปก"]')?.click(); });

  expect(container.querySelector('[role="alert"]')?.textContent).toContain('HTTP 503');
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('123e4567-e89b-12d3-a456-426614174000');
  expect(container.querySelector('button[aria-label="อัปโหลดภาพปก"]')).toBeTruthy();
  expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:cover-preview');
});
