import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { DepartmentDocumentCategoryForm, DepartmentDocumentCategoryQuery, DepartmentDocumentCategoryVO } from './types';

export const listDepartmentDocumentCategoryOptions = (): AxiosPromise<DepartmentDocumentCategoryVO[]> =>
  request({ url: '/department/documentCategory/options', method: 'get' });

export const listDepartmentDocumentCategoryTree = (query?: Pick<DepartmentDocumentCategoryQuery, 'categoryName' | 'status'>): AxiosPromise<DepartmentDocumentCategoryVO[]> =>
  request({ url: '/department/documentCategory/tree', method: 'get', params: query });

export const addDepartmentDocumentCategory = (data: DepartmentDocumentCategoryForm) =>
  request({ url: '/department/documentCategory', method: 'post', data });

export const updateDepartmentDocumentCategory = (data: DepartmentDocumentCategoryForm) =>
  request({ url: '/department/documentCategory', method: 'put', data });

export const delDepartmentDocumentCategory = (ids: string | number | Array<string | number>) =>
  request({ url: '/department/documentCategory/' + ids, method: 'delete' });
