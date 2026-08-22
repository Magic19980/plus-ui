import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { DepartmentProjectForm, DepartmentProjectQuery, DepartmentProjectVO } from './types';

export const listDepartmentProject = (query: DepartmentProjectQuery): AxiosPromise<PageResult<DepartmentProjectVO>> =>
  request({ url: '/department/project/list', method: 'get', params: query });

export const getDepartmentProject = (id: string | number): AxiosPromise<DepartmentProjectVO> =>
  request({ url: '/department/project/' + id, method: 'get' });

export const listDepartmentProjectOptions = (): AxiosPromise<DepartmentProjectVO[]> =>
  request({ url: '/department/project/options', method: 'get' });

export const addDepartmentProject = (data: DepartmentProjectForm) => request({ url: '/department/project', method: 'post', data });

export const updateDepartmentProject = (data: DepartmentProjectForm) => request({ url: '/department/project', method: 'put', data });

export const delDepartmentProject = (ids: Array<string | number> | string | number) =>
  request({ url: '/department/project/' + ids, method: 'delete' });

export default {
  listDepartmentProject,
  getDepartmentProject,
  listDepartmentProjectOptions,
  addDepartmentProject,
  updateDepartmentProject,
  delDepartmentProject
};
