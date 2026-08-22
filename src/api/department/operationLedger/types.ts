export interface OperationRecordQuery extends PageQuery {
  beginDate?: string;
  endDate?: string;
  customerUnit?: string;
  projectId?: string | number;
  systemName?: string;
  processStatus?: string;
  processMethod?: string;
  keyword?: string;
}

export interface OperationRecordVO {
  id: string | number;
  deptId?: string | number;
  projectId?: string | number;
  projectName?: string;
  requestPerson?: string;
  customerUnit?: string;
  requestRoleType?: string;
  requestTime?: string;
  handler?: string;
  processTime?: string;
  completionTime?: string;
  responseMinutes?: number;
  processingMinutes?: number;
  lunchBreak?: string;
  processStatus: string;
  processMethod?: string;
  submitter?: string;
  systemName?: string;
  faultType?: string;
  businessDescription?: string;
  solution?: string;
  remark?: string;
  sourceType?: string;
  sourceFileName?: string;
  createTime?: string;
}

export type OperationRecordForm = Partial<Omit<OperationRecordVO, 'id'>> & { id?: string | number };

export interface OperationSystemQuery extends PageQuery {
  beginDate?: string;
  endDate?: string;
  systemName?: string;
}

export interface OperationSystemVO {
  id: string | number;
  deptId?: string | number;
  projectId?: string | number;
  projectName?: string;
  statDate?: string;
  systemName: string;
  responsiblePerson?: string;
  serverName?: string;
  serverIp?: string;
  onlineDays?: number;
  downtimeMinutes?: number;
  onlineRate?: number;
  remark?: string;
  sourceType?: string;
  sourceFileName?: string;
  createTime?: string;
}

export type OperationSystemForm = Partial<Omit<OperationSystemVO, 'id' | 'projectName'>> & { id?: string | number };

export interface OperationDimensionVO {
  name: string;
  count: number;
  percentage: number;
}

export interface OperationSummaryVO {
  totalCount: number;
  resolvedCount: number;
  resolutionRate: number;
  averageProcessingMinutes: number;
  onlineRate: number;
  unattributedCount: number;
  bySystem: OperationDimensionVO[];
  byFaultType: OperationDimensionVO[];
  byProcessMethod: OperationDimensionVO[];
}
