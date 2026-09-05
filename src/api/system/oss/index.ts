import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { OssQuery, OssUploadVO, OssVO } from './types';

// 查询OSS对象存储列表
export function listOss(query: OssQuery): AxiosPromise<PageResult<OssVO>> {
  return request({
    url: '/resource/oss/list',
    method: 'get',
    params: query
  });
}

// 查询OSS对象基于id串
export function listByIds(ossId: string | number): AxiosPromise<OssVO[]> {
  return request({
    url: '/resource/oss/listByIds/' + ossId,
    method: 'get'
  });
}

// 上传OSS对象存储
export function uploadOss(data: FormData): AxiosPromise<OssUploadVO> {
  return request({
    url: '/resource/oss/upload',
    method: 'post',
    data
  });
}

// 通过登录态预览OSS对象，避免浏览器直接访问私有或未正确配置公开策略的存储地址
export function previewOss(ossId: string | number): Promise<Blob> {
  return request({
    url: '/resource/oss/preview/' + ossId,
    method: 'get',
    responseType: 'blob',
    headers: {
      repeatSubmit: false
    }
  }) as Promise<Blob>;
}

// 删除OSS对象存储
export function delOss(ossId: string | number | Array<string | number>) {
  return request({
    url: '/resource/oss/' + ossId,
    method: 'delete'
  });
}
