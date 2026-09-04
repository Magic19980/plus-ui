import type { OaDepartmentApprovalUserVO } from './types';

export interface OaImportBusinessConfigVO {
  id: string | number;
  businessType: string;
  businessName: string;
  sheetName?: string;
  headerRow?: number;
  fieldDefinitionsJson?: string;
  parameterDefinitionsJson?: string;
  groupByJson?: string;
  deptField?: string;
  companyField?: string;
  aggregationJson?: string;
  formMappingJson?: string;
  attachmentConfigJson?: string;
  requestNameTemplate?: string;
  contentTemplate?: string;
  defaultWorkflowConfigId?: string | number;
  defaultApprovalPlanId?: string | number;
  defaultApprovalMode?: 'AUTO_RULE' | 'PLAN' | 'MANUAL' | string;
  status?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface OaImportTemplateFieldVO {
  code: string;
  header: string;
  type?: string;
  sample?: string;
  required?: boolean;
  uniqueKey?: boolean;
  role?: string;
}

export interface OaImportTemplatePreviewVO {
  sheetName: string;
  headerRow: number;
  sampleRowCount?: number;
  fields: OaImportTemplateFieldVO[];
  fieldDefinitionsJson: string;
  deptField?: string;
  companyField?: string;
  groupByJson?: string;
}

export interface OaImportAttachmentTemplateVO {
  ossId: string | number;
  fileName: string;
  sheetName: string;
  sheetNames?: string[];
  headerRow: number;
  dataStartRow: number;
  headers: string[];
  columns?: Array<{ columnIndex: number; label?: string }>;
  totalRow?: number;
  fixedCandidates?: OaImportAttachmentFixedCandidateVO[];
}

export interface OaImportAttachmentFixedCandidateVO {
  cell: string;
  row: number;
  column: number;
  originalContent: string;
  label?: string;
  originalValue?: string;
  merged?: boolean;
}

export type OaImportBusinessConfigForm = Partial<Omit<OaImportBusinessConfigVO, 'id'>> & { id?: string | number };

export interface OaImportBatchQuery extends PageQuery {
  configId?: string | number;
  businessType?: string;
  batchNo?: string;
  status?: string;
  keyword?: string;
}

export interface OaImportBatchVO {
  id: string | number;
  configId?: string | number;
  businessType?: string;
  businessName?: string;
  batchNo?: string;
  sourceFileName?: string;
  status?: string;
  totalCount?: number;
  matchedCount?: number;
  groupCount?: number;
  applicationCount?: number;
  failedCount?: number;
  skippedCount?: number;
  message?: string;
  unmatchedDeptNames?: string[];
  skippedDeptNames?: string[];
  mappingItems?: OaImportDeptMappingItemVO[];
  groups?: OaImportGroupVO[];
  records?: OaImportRecordVO[];
}

export interface OaImportDeptMappingItemVO {
  sourceDeptName: string;
  targetDeptId?: string | number;
  targetDeptName?: string;
  status?: 'MATCHED' | 'UNMATCHED' | 'SKIPPED' | string;
  recordCount?: number;
  skipReason?: string;
}

export interface OaImportGroupVO {
  groupKey: string;
  groupName?: string;
  recordCount?: number;
  skippedCount?: number;
  applicationCount?: number;
  applicationId?: string | number;
  attachmentOssId?: string | number;
  status?: string;
  errorMessage?: string;
  skipReason?: string;
}

export interface OaImportApprovalPreviewVO {
  groupKey: string;
  groupName?: string;
  businessDeptId?: string | number;
  businessDeptName?: string;
  recordCount?: number;
  status?: 'MATCHED' | 'MISSING_CONFIG' | 'INVALID_CONFIG' | 'AMBIGUOUS_DEPT' | string;
  message?: string;
  approvalPlanId?: string | number;
  planName?: string;
  workflowConfigId?: string | number;
  workflowId?: string;
  workflowName?: string;
  formName?: string;
  approvalCode?: string;
  approvalName?: string;
  processType?: 'SEQUENTIAL' | 'COUNTERSIGN' | 'MIXED' | string;
  approvers?: OaDepartmentApprovalUserVO[];
  copyUsers?: OaDepartmentApprovalUserVO[];
}

export interface OaImportRecordVO {
  id: string | number;
  rowNo?: number;
  data?: Record<string, unknown>;
  groupKey?: string;
  groupName?: string;
  deptId?: string | number;
  deptName?: string;
  companyId?: string | number;
  applicationId?: string | number;
  attachmentOssId?: string | number;
  status?: string;
  errorMessage?: string;
  skipReason?: string;
}

export interface OaImportDeptMappingForm {
  mappings?: Record<string, string | number>;
  skippedDeptReasons?: Record<string, string>;
}

export interface OaImportSubmitForm {
  workflowConfigId?: string | number;
  parameters?: Record<string, unknown>;
  approvalMode?: 'AUTO_RULE' | 'PLAN' | 'MANUAL' | string;
  approvalPlanId?: string | number;
  processType?: 'SEQUENTIAL' | 'COUNTERSIGN' | 'MIXED' | string;
  participants?: Array<Partial<import('./types').OaApprovalParticipantVO>>;
}

export interface OaImportAttachmentPreviewForm {
  groupKey?: string;
  parameters?: Record<string, unknown>;
}

export interface OaImportFieldDefinition {
  code: string;
  header: string;
  type?: string;
  required?: boolean;
  uniqueKey?: boolean;
}

export interface OaImportParameterDefinition {
  code: string;
  label?: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}
