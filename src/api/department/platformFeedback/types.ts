export type PlatformFeedbackFeed = 'ALL' | 'MINE' | 'TODO' | 'FOLLOWING';

export interface PlatformFeedbackQuery extends PageQuery {
  keyword?: string;
  feedbackType?: string;
  priority?: string;
  status?: string;
  moduleName?: string;
  assigneeId?: string | number;
  feed?: PlatformFeedbackFeed;
}

export interface PlatformFeedbackForm {
  feedbackType: string;
  title: string;
  description: string;
  moduleName?: string;
  pageTitle?: string;
  pagePath?: string;
  businessRef?: string;
  reproduceSteps?: string;
  expectedResult?: string;
  actualResult?: string;
  impactScope?: string;
  priority?: string;
  attachmentOssIds?: string;
}

export interface PlatformFeedbackProcessForm {
  id: string | number;
  status?: string;
  note?: string;
}

export interface PlatformFeedbackCommentForm {
  content: string;
}

export interface PlatformFeedbackAttachmentVO {
  ossId: string | number;
  originalName?: string;
  fileSuffix?: string;
  fileSize?: number;
  url?: string;
}

export interface PlatformFeedbackActivityVO {
  id: string | number;
  actionType?: string;
  actionNote?: string;
  fromStatus?: string;
  toStatus?: string;
  operatorName?: string;
  createTime?: string;
}

export interface PlatformFeedbackCommentVO {
  id: string | number;
  feedbackId: string | number;
  content: string;
  authorName?: string;
  deptName?: string;
  mine?: boolean;
  createTime?: string;
}

export interface PlatformFeedbackUserOptionVO {
  userId: string | number;
  userName?: string;
  deptId?: string | number;
  deptName?: string;
}

export interface PlatformFeedbackSummaryVO {
  totalCount: number;
  pendingCount: number;
  processingCount: number;
  waitingCount: number;
  closedCount: number;
  suggestionCount: number;
}

export interface PlatformFeedbackVO extends PlatformFeedbackForm {
  id: string | number;
  feedbackNo?: string;
  status?: string;
  assigneeId?: string | number;
  assigneeName?: string;
  assigneeDeptName?: string;
  reporterName?: string;
  reporterDeptName?: string;
  createBy?: string | number;
  resolutionNote?: string;
  closedAt?: string;
  createTime?: string;
  updateTime?: string;
  mine?: boolean;
  assignedToMe?: boolean;
  processAllowed?: boolean;
  attachments?: PlatformFeedbackAttachmentVO[];
  activities?: PlatformFeedbackActivityVO[];
}
