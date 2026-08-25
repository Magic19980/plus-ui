import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { DepartmentDocumentForm, DepartmentDocumentQuery, DepartmentDocumentVersionVO, DepartmentDocumentVO } from './types';

export const listDepartmentDocument = (query: DepartmentDocumentQuery): AxiosPromise<PageResult<DepartmentDocumentVO>> =>
  request({ url: '/department/document/list', method: 'get', params: query });

export const listDepartmentDocumentRecycle = (query: DepartmentDocumentQuery): AxiosPromise<PageResult<DepartmentDocumentVO>> =>
  request({ url: '/department/document/recycle/list', method: 'get', params: query });

export const getDepartmentDocument = (id: string | number): AxiosPromise<DepartmentDocumentVO> =>
  request({ url: '/department/document/' + id, method: 'get' });

export const uploadDepartmentDocument = (data: FormData): AxiosPromise<DepartmentDocumentVO> =>
  request({ url: '/department/document/upload', method: 'post', data });

export const updateDepartmentDocument = (data: DepartmentDocumentForm) =>
  request({ url: '/department/document', method: 'put', data });

export const listDepartmentDocumentVersions = (documentId: string | number): AxiosPromise<DepartmentDocumentVersionVO[]> =>
  request({ url: '/department/document/versions/' + documentId, method: 'get' });

export const uploadDepartmentDocumentVersion = (documentId: string | number, data: FormData): AxiosPromise<DepartmentDocumentVersionVO> =>
  request({ url: '/department/document/version/' + documentId, method: 'post', data });

export const delDepartmentDocument = (ids: string | number | Array<string | number>) =>
  request({ url: '/department/document/' + ids, method: 'delete' });

export const restoreDepartmentDocument = (ids: string | number | Array<string | number>) =>
  request({ url: '/department/document/restore/' + ids, method: 'put' });

export const previewDepartmentDocument = (id: string | number): Promise<Blob> =>
  request({ url: '/department/document/preview/' + id, method: 'get', responseType: 'blob' });

export const downloadDepartmentDocument = (id: string | number): Promise<Blob> =>
  request({ url: '/department/document/download/' + id, method: 'get', responseType: 'blob' });
