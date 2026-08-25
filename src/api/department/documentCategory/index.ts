import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { DepartmentDocumentCategoryForm, DepartmentDocumentCategoryQuery, DepartmentDocumentCategoryVO } from './types';

export const listDepartmentDocumentCategory = (query: DepartmentDocumentCategoryQuery): AxiosPromise<PageResult<DepartmentDocumentCategoryVO>> =>
  request({ url: '/department/documentCategory/list', method: 'get', params: query });

export const listDepartmentDocumentCategoryOptions = (): AxiosPromise<DepartmentDocumentCategoryVO[]> =>
  request({ url: '/department/documentCategory/options', method: 'get' });

export const listDepartmentDocumentCategoryTree = (query?: Pick<DepartmentDocumentCategoryQuery, 'categoryName' | 'status'>): AxiosPromise<DepartmentDocumentCategoryVO[]> =>
  request({ url: '/department/documentCategory/tree', method: 'get', params: query });

export const getDepartmentDocumentCategory = (id: string | number): AxiosPromise<DepartmentDocumentCategoryVO> =>
  request({ url: '/department/documentCategory/' + id, method: 'get' });

export const addDepartmentDocumentCategory = (data: DepartmentDocumentCategoryForm) =>
  request({ url: '/department/documentCategory', method: 'post', data });

export const updateDepartmentDocumentCategory = (data: DepartmentDocumentCategoryForm) =>
  request({ url: '/department/documentCategory', method: 'put', data });

export const delDepartmentDocumentCategory = (ids: string | number | Array<string | number>) =>
  request({ url: '/department/documentCategory/' + ids, method: 'delete' });
