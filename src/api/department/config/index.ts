import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { DepartmentConfigForm, DepartmentConfigMigrationForm, DepartmentConfigQuery, DepartmentConfigVO } from './types';

export const listDepartmentConfig = (query: DepartmentConfigQuery): AxiosPromise<PageResult<DepartmentConfigVO>> =>
  request({ url: '/department/config/list', method: 'get', params: query });

export const listAvailableDepartments = (query?: Pick<DepartmentConfigQuery, 'deptName'>): AxiosPromise<DepartmentConfigVO[]> =>
  request({ url: '/department/config/available', method: 'get', params: query });

export const listOrganizationDepartmentChildren = (parentId: string | number = 0): AxiosPromise<DepartmentConfigVO[]> =>
  request({ url: '/department/config/organization/children', method: 'get', params: { parentId } });

export const getDepartmentConfig = (deptId: string | number): AxiosPromise<DepartmentConfigVO> =>
  request({ url: `/department/config/${deptId}`, method: 'get' });

export const addDepartmentConfig = (data: DepartmentConfigForm) => request({ url: '/department/config', method: 'post', data });

export const updateDepartmentConfig = (data: DepartmentConfigForm) => request({ url: '/department/config', method: 'put', data });

export const migrateDepartmentConfig = (data: DepartmentConfigMigrationForm) =>
  request({ url: '/department/config/migrate', method: 'put', data });

export const disableDepartmentConfig = (ids: Array<string | number> | string | number) =>
  request({ url: `/department/config/${ids}`, method: 'delete' });

export default {
  listDepartmentConfig,
  listAvailableDepartments,
  listOrganizationDepartmentChildren,
  getDepartmentConfig,
  addDepartmentConfig,
  updateDepartmentConfig,
  migrateDepartmentConfig,
  disableDepartmentConfig
};
