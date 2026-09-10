import type { TagProps } from 'element-plus';
import type {
  CommunityPostType,
  CommunityReportStatus,
  DepartmentCommunityMediaVO,
  DepartmentCommunityPostVO
} from '@/api/department/community/types';

type CommunityUploadError = Error & { status: number; method: string; url: string };

/** 将任意上传异常转换为 Element Plus 上传组件可识别的错误结构。 */
export const toCommunityUploadError = (error: unknown): CommunityUploadError =>
  Object.assign(error instanceof Error ? error : new Error(String(error)), {
    status: 0,
    method: 'POST',
    url: ''
  });

/** 社区内容类型的展示配置，统一维护标签文案和颜色。 */
export const postTypeOptions = [
  { value: 'DISCUSSION', label: '讨论', type: 'primary' },
  { value: 'QUESTION', label: '问题求助', type: 'warning' },
  { value: 'EXPERIENCE', label: '经验分享', type: 'success' },
  { value: 'IMPROVEMENT', label: '改进想法', type: 'danger' }
] as const satisfies ReadonlyArray<{ value: CommunityPostType; label: string; type: NonNullable<TagProps['type']> }>;

const reportStatusLabels: Record<CommunityReportStatus, string> = {
  PENDING: '待处理',
  REJECTED: '已驳回',
  TAKEN_DOWN: '已下线'
};

const reportStatusTags: Record<CommunityReportStatus, NonNullable<TagProps['type']>> = {
  PENDING: 'warning',
  REJECTED: 'info',
  TAKEN_DOWN: 'danger'
};

/** 将用户输入的中英文逗号分隔标签转换为可渲染列表。 */
export const splitTags = (value?: string) => (value || '').split(/[，,]/).map(item => item.trim()).filter(Boolean);

/** 清理媒体 ID 字符串，过滤空值并保留原始顺序。 */
export const splitOssIds = (value?: string) => (value || '').split(',').map(item => item.trim()).filter(Boolean);

/** 用于比较编辑前后的媒体关系，去重并按 ID 排序。 */
export const normalizeOssIds = (value?: string) => [...new Set(splitOssIds(value))].toSorted().join(',');

/** 从富文本中的 oss 协议地址提取正文图片 ID，避免附件重复展示。 */
export const getContentOssIds = (value?: string) => Array.from(new Set(Array.from((value || '').matchAll(/oss:\/\/([\w-]+)/g), match => match[1])));

/** 返回帖子中未嵌入正文的附加媒体。 */
export const postAttachmentMedia = (post: DepartmentCommunityPostVO) => {
  const inlineIds = new Set(getContentOssIds(post.content));
  return (post.mediaList || []).filter(media => !inlineIds.has(String(media.ossId)));
};

/** 将富文本转换为列表摘要，保留换行语义但移除 HTML 标签。 */
export const postContentPreview = (value?: string) =>
  (value || '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** 信息流缩略图最多展示四张，其余媒体通过轮播查看。 */
export const mediaPreviewList = (mediaList?: DepartmentCommunityMediaVO[]) => (mediaList || []).slice(0, 4);

/** 将社区内容类型转换为页面标签文案。 */
export const postTypeLabel = (value?: CommunityPostType) => postTypeOptions.find(item => item.value === value)?.label || '讨论';

/** 将社区内容类型转换为 Element Plus 标签颜色。 */
export const postTypeTag = (value?: CommunityPostType): TagProps['type'] => postTypeOptions.find(item => item.value === value)?.type || 'info';

/** 将举报状态转换为用户可理解的处理文案。 */
export const reportStatusLabel = (value?: CommunityReportStatus) => (value ? reportStatusLabels[value] : undefined) || '未知';

/** 将举报状态转换为统一的风险提示颜色。 */
export const reportStatusTag = (value?: CommunityReportStatus): TagProps['type'] => (value ? reportStatusTags[value] : undefined) || 'info';
