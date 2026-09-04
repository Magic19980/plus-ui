import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import { type DeptForm, type DeptQuery, type DeptVO } from './types';

// 查询部门列表
export const listDept = (query?: DeptQuery) => {
  return request({
    url: '/system/dept/list',
    method: 'get',
    params: query
  });
};

// 按条件搜索部门，仅返回命中节点及其上级路径
export const searchDept = (query: DeptQuery) => {
  return request({
    url: '/system/dept/search',
    method: 'get',
    params: query
  });
};

// 按父部门查询直属子部门（部门管理树懒加载）
export const listDeptChildren = (parentId: string | number = 0): AxiosPromise<DeptVO[]> => {
  return request({
    url: '/system/dept/children',
    method: 'get',
    params: { parentId }
  });
};

/**
 * 通过deptIds查询部门
 * @param deptIds
 */
export const optionSelect = (deptIds: (number | string)[]): AxiosPromise<DeptVO[]> => {
  return request({
    url: '/system/dept/optionselect?deptIds=' + deptIds,
    method: 'get'
  });
};

// 查询部门列表（排除节点）
export const listDeptExcludeChild = (deptId: string | number): AxiosPromise<DeptVO[]> => {
  return request({
    url: '/system/dept/list/exclude/' + deptId,
    method: 'get'
  });
};

// 查询部门详细
export const getDept = (deptId: string | number): AxiosPromise<DeptVO> => {
  return request({
    url: '/system/dept/' + deptId,
    method: 'get'
  });
};

// 新增部门
export const addDept = (data: DeptForm) => {
  return request({
    url: '/system/dept',
    method: 'post',
    data: data
  });
};

// 修改部门
export const updateDept = (data: DeptForm) => {
  return request({
    url: '/system/dept',
    method: 'put',
    data: data
  });
};

// 删除部门
export const delDept = (deptId: number | string) => {
  return request({
    url: '/system/dept/' + deptId,
    method: 'delete'
  });
};
