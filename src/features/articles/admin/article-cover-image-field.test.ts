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

  const uploadButton = [...container.querySelectorAll('button')].find((button) => button.textContent === 'อัปโหลดภาพปก');
  expect(uploadButton).toBeTruthy();
  await act(async () => { uploadButton?.click(); });

  expect(uploadImageToCloudflare).toHaveBeenCalledWith(selectedFile, { watermarkText: null });
  expect(onImageChange).toHaveBeenCalledWith('/media/original/cover.jpg');
  expect(container.querySelector('img')?.getAttribute('src')).toBe('/media/original/cover.jpg');
  expect(container.textContent).not.toContain('ภาพที่เลือกยังไม่ถูกอัปโหลด');
});
