export interface DailyReportVO {
  id: string | number;
  reportDate: string;
  userId?: string | number;
  deptId?: string | number;
  userName?: string;
  nickName?: string;
  deptName?: string;
  todayWork?: string;
  tomorrowPlan?: string;
  coordinationNote?: string;
  status: string;
  sourceType?: string;
  leaveId?: string | number;
}

export interface DailyReportAttachmentVO {
  id: string | number;
  reportId: string | number;
  ossId: string | number;
  originalName: string;
  fileType?: string;
  sortNum?: number;
  url?: string;
}

export interface DailyReportForm {
  id?: string | number;
  reportDate?: string;
  todayWork?: string;
  tomorrowPlan?: string;
  coordinationNote?: string;
}

export interface DailyReportQuery extends PageQuery {
  reportDate?: string;
  beginDate?: string;
  endDate?: string;
  userName?: string;
  status?: string;
}

export interface DailyCalendarDayVO {
  date: string;
  dayOfWeek: number;
  weekLabel: string;
  workday: boolean;
  departmentRest?: boolean;
  dayType: 'WORKDAY' | 'REST';
  label: string;
  remark?: string;
}

export interface DailyCalendarCellVO {
  date: string;
  workday?: boolean;
  dayType?: 'WORKDAY' | 'REST';
  label?: string;
  state: 'FILLED' | 'MISSING' | 'REST' | 'LEAVE';
  reportId?: string | number;
  sourceType?: string;
  todayWork?: string;
  tomorrowPlan?: string;
  coordinationNote?: string;
  leaveId?: string | number;
  leaveType?: string;
}

export interface DailyCalendarMemberVO {
  userId: string | number;
  userName?: string;
  nickName?: string;
  jobTitle?: string;
  cells: DailyCalendarCellVO[];
}

export interface DailyCalendarVO {
  month: string;
  beginDate: string;
  endDate: string;
  futureMonth?: boolean;
  workDays: string;
  days: DailyCalendarDayVO[];
  members: DailyCalendarMemberVO[];
  requiredCount: number;
  filledCount: number;
  missingCount: number;
  leaveCount: number;
}

export interface DailyCalendarConfigVO {
  id?: string | number;
  deptId?: string | number;
  userId?: string | number;
  workDays: string;
  remark?: string;
}

export interface DailyCalendarConfigForm {
  userId?: string | number;
  workDays: string;
  remark?: string;
}

export interface DailyCalendarOverrideVO {
  id: string | number;
  userId?: string | number;
  userName?: string;
  nickName?: string;
  calendarDate: string;
  dayType: 'WORKDAY' | 'REST';
  remark?: string;
}

export interface DailyCalendarOverrideForm {
  id?: string | number;
  userId?: string | number;
  calendarDate?: string;
  dayType?: 'WORKDAY' | 'REST';
  remark?: string;
}

export interface DailyLeaveVO {
  id: string | number;
  deptId?: string | number;
  userId: string | number;
  userName?: string;
  nickName?: string;
  startDate: string;
  endDate: string;
  leaveType?: string;
  reason?: string;
  status?: string;
}

export interface DailyLeaveForm {
  id?: string | number;
  userId?: string | number;
  startDate?: string;
  endDate?: string;
  leaveType?: string;
  reason?: string;
}
