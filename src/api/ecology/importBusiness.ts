import type { AxiosPromise } from '@/utils/api-types';
import type { PageResult } from '@/api/types';
import request from '@/utils/request';
import type {
  OaImportBatchQuery,
  OaImportBatchVO,
  OaImportBusinessConfigForm,
  OaImportBusinessConfigVO,
  OaImportAttachmentPreviewForm,
  OaImportApprovalPreviewVO,
  OaImportDeptMappingForm,
  OaImportSubmitForm
} from './importBusinessTypes';
import type { OaImportAttachmentTemplateVO, OaImportTemplatePreviewVO } from './importBusinessTypes';
import type { OaAttachmentPreviewVO } from './types';

export const listOaImportBusinessConfigs = (businessType?: string, enabledOnly = false): AxiosPromise<OaImportBusinessConfigVO[]> =>
  request({ url: '/ecology/import-config/list', method: 'get', params: { businessType, enabledOnly } });

export const listAvailableOaImportBusinessConfigs = (): AxiosPromise<OaImportBusinessConfigVO[]> =>
  request({ url: '/ecology/import-business/configs', method: 'get' });

export const getOaImportBusinessConfig = (id: string | number): AxiosPromise<OaImportBusinessConfigVO> =>
  request({ url: `/ecology/import-config/${id}`, method: 'get' });

export const parseOaImportTemplate = (data: FormData): AxiosPromise<OaImportTemplatePreviewVO> =>
  request({ url: '/ecology/import-config/parse-template', method: 'post', data, headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60 * 1000 });

export const uploadOaImportAttachmentTemplate = (data: FormData): AxiosPromise<OaImportAttachmentTemplateVO> =>
  request({ url: '/ecology/import-config/attachment-template', method: 'post', data, headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60 * 1000 });

export const downloadOaImportBusinessTemplate = (id: string | number) => `/ecology/import-config/${id}/template`;

export const saveOaImportBusinessConfig = (data: OaImportBusinessConfigForm) =>
  request({ url: '/ecology/import-config', method: data.id ? 'put' : 'post', data });

export const delOaImportBusinessConfig = (id: string | number) =>
  request({ url: `/ecology/import-config/${id}`, method: 'delete' });

export const listOaImportBatches = (query: OaImportBatchQuery): AxiosPromise<PageResult<OaImportBatchVO>> =>
  request({ url: '/ecology/import-business/list', method: 'get', params: query });

export const getOaImportBatch = (id: string | number): AxiosPromise<OaImportBatchVO> =>
  request({ url: `/ecology/import-business/${id}`, method: 'get' });

export const delOaImportBatch = (id: string | number) =>
  request({ url: `/ecology/import-business/${id}`, method: 'delete' });

export const importOaBusinessData = (configId: string | number, data: FormData): AxiosPromise<OaImportBatchVO> =>
  request({ url: `/ecology/import-business/${configId}/import`, method: 'post', data, headers: { 'Content-Type': 'multipart/form-data' }, timeout: 10 * 60 * 1000 });

export const mapOaImportDepartments = (id: string | number, data: OaImportDeptMappingForm): AxiosPromise<OaImportBatchVO> =>
  request({ url: `/ecology/import-business/${id}/department-mapping`, method: 'post', data });

export const previewOaImportApprovals = (id: string | number): AxiosPromise<OaImportApprovalPreviewVO[]> =>
  request({ url: `/ecology/import-business/${id}/approval-preview`, method: 'get' });

export const submitOaImportBatch = (id: string | number, data: OaImportSubmitForm): AxiosPromise<OaImportBatchVO> =>
  request({ url: `/ecology/import-business/${id}/submit`, method: 'post', data, timeout: 10 * 60 * 1000 });

export const previewOaImportAttachment = (id: string | number, data: OaImportAttachmentPreviewForm): AxiosPromise<OaAttachmentPreviewVO> =>
  request({ url: `/ecology/import-business/${id}/attachment-preview`, method: 'post', data, timeout: 10 * 60 * 1000 });

/** 下载当前分组的最终 Excel；提交前会按当前参数即时生成，不创建泛微申请。 */
export const downloadOaImportAttachment = (id: string | number, data: OaImportAttachmentPreviewForm): Promise<Blob> =>
  request({ url: `/ecology/import-business/${id}/attachment-download`, method: 'post', data, responseType: 'blob', timeout: 10 * 60 * 1000 });

/** 上传用户在本地修改后的当前分组附件。 */
export const uploadOaImportAttachment = (id: string | number, groupKey: string, file: File): AxiosPromise<OaImportBatchVO> => {
  const formData = new FormData();
  formData.append('groupKey', groupKey);
  formData.append('file', file);
  return request({
    url: `/ecology/import-business/${id}/attachment-upload`,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 10 * 60 * 1000
  });
};
