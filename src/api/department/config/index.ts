import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { DepartmentConfigForm, DepartmentConfigQuery, DepartmentConfigVO } from './types';

export const listDepartmentConfig = (query: DepartmentConfigQuery): AxiosPromise<PageResult<DepartmentConfigVO>> =>
  request({ url: '/department/config/list', method: 'get', params: query });

export const listAvailableDepartments = (): AxiosPromise<DepartmentConfigVO[]> =>
  request({ url: '/department/config/available', method: 'get' });

export const getDepartmentConfig = (deptId: string | number): AxiosPromise<DepartmentConfigVO> =>
  request({ url: `/department/config/${deptId}`, method: 'get' });

export const addDepartmentConfig = (data: DepartmentConfigForm) => request({ url: '/department/config', method: 'post', data });

export const updateDepartmentConfig = (data: DepartmentConfigForm) => request({ url: '/department/config', method: 'put', data });

export const disableDepartmentConfig = (ids: Array<string | number> | string | number) =>
  request({ url: `/department/config/${ids}`, method: 'delete' });

export default {
  listDepartmentConfig,
  listAvailableDepartments,
  getDepartmentConfig,
  addDepartmentConfig,
  updateDepartmentConfig,
  disableDepartmentConfig
};
