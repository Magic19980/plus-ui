import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { DepartmentReviewRuleForm, DepartmentReviewRuleVO, DepartmentTaskAssignmentForm, DepartmentTaskAssignmentVO, DepartmentTaskProgressVO, DepartmentTaskRuleForm, DepartmentTaskRuleVO } from './types';

export const listDepartmentTaskRules = (): AxiosPromise<DepartmentTaskRuleVO[]> => request({ url: '/department/task/rule/list', method: 'get' });
export const getDepartmentTaskRule = (id: string | number): AxiosPromise<DepartmentTaskRuleVO> => request({ url: `/department/task/rule/${id}`, method: 'get' });
export const addDepartmentTaskRule = (data: DepartmentTaskRuleForm) => request({ url: '/department/task/rule', method: 'post', data });
export const updateDepartmentTaskRule = (data: DepartmentTaskRuleForm) => request({ url: '/department/task/rule', method: 'put', data });
export const delDepartmentTaskRule = (id: string | number) => request({ url: `/department/task/rule/${id}`, method: 'delete' });

export const listDepartmentTaskAssignments = (ruleId: string | number): AxiosPromise<DepartmentTaskAssignmentVO[]> => request({ url: `/department/task/assignment/list/${ruleId}`, method: 'get' });
export const addDepartmentTaskAssignment = (data: DepartmentTaskAssignmentForm) => request({ url: '/department/task/assignment', method: 'post', data });
export const updateDepartmentTaskAssignment = (data: DepartmentTaskAssignmentForm) => request({ url: '/department/task/assignment', method: 'put', data });
export const delDepartmentTaskAssignment = (id: string | number) => request({ url: `/department/task/assignment/${id}`, method: 'delete' });

export const listMyDepartmentTasks = (): AxiosPromise<DepartmentTaskProgressVO[]> => request({ url: '/department/task/my', method: 'get' });

export const listDepartmentReviewRules = (): AxiosPromise<DepartmentReviewRuleVO[]> => request({ url: '/department/task/review/list', method: 'get' });
export const addDepartmentReviewRule = (data: DepartmentReviewRuleForm) => request({ url: '/department/task/review', method: 'post', data });
export const updateDepartmentReviewRule = (data: DepartmentReviewRuleForm) => request({ url: '/department/task/review', method: 'put', data });
export const delDepartmentReviewRule = (id: string | number) => request({ url: `/department/task/review/${id}`, method: 'delete' });

export default {
  listDepartmentTaskRules,
  getDepartmentTaskRule,
  addDepartmentTaskRule,
  updateDepartmentTaskRule,
  delDepartmentTaskRule,
  listDepartmentTaskAssignments,
  addDepartmentTaskAssignment,
  updateDepartmentTaskAssignment,
  delDepartmentTaskAssignment,
  listMyDepartmentTasks,
  listDepartmentReviewRules,
  addDepartmentReviewRule,
  updateDepartmentReviewRule,
  delDepartmentReviewRule
};
