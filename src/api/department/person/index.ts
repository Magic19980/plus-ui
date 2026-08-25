import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  PersonProfileForm,
  PersonProfileEndForm,
  PersonProfileQuery,
  PersonProfileVO,
  PersonDepartmentContextVO,
  PersonLeaveForm,
  PersonLeaveVO,
  PersonUserOptionQuery,
  PersonUserOptionVO
} from './types';

export const listPersonProfile = (query: PersonProfileQuery): AxiosPromise<PageResult<PersonProfileVO>> => {
  return request({
    url: '/department/person/list',
    method: 'get',
    params: query
  });
};

export const getPersonProfile = (id: string | number): AxiosPromise<PersonProfileVO> => {
  return request({
    url: '/department/person/' + id,
    method: 'get'
  });
};

export const listPersonUserOptions = (): AxiosPromise<PersonUserOptionVO[]> => {
  return request({
    url: '/department/person/userOptions',
    method: 'get'
  });
};

export const listPersonUserOptionsPage = (query: PersonUserOptionQuery): AxiosPromise<PageResult<PersonUserOptionVO>> => {
  return request({
    url: '/department/person/userOptions/page',
    method: 'get',
    params: query
  });
};

export const listPersonMemberOptions = (): AxiosPromise<PersonUserOptionVO[]> => {
  return request({
    url: '/department/person/memberOptions',
    method: 'get'
  });
};

export const listPersonLeaves = (userId?: string | number): AxiosPromise<PersonLeaveVO[]> => {
  return request({
    url: '/department/person/leave/list',
    method: 'get',
    params: { userId }
  });
};

export const addPersonLeave = (data: PersonLeaveForm) => {
  return request({
    url: '/department/person/leave',
    method: 'post',
    data
  });
};

export const updatePersonLeave = (data: PersonLeaveForm) => {
  return request({
    url: '/department/person/leave',
    method: 'put',
    data
  });
};

export const delPersonLeave = (ids: string | number | Array<string | number>) => {
  return request({
    url: '/department/person/leave/' + ids,
    method: 'delete'
  });
};

export const addPersonProfile = (data: PersonProfileForm) => {
  return request({
    url: '/department/person',
    method: 'post',
    data
  });
};

export const updatePersonProfile = (data: PersonProfileForm) => {
  return request({
    url: '/department/person',
    method: 'put',
    data
  });
};

export const delPersonProfile = (ids: string | number | Array<string | number>) => {
  return request({
    url: '/department/person/' + ids,
    method: 'delete'
  });
};

export const endPersonProfile = (id: string | number, data: PersonProfileEndForm) => {
  return request({
    url: '/department/person/' + id + '/end',
    method: 'post',
    data
  });
};

export const listMyDepartmentContexts = (): AxiosPromise<PersonDepartmentContextVO[]> =>
  request({
    url: '/department/person/myDepartments',
    method: 'get'
  });

export const switchMyDepartment = (deptId: string | number): AxiosPromise<PersonDepartmentContextVO> =>
  request({
    url: '/department/person/context/' + deptId,
    method: 'post'
  });

export default {
  listPersonProfile,
  getPersonProfile,
  listPersonUserOptions,
  listPersonUserOptionsPage,
  listPersonMemberOptions,
  listPersonLeaves,
  addPersonLeave,
  updatePersonLeave,
  delPersonLeave,
  addPersonProfile,
  updatePersonProfile,
  delPersonProfile,
  endPersonProfile,
  listMyDepartmentContexts,
  switchMyDepartment
};
