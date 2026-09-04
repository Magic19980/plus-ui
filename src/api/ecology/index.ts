import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  OaApprovalRulePreviewVO,
  OaApplicationForm,
  OaApplicationQuery,
  OaApplicationVO,
  OaAttachmentPreviewVO,
  OaBusinessTypeForm,
  OaBusinessTypeVO,
  OaDepartmentApprovalForm,
  OaDepartmentApprovalVO,
  OaHrmUserPasswordForm,
  OaHrmUserPasswordStatusVO,
  OaOrganizationTreeVO,
  OaProcessEventLogVO,
  OaSyncBatchVO,
  OaSyncDetailVO,
  OaSyncResultVO,
  OaWorkflowConfigVO,
  OaFormWorkflowForm,
  OaFormWorkflowVO,
  OaBusinessWorkflowBindingVO,
  OaWorkflowOptionForm,
  OaWorkflowOptionVO
} from './types';
import type { PageResult } from '@/api/types';
import type { DeptVO } from '@/api/system/dept/types';
export * from './importBusiness';
export type * from './importBusinessTypes';

export const listOaApplications = (query: OaApplicationQuery): AxiosPromise<PageResult<OaApplicationVO>> =>
  request({ url: '/ecology/application/list', method: 'get', params: query });

export const listOaBusinessTypes = (keyword?: string, enabledOnly = false): AxiosPromise<OaBusinessTypeVO[]> =>
  request({ url: '/ecology/business-type/list', method: 'get', params: { keyword, enabledOnly } });

export const getOaBusinessType = (id: string | number): AxiosPromise<OaBusinessTypeVO> =>
  request({ url: `/ecology/business-type/${id}`, method: 'get' });

export const saveOaBusinessType = (data: OaBusinessTypeForm) =>
  request({ url: '/ecology/business-type', method: data.id ? 'put' : 'post', data });

export const disableOaBusinessType = (id: string | number) =>
  request({ url: `/ecology/business-type/${id}`, method: 'delete' });

export const getOaApplication = (id: string | number): AxiosPromise<OaApplicationVO> =>
  request({ url: `/ecology/application/${id}`, method: 'get' });

export const previewOaApplicationAttachment = (ossId: string | number): AxiosPromise<OaAttachmentPreviewVO> =>
  request({ url: `/ecology/application/attachment-preview/${ossId}`, method: 'get' });

export const listOaApplicationDepartments = (params?: { keyword?: string; deptIds?: Array<string | number>; parentId?: string | number }): AxiosPromise<DeptVO[]> =>
  request({ url: '/ecology/application/departments', method: 'get', params });

export const saveOaApplication = (data: OaApplicationForm) =>
  request({ url: '/ecology/application', method: data.id ? 'put' : 'post', data });

export const submitOaApplication = (id: string | number): AxiosPromise<OaApplicationVO> =>
  request({ url: `/ecology/application/${id}/submit`, method: 'post' });

export const syncOaApplication = (id: string | number): AxiosPromise<OaApplicationVO> =>
  request({ url: `/ecology/application/${id}/sync`, method: 'post' });

export const reconcileOaApplications = () => request({ url: '/ecology/application/reconcile', method: 'post' });

export const listOaApplicationEvents = (id: string | number): AxiosPromise<OaProcessEventLogVO[]> =>
  request({ url: `/ecology/application/${id}/events`, method: 'get' });

export const listOaWorkflowConfigs = (businessType?: string, enabledOnly = false): AxiosPromise<OaWorkflowConfigVO[]> =>
  request({ url: '/ecology/workflow-config/list', method: 'get', params: { businessType, enabledOnly } });

export const listOaFormWorkflows = (enabledOnly = false): AxiosPromise<OaFormWorkflowVO[]> =>
  request({ url: '/ecology/workflow-config/forms', method: 'get', params: { enabledOnly } });

export const getOaFormWorkflow = (id: string | number): AxiosPromise<OaFormWorkflowVO> =>
  request({ url: `/ecology/workflow-config/form/${id}`, method: 'get' });

export const listOaWorkflowOptions = (enabledOnly = false): AxiosPromise<OaWorkflowOptionVO[]> =>
  request({ url: '/ecology/workflow-config/options', method: 'get', params: { enabledOnly } });

export const saveOaFormWorkflow = (data: OaFormWorkflowForm) =>
  request({ url: '/ecology/workflow-config/form', method: data.id ? 'put' : 'post', data });

export const delOaFormWorkflow = (id: string | number) =>
  request({ url: `/ecology/workflow-config/form/${id}`, method: 'delete' });

export const saveOaWorkflowOption = (data: OaWorkflowOptionForm) =>
  request({ url: '/ecology/workflow-config/option', method: data.id ? 'put' : 'post', data });

export const delOaWorkflowOption = (id: string | number) =>
  request({ url: `/ecology/workflow-config/option/${id}`, method: 'delete' });

