export interface WeeklyReportQuery {
  pageNum?: number;
  pageSize?: number;
  beginDate?: string;
  endDate?: string;
  status?: string;
}

export interface WeeklyReportVO {
  id: string | number;
  weekStart: string;
  weekEnd: string;
  title: string;
  reportCount: number;
  requiredUserCount: number;
  filledUserCount: number;
  missingUserCount: number;
  status: string;
  createTime?: string;
}

export interface WeeklyReportItemVO {
  reportDate: string;
  userName: string;
  todayWork: string;
  tomorrowPlan?: string;
  coordinationNote?: string;
}

export interface WeeklyReportSummaryVO {
  weekStart: string;
  weekEnd: string;
  reportCount: number;
  requiredUserCount: number;
  filledUserCount: number;
  missingUserCount: number;
  reportCountByDate: Record<string, number>;
  missingUserNames: string[];
  reportItems: WeeklyReportItemVO[];
  tomorrowPlans: string[];
  coordinationNotes: string[];
  manualOrderSummary: WorkOrderSummaryVO;
  operationSummary: OperationSummaryVO;
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
  bySystem: WorkOrderDimensionVO[];
  byFaultType: WorkOrderDimensionVO[];
}

export interface WeeklyReportGenerateForm {
  weekStart: string;
  weekEnd?: string;
  title?: string;
}
import type { OperationSummaryVO } from '@/api/department/operationLedger/types';
