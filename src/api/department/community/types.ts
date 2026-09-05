import type { PageQuery } from '@/api/types';

export interface DepartmentCommunityQuery extends PageQuery {
  keyword?: string;
  postType?: string;
  tag?: string;
  feed?: string;
}

export interface DepartmentCommunityPostVO {
  id: string | number;
  title: string;
  content: string;
  postType: string;
  tags?: string;
  visibility?: string;
  deptId?: string | number;
  deptName?: string;
  authorName?: string;
  status?: string;
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
  content?: string;
  postType?: string;
  tags?: string;
  visibility?: string;
  status?: string;
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
  deptName?: string;
  status?: string;
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
  status?: string;
  handleNote?: string;
}

export interface DepartmentCommunityReportQuery extends PageQuery {
  status?: string;
}

export interface DepartmentCommunityReportVO {
  id: string | number;
  postId: string | number;
  postTitle?: string;
  reporterName?: string;
  reason?: string;
  status?: string;
  handledByName?: string;
  handleNote?: string;
  createTime?: string;
  handledAt?: string;
}
