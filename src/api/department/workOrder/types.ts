export interface WorkOrderQuery extends PageQuery {
  beginDate?: string;
  endDate?: string;
  ticketNo?: string;
  systemName?: string;
  faultType?: string;
  status?: string;
  reviewStatus?: string;
  sourceType?: string;
  keyword?: string;
}

export interface WorkOrderVO {
  id: string | number;
  deptId?: string | number;
  ticketNo?: string;
  occurDate?: string;
  sourcePeriodStart?: string;
  sourcePeriodEnd?: string;
  requestDept?: string;
  settlementUnit?: string;
  projectOwner?: string;
  systemName: string;
  installDepartment?: string;
  installTeam?: string;
  workCategory?: string;
  faultType?: string;
  title?: string;
  workContent?: string;
  unit?: string;
  quantity?: number;
  responsiblePerson?: string;
  handler?: string;
  status: string;
  resolutionMinutes?: number;
  feedbackChannel?: string;
  reviewStatus: string;
  sourceType: string;
  sourceBatchId?: string | number;
  sourceFileName?: string;
  sourcePage?: number;
  detailCount?: number;
  parseConfidence?: number;
  parseMessage?: string;
  remark?: string;
  createTime?: string;
}

export interface WorkOrderDetailVO {
  id?: string | number;
  workOrderId?: string | number;
  sourcePage?: number;
  sequenceNo: number;
  requestDept?: string;
  settlementUnit?: string;
  projectOwner?: string;
  projectName?: string;
  projectFeature?: string;
  unit?: string;
  engineeringQuantity?: string;
  chineseLabor?: string;
  indonesiaLabor?: string;
  installDepartment?: string;
  installTeam?: string;
  workContent?: string;
  quantity?: number;
  parseMessage?: string;
}

export interface WorkOrderDetailForm {
  id?: string | number;
  workOrderId?: string | number;
  requestDept?: string;
  settlementUnit?: string;
  projectOwner?: string;
  projectName?: string;
  projectFeature?: string;
  unit?: string;
  engineeringQuantity?: string;
  chineseLabor?: string;
  indonesiaLabor?: string;
  installDepartment?: string;
  installTeam?: string;
  workContent?: string;
}

export interface WorkOrderForm {
  id?: string | number;
  ticketNo?: string;
  occurDate?: string;
  sourcePeriodStart?: string;
  sourcePeriodEnd?: string;
  requestDept?: string;
  settlementUnit?: string;
  projectOwner?: string;
  systemName?: string;
  installDepartment?: string;
  installTeam?: string;
  workCategory?: string;
  faultType?: string;
  title?: string;
  workContent?: string;
  unit?: string;
  quantity?: number;
  responsiblePerson?: string;
  handler?: string;
  status?: string;
  resolutionMinutes?: number;
  feedbackChannel?: string;
  reviewStatus?: string;
  remark?: string;
}

export interface WorkOrderDimensionVO {
  name: string;
  count: number;
  quantity: number;
  percentage: number;
}

export interface WorkOrderSummaryVO {
  totalCount: number;
  totalQuantity: number;
  totalEngineeringQuantity: number;
  totalChineseLabor: number;
  totalIndonesiaLabor: number;
  totalLaborQuantity: number;
  detailCount: number;
  resolvedCount: number;
  resolutionRate: number;
  averageResolutionMinutes: number;
  unattributedCount: number;
  pendingReviewCount: number;
  bySystem: WorkOrderDimensionVO[];
  byFaultType: WorkOrderDimensionVO[];
}

export interface WorkOrderImportResultVO {
  batch: {
    id: string | number;
    sourceFileName: string;
    pageCount: number;
    recordCount: number;
    parsedRecordCount: number;
    pendingRecordCount: number;
    status: string;
    sourcePeriodStart?: string;
    sourcePeriodEnd?: string;
  };
  message: string;
}
