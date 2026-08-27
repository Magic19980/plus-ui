export type DepartmentTaskType = 'SCORE_PROPOSAL' | 'FIVE_WHY' | 'DAILY_REPORT';
export type DepartmentCycleType = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER';

export interface DepartmentTaskRuleVO {
  id: string | number;
  deptId?: string | number;
  taskName: string;
  taskType: DepartmentTaskType;
  cycleType: DepartmentCycleType;
  requiredCount: number;
  deadlineDay?: number;
  deadlineTime?: string;
  countMode?: 'SUBMITTED' | 'APPROVED';
  remindHours?: number;
  effectiveStart?: string;
  effectiveEnd?: string;
  status?: string;
  remark?: string;
  assignmentCount?: number;
}

export interface DepartmentTaskRuleForm {
  id?: string | number;
  taskName?: string;
  taskType?: DepartmentTaskType;
  cycleType?: DepartmentCycleType;
  requiredCount?: number;
  deadlineDay?: number;
  deadlineTime?: string;
  countMode?: 'SUBMITTED' | 'APPROVED';
  remindHours?: number;
  effectiveStart?: string;
  effectiveEnd?: string;
  status?: string;
  remark?: string;
}

export interface DepartmentTaskAssignmentVO {
  id: string | number;
  ruleId: string | number;
  deptId?: string | number;
  userId: string | number;
  userName?: string;
  nickName?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  workDays?: string;
  reminderTime?: string;
  status?: string;
  remark?: string;
}

export interface DepartmentTaskAssignmentForm {
  id?: string | number;
  ruleId?: string | number;
  userId?: string | number;
  effectiveStart?: string;
  effectiveEnd?: string;
  workDays?: string;
  reminderTime?: string;
  status?: string;
  remark?: string;
}

export interface DepartmentTaskProgressVO {
  ruleId: string | number;
  assignmentId: string | number;
  userId: string | number;
  userName?: string;
  taskName: string;
  taskType: DepartmentTaskType;
  cycleType: DepartmentCycleType;
  periodStart: string;
  periodEnd: string;
  deadline?: string;
  requiredCount: number;
  completedCount: number;
  completedAt?: string;
  status: string;
  statusLabel?: string;
  reminderText?: string;
  instanceId?: string | number;
}

export interface ScoreProposalReviewTaskVO {
  id: string | number;
  proposalId: string | number;
  deptId?: string | number;
  revisionNo?: number;
  stage: 'REVIEW' | 'CONFIRM';
  stageLabel?: string;
  assigneeUserId?: string | number;
  status?: string;
  deadline?: string;
  proposerName?: string;
  mainCategory?: string;
  subCategory?: string;
  taskTitle?: string;
  path?: string;
  createTime?: string;
}

export interface DepartmentReviewRuleVO {
  id: string | number;
  deptId?: string | number;
  taskType: Exclude<DepartmentTaskType, 'DAILY_REPORT'>;
  reviewerUserId?: string | number;
  reviewerName?: string;
  backupReviewerUserId?: string | number;
  backupReviewerName?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  status?: string;
  remark?: string;
}

export interface DepartmentReviewRuleForm {
  id?: string | number;
  taskType?: Exclude<DepartmentTaskType, 'DAILY_REPORT'>;
  reviewerUserId?: string | number;
  backupReviewerUserId?: string | number;
  effectiveStart?: string;
  effectiveEnd?: string;
  status?: string;
  remark?: string;
}
