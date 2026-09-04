export interface OaApplicationQuery extends PageQuery {
  businessType?: string;
  title?: string;
  status?: string;
  monitor?: boolean;
}

export interface OaBusinessTypeVO {
  id: string | number;
  businessType: string;
  businessName: string;
  status: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export type OaBusinessTypeForm = Partial<Omit<OaBusinessTypeVO, 'id'>> & { id?: string | number };

export interface OaApplicationVO {
  id: string | number;
  applicationNo?: string;
  businessType: string;
  sourceModule?: string;
  businessId?: string;
  businessNo?: string;
  title: string;
  content: string;
  urgency?: string;
  formDataJson?: string;
  attachments?: OaAttachmentVO[];
  participants?: OaApprovalParticipantVO[];
  applicantUserId?: string | number;
  applicantName?: string;
  deptId?: string | number;
  deptIds?: Array<string | number>;
  companyId?: string | number;
  processType?: 'SEQUENTIAL' | 'COUNTERSIGN' | 'MIXED' | string;
  approvalPlanId?: string | number;
  approvalMode?: 'AUTO_RULE' | 'PLAN' | 'MANUAL' | string;
  workflowConfigId?: string | number;
  formName?: string;
  workflowName?: string;
  approvalCode?: string;
  approvalName?: string;
  workflowId?: string;
  status: string;
  processId?: string | number;
  oaRequestId?: string;
  localStatus?: string;
  oaStatus?: string;
  oaStatusRaw?: string;
  requestName?: string;
  oaLink?: string;
  failReason?: string;
  submittedAt?: string;
  completedAt?: string;
  lastSyncAt?: string;
  createTime?: string;
  updateTime?: string;
}

export type OaApplicationForm = Partial<Omit<OaApplicationVO, 'id'>> & {
  id?: string | number;
  workflowConfigId?: string | number;
  participants?: Array<Partial<OaApprovalParticipantVO>>;
};

export interface OaAttachmentVO {
  id: string | number;
  applicationId?: string | number;
  processId?: string | number;
  ossId: string | number;
  attachmentType?: string;
  fileName?: string;
  fileUrl?: string;
  sortNo?: number;
  uploadStatus?: string;
  oaFileId?: string;
  oaFilePath?: string;
  failReason?: string;
}

export interface OaAttachmentPreviewVO {
  ossId?: string | number;
  fileName?: string;
  contentType?: string;
  previewType?: 'TABLE' | 'DOWNLOAD' | string;
  message?: string;
  sheetNames?: string[];
  sheetName?: string;
  columnLabels?: string[];
  rowNumbers?: number[];
  rows?: string[][];
  truncated?: boolean;
}

export interface OaApprovalParticipantVO {
  id: string | number;
  applicationId?: string | number;
  processId?: string | number;
  stageCode: string;
  stageName?: string;
  ruleId?: string | number;
  ruleCode?: string;
  ruleName?: string;
  stageOrder?: number;
  stageMode?: string;
  participantRole?: string;
  participantType?: string;
  localUserId?: string | number;
  oaUserId?: string;
  oaUserName?: string;
  sourceValue?: string;
  sortNo?: number;
  required?: boolean;
}

export interface OaWorkflowConfigVO {
  id: string | number;
  workflowId: string;
  workflowName: string;
  formId?: string | number;
  formName?: string;
  approvalCode?: string;
  approvalName?: string;
  isDefault?: boolean;
  processType: 'SEQUENTIAL' | 'COUNTERSIGN' | 'MIXED' | string;
  participantMappingJson?: string;
  sourceWorkflowName?: string;
  requestNameTemplate?: string;
  fieldMappingJson?: string;
  specificFieldMappingJson?: string;
  fieldSchemaJson?: string;
  status: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface OaWorkflowOptionVO {
  id?: string | number;
  optionCode: string;
  optionName: string;
  processType?: 'SEQUENTIAL' | 'COUNTERSIGN' | 'MIXED' | string;
  participantMappingJson?: string;
  sortNo?: number;
  status: string;
  remark?: string;
}

export type OaWorkflowOptionForm = Partial<Omit<OaWorkflowOptionVO, 'id'>> & {
  id?: string | number;
  optionCode: string;
  optionName: string;
  processType?: 'SEQUENTIAL' | 'COUNTERSIGN' | 'MIXED' | string;
  participantMappingJson?: string;
};

export interface OaFormWorkflowVO {
  id: string | number;
  workflowId: string;
  formName: string;
  requestNameTemplate?: string;
  fieldMappingJson?: string;
  specificFieldMappingJson?: string;
  fieldSchemaJson?: string;
  status: string;
  remark?: string;
  options: OaWorkflowOptionVO[];
  createTime?: string;
  updateTime?: string;
}

export type OaFormWorkflowForm = Partial<Omit<OaFormWorkflowVO, 'id' | 'options'>> & {
  id?: string | number;
  options?: OaWorkflowOptionVO[];
};

export type OaFormFieldControlType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'SELECT'
  | 'RADIO'
  | 'DATE'
  | 'DATETIME'
  | 'USER_SINGLE'
  | 'USER_MULTI'
  | 'FILE'
  | 'IMAGE';

export type OaFormFieldSemanticType =
  | 'SPECIFIC'
  | 'TITLE'
  | 'CONTENT'
  | 'APPLICANT'
  | 'APPLICANT_DATE'
  | 'URGENCY'
  | 'APPROVAL_MODE'
  | 'PARTICIPANT'
  | 'COPY'
  | 'ATTACHMENT'
  | 'IMAGE'
  | 'SYSTEM';

export interface OaFormFieldOption {
  label: string;
  oaValue: string;
  /** 全局审批方式编码，仅 APPROVAL_MODE 字段使用。 */
  optionCode?: string;
}

export interface OaFormFieldDefinition {
  key: string;
  label: string;
  oaFieldCode: string;
  controlType: OaFormFieldControlType | string;
  semanticType?: OaFormFieldSemanticType | string;
  required?: boolean;
  multiple?: boolean;
  placeholder?: string;
  options?: OaFormFieldOption[];
  sortNo?: number;
}

export interface OaFormFieldSchema {
  version: number;
  fields: OaFormFieldDefinition[];
}

export interface OaBusinessWorkflowBindingVO {
  businessType: string;
  formId?: string | number;
  defaultOptionId?: string | number;
  optionIds: Array<string | number>;
}

export interface OaDepartmentApprovalUserVO {
  id?: string | number;
  approvalId?: string | number;
  localUserId: string | number;
  stageCode?: string;
  stageName?: string;
  stageMode?: string;
  userName?: string;
  nickName?: string;
  employeeNo?: string;
  oaUserId?: string;
  deptName?: string;
  participantRole: 'APPROVER' | 'COPY' | string;
  sortNo?: number;
}

export interface OaDepartmentApprovalVO {
  id: string | number;
  workflowConfigId: string | number;
  businessType: string;
  sourceModule?: string;
  businessDeptId?: string | number;
  businessDeptName?: string;
  planName: string;
  matchConditionJson?: string;
  priority?: number;
  status: string;
  remark?: string;
  workflowName?: string;
  formName?: string;
  approvalCode?: string;
  approvalName?: string;
  participantMappingJson?: string;
  processType?: 'SEQUENTIAL' | 'COUNTERSIGN' | 'MIXED' | string;
  users?: OaDepartmentApprovalUserVO[];
  createTime?: string;
  updateTime?: string;
}

export type OaDepartmentApprovalForm = Partial<Omit<OaDepartmentApprovalVO, 'id' | 'users'>> & {
  id?: string | number;
  users?: Array<Pick<OaDepartmentApprovalUserVO, 'localUserId' | 'participantRole' | 'sortNo' | 'stageCode' | 'stageName' | 'stageMode'>>;
};

export interface OaApprovalRulePreviewVO {
  ruleId?: string | number;
  ruleCode?: string;
  ruleName?: string;
  stageCode: string;
  stageName?: string;
  stageOrder?: number;
  stageMode?: string;
  participantRole?: string;
  participantType?: string;
  localUserId?: string | number;
  oaUserId?: string;
  oaUserName?: string;
  sourceValue?: string;
  sortNo?: number;
  required?: boolean;
}

export interface OaOrganizationTreeVO {
  nodeKey: string;
  nodeType: 'SUBCOMPANY' | 'DEPARTMENT' | string;
  /** 兼容直接返回 sys_dept 时的泛微原始字段。 */
  oaSourceType?: string;
  oaId: string;
  oaCode?: string;
  name: string;
  shortName?: string;
  fullName?: string;
  subcompanyId?: string;
  parentOaId?: string;
  parentNodeKey?: string;
  path?: string;
  level?: number;
  status?: 'ENABLED' | 'DISABLED' | string;
  treeStatus?: 'VALID' | 'ORPHAN' | 'CYCLE' | string;
  showOrder?: number;
  localDeptId?: string | number;
  localDeptName?: string;
  children?: OaOrganizationTreeVO[];
}

export interface OaSyncBatchVO {
  id: string | number;
  syncType: string;
  syncMode: string;
  status: string;
  watermark?: string;
  startedAt?: string;
  finishedAt?: string;
  totalCount?: number;
  successCount?: number;
  createdCount?: number;
  updatedCount?: number;
  disabledCount?: number;
  pendingCount?: number;
  failedCount?: number;
  message?: string;
}

export interface OaSyncResultVO extends OaSyncBatchVO {
  batchId: string | number;
}

export interface OaHrmUserPasswordStatusVO {
  configured: boolean;
  source?: 'PAGE' | 'ENV' | 'NONE' | string;
  password?: string;
}

export interface OaHrmUserPasswordForm {
  password: string;
}

export interface OaSyncDetailVO {
  id: string | number;
  batchId: string | number;
  entityType: string;
  sourceId?: string;
  sourceKey?: string;
  localId?: string | number;
  action?: string;
  detailStatus: string;
  message?: string;
  createTime?: string;
  updateTime?: string;
}

export interface OaProcessEventLogVO {
  id: string | number;
  processId?: string | number;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  requestSummary?: string;
  responseSummary?: string;
  errorCode?: string;
  createTime?: string;
}