export const listOaBusinessWorkflowBindings = (): AxiosPromise<OaBusinessWorkflowBindingVO[]> =>
  request({ url: '/ecology/business-type/workflow-bindings', method: 'get' });

export const getOaBusinessWorkflowBinding = (businessType: string): AxiosPromise<OaBusinessWorkflowBindingVO> =>
  request({ url: `/ecology/business-type/${encodeURIComponent(businessType)}/workflow-binding`, method: 'get' });

export const saveOaBusinessWorkflowBinding = (businessType: string, data: { formId: string | number; optionIds: Array<string | number>; defaultOptionId: string | number }) =>
  request({ url: `/ecology/business-type/${encodeURIComponent(businessType)}/workflow-binding`, method: 'put', data });

export const delOaBusinessWorkflowBinding = (businessType: string) =>
  request({ url: `/ecology/business-type/${encodeURIComponent(businessType)}/workflow-binding`, method: 'delete' });

export const listOaDepartmentApprovals = (params?: { workflowConfigId?: string | number; businessType?: string; sourceModule?: string; businessDeptId?: string | number; enabledOnly?: boolean }): AxiosPromise<OaDepartmentApprovalVO[]> =>
  request({ url: '/ecology/approval-plan/list', method: 'get', params });

export const listOaApprovalOrganizations = (params?: { keyword?: string; deptIds?: Array<string | number>; parentId?: string | number }): AxiosPromise<DeptVO[]> =>
  request({ url: '/ecology/approval-plan/organizations', method: 'get', params });

export const getOaDepartmentApproval = (id: string | number): AxiosPromise<OaDepartmentApprovalVO> =>
  request({ url: `/ecology/approval-plan/${id}`, method: 'get' });

export const saveOaDepartmentApproval = (data: OaDepartmentApprovalForm) =>
  request({ url: '/ecology/approval-plan', method: data.id ? 'put' : 'post', data });

export const delOaDepartmentApproval = (id: string | number) =>
  request({ url: `/ecology/approval-plan/${id}`, method: 'delete' });

export const previewOaApplicationParticipants = (id: string | number): AxiosPromise<OaApprovalRulePreviewVO[]> =>
  request({ url: `/ecology/application/${id}/participants/preview`, method: 'get' });

export const syncOaOrganization = (full = true): AxiosPromise<OaSyncResultVO> =>
  request({ url: '/ecology/hrm-sync/organization', method: 'post', params: { full }, timeout: 10 * 60 * 1000 });

export const syncOaUsers = (full = true): AxiosPromise<OaSyncResultVO> =>
  request({ url: '/ecology/hrm-sync/users', method: 'post', params: { full }, timeout: 10 * 60 * 1000 });

export const getOaHrmUserPasswordStatus = (): AxiosPromise<OaHrmUserPasswordStatusVO> =>
  request({ url: '/ecology/hrm-sync/user-password/status', method: 'get' });

export const updateOaHrmUserPassword = (data: OaHrmUserPasswordForm) =>
  request({ url: '/ecology/hrm-sync/user-password', method: 'put', data });

export const listOaOrganizationTree = (includeDisabled = false, subcompanyId?: string): AxiosPromise<OaOrganizationTreeVO[]> =>
  request({ url: '/ecology/hrm-sync/organization-tree', method: 'get', params: { includeDisabled, subcompanyId } });

export const listOaSyncBatches = (syncType: string | undefined, query: PageQuery): AxiosPromise<PageResult<OaSyncBatchVO>> =>
  request({ url: '/ecology/hrm-sync/batches', method: 'get', params: { syncType, ...query } });

export const listOaSyncDetails = (batchId: string | number | undefined, detailStatus: string | undefined, query: PageQuery): AxiosPromise<PageResult<OaSyncDetailVO>> =>
  request({ url: '/ecology/hrm-sync/details', method: 'get', params: { batchId, detailStatus, ...query } });

export default {
  listOaApplications,
  listOaBusinessTypes,
  getOaBusinessType,
  saveOaBusinessType,
  disableOaBusinessType,
  getOaApplication,
  previewOaApplicationAttachment,
  listOaApplicationDepartments,
  saveOaApplication,
  submitOaApplication,
  syncOaApplication,
  reconcileOaApplications,
  listOaApplicationEvents,
  listOaWorkflowConfigs,
  listOaFormWorkflows,
  getOaFormWorkflow,
  saveOaFormWorkflow,
  delOaFormWorkflow,
  listOaBusinessWorkflowBindings,
  getOaBusinessWorkflowBinding,
  saveOaBusinessWorkflowBinding,
  delOaBusinessWorkflowBinding,
  listOaDepartmentApprovals,
  getOaDepartmentApproval,
  saveOaDepartmentApproval,
  delOaDepartmentApproval,
  previewOaApplicationParticipants,
  syncOaOrganization,
  syncOaUsers,
  getOaHrmUserPasswordStatus,
  updateOaHrmUserPassword,
  listOaOrganizationTree,
  listOaSyncBatches,
  listOaSyncDetails
};
