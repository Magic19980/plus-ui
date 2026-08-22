export interface ScoreCategoryVO {
  id: string | number;
  parentId?: string | number;
  categoryName: string;
  categoryLevel: number;
  sortNum?: number;
  status: string;
  remark?: string;
  proposalCount?: number;
  createTime?: string;
  updateTime?: string;
  children?: ScoreCategoryVO[];
}

export interface ScoreCategoryForm {
  id?: string | number;
  parentId?: string | number;
  categoryName: string;
  sortNum?: number;
  status?: string;
  remark?: string;
}
