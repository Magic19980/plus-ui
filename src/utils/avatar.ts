import { previewOss } from '@/api/system/oss';

const avatarUrlCache = new Map<string, string>();
const avatarRequestCache = new Map<string, Promise<string>>();

function normalizeOssId(value?: string | number) {
  const normalized = String(value ?? '').trim();
  return /^\d+$/.test(normalized) && normalized !== '0' ? normalized : '';
}

/** 通过登录态加载头像，避免直接拼接私有 OSS 地址导致 401。 */
export function loadAvatarUrl(value?: string | number): Promise<string> {
  const ossId = normalizeOssId(value);
  if (!ossId) return Promise.resolve('');

  const cachedUrl = avatarUrlCache.get(ossId);
  if (cachedUrl) return Promise.resolve(cachedUrl);

  const pendingRequest = avatarRequestCache.get(ossId);
  if (pendingRequest) return pendingRequest;

  const request = previewOss(ossId)
    .then(blob => {
      if (!(blob instanceof Blob) || blob.size === 0) throw new Error('头像预览内容为空');
      const url = URL.createObjectURL(blob);
      avatarUrlCache.set(ossId, url);
      return url;
    })
    .catch(error => {
      console.warn(`头像 ${ossId} 预览失败`, error);
      return '';
    })
    .finally(() => avatarRequestCache.delete(ossId));

  avatarRequestCache.set(ossId, request);
  return request;
}
