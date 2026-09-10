/** 社区信息流的排序范围。 */
export type CommunityFeed = 'HOT' | 'LATEST' | 'MINE';

/** 社区帖子的内容类型。 */
export type CommunityPostType = 'DISCUSSION' | 'QUESTION' | 'EXPERIENCE' | 'IMPROVEMENT';

/** 社区帖子的业务状态。 */
export type CommunityPostStatus = 'DRAFT' | 'PUBLISHED' | 'RESOLVED' | 'ARCHIVED';

/** 社区帖子的可见范围。 */
export type CommunityVisibility = 'ALL' | 'DEPT';

/** 社区评论的展示状态。 */
export type CommunityCommentStatus = 'ENABLED' | 'DISABLED';

/** 社区互动类型。 */
export type CommunityReactionType = 'LIKE' | 'FAVORITE';

/** 社区举报的处理状态。 */
export type CommunityReportStatus = 'PENDING' | 'REJECTED' | 'TAKEN_DOWN';

export interface DepartmentCommunityQuery extends PageQuery {
  keyword?: string;
  postType?: CommunityPostType;
  tag?: string;
  feed?: CommunityFeed;
}

export interface DepartmentCommunityPostVO {
  id: string | number;
  title: string;
  subtitle?: string;
  content: string;
  postType: CommunityPostType;
  tags?: string;
  visibility?: CommunityVisibility;
  deptId?: string | number;
  deptName?: string;
  authorName?: string;
  /** 作者头像对应的 OSS ID，需通过登录态预览。 */
  authorAvatar?: string | number;
  status?: CommunityPostStatus;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  favoriteCount?: number;
  acceptedCommentId?: string | number;
  liked?: boolean;
  favorited?: boolean;
  mine?: boolean;
  mediaCount?: number;
  mediaList?: DepartmentCommunityMediaVO[];
  createTime?: string;
  updateTime?: string;
}

export interface DepartmentCommunityPostForm {
  id?: string | number;
  title?: string;
  subtitle?: string;
  content?: string;
  postType?: CommunityPostType;
  tags?: string;
  visibility?: CommunityVisibility;
  status?: CommunityPostStatus;
  mediaOssIds?: string;
}

export interface DepartmentCommunityMediaVO {
  id?: string | number;
  postId?: string | number;
  commentId?: string | number;
  ossId: string | number;
  mediaType: 'IMAGE' | 'VIDEO';
  fileName?: string;
  fileSuffix?: string;
  contentType?: string;
  fileSize?: number;
  sortNum?: number;
  previewUrl?: string;
}

export interface DepartmentCommunityCommentVO {
  id: string | number;
  postId: string | number;
  parentId?: string | number;
  content: string;
  authorName?: string;
  /** 作者头像对应的 OSS ID，需通过登录态预览。 */
  authorAvatar?: string | number;
  deptName?: string;
  status?: CommunityCommentStatus;
  mine?: boolean;
  createTime?: string;
  mediaList?: DepartmentCommunityMediaVO[];
}

export interface DepartmentCommunityCommentForm {
  content?: string;
  parentId?: string | number;
  mediaOssIds?: string;
}

export interface DepartmentCommunityReactionVO {
  liked: boolean;
  favorited: boolean;
  likeCount: number;
  favoriteCount: number;
}

export interface DepartmentCommunityReportForm {
  id?: string | number;
  reason?: string;
  status?: CommunityReportStatus;
  handleNote?: string;
}

export interface DepartmentCommunityReportQuery extends PageQuery {
  status?: CommunityReportStatus;
}

export interface DepartmentCommunityReportVO {
  id: string | number;
  postId: string | number;
  postTitle?: string;
  reporterName?: string;
  reason?: string;
  status?: CommunityReportStatus;
  handledByName?: string;
  handleNote?: string;
  createTime?: string;
  handledAt?: string;
}
