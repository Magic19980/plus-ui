import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PersonProfileForm, PersonProfileQuery, PersonProfileVO, PersonUserOptionVO } from './types';

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

export default {
  listPersonProfile,
  getPersonProfile,
  listPersonUserOptions,
  addPersonProfile,
  updatePersonProfile,
  delPersonProfile
};
