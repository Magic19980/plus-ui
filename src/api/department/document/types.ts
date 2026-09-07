export interface DepartmentDocumentQuery extends PageQuery {
  title?: string;
  categoryId?: string | number;
  projectId?: string | number;
  fileSuffix?: string;
  status?: string;
  sortBy?: 'updatedDesc' | 'updatedAsc' | 'nameAsc' | 'sizeDesc';
}

export interface DepartmentDocumentVO {
  id: string | number;
  deptId?: string | number;
  projectId?: string | number;
  projectName?: string;
  categoryId: string | number;
  categoryName: string;
  title: string;
  description?: string;
  tags?: string;
  visibility?: string;
  status?: string;
  expireDate?: string;
  currentVersionId?: string | number;
  versionNo?: number;
  currentOssId?: string | number;
  currentOriginalName?: string;
  currentFileSuffix?: string;
  currentFileSize?: number;
  currentContentType?: string;
  createByName?: string;
  createTime?: string;
  updateTime?: string;
}

export interface DepartmentDocumentForm {
  id?: string | number;
  projectId?: string | number;
  categoryId?: string | number;
  title?: string;
  description?: string;
  tags?: string;
  visibility?: string;
  status?: string;
  expireDate?: string;
}

export interface DepartmentDocumentVersionVO {
  id: string | number;
  documentId: string | number;
  versionNo: number;
  ossId: string | number;
  originalName: string;
  fileSuffix?: string;
  fileSize?: number;
  contentType?: string;
  versionNote?: string;
  createByName?: string;
  createTime?: string;
}

export interface DepartmentDocumentVideoPreviewVO {
  documentId: string | number;
  versionId?: string | number;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  playbackUrl: string;
}
