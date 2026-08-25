<template>
  <div class="app-container department-document-page">
    <el-card shadow="never" class="document-hero">
      <div class="hero-content">
        <div>
          <span class="hero-kicker">DEPARTMENT KNOWLEDGE HUB</span>
          <h2>科室资料中心</h2>
          <p>统一沉淀制度规范、项目资料和系统运维文档，让每一份资料都能被找到、被追溯、被复用。</p>
        </div>
        <div class="hero-stats">
          <div><strong>{{ total }}</strong><span>{{ activeTab === 'recycle' ? '回收站资料' : '当前资料' }}</span></div>
          <div><strong>{{ categoryCount }}</strong><span>资料分类</span></div>
          <div><strong>{{ projectOptions.length }}</strong><span>关联项目</span></div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="document-card mt-2">
      <template #header>
        <DepartmentPanelHeader kicker="DOCUMENT LIBRARY" title="资料库" description="支持项目归档、版本管理和权限保护的科室资料空间。">
            <el-button v-hasPermi="['department:document:add']" type="primary" icon="Upload" @click="handleAdd">上传资料</el-button>
            <el-button v-hasPermi="['department:document:query']" plain icon="Refresh" @click="getList">刷新</el-button>
        </DepartmentPanelHeader>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="资料库" name="active" />
        <el-tab-pane label="回收站" name="recycle" />
      </el-tabs>

      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="关键词">
          <el-input v-model="queryParams.title" clearable placeholder="标题或标签" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="分类">
          <el-tree-select v-model="queryParams.categoryId" :data="categories" node-key="id" check-strictly clearable filterable style="width: 190px" :props="{ label: 'categoryName', children: 'children' }" placeholder="全部分类" />
        </el-form-item>
        <el-form-item label="项目">
          <el-select v-model="queryParams.projectId" clearable filterable placeholder="全部项目" style="width: 190px">
            <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryParams.fileSuffix" clearable placeholder="全部类型" style="width: 130px">
            <el-option v-for="item in fileTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <div class="query-actions">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </div>
      </el-form>

      <el-table v-loading="loading" border :data="documentList" class="document-table">
        <el-table-column label="资料名称" min-width="260" show-overflow-tooltip>
          <template #default="scope">
            <div class="title-cell">
              <div class="file-icon" :class="fileIconClass(scope.row.currentFileSuffix)">{{ fileIconText(scope.row.currentFileSuffix) }}</div>
              <div>
                <div class="document-title">{{ scope.row.title }}</div>
                <div class="document-file-name">{{ scope.row.currentOriginalName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" prop="categoryName" width="120" align="center" />
        <el-table-column label="关联项目" prop="projectName" min-width="160" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.projectName || '科室公共资料' }}</template>
        </el-table-column>
        <el-table-column label="版本" width="80" align="center">
          <template #default="scope">v{{ scope.row.versionNo || 1 }}</template>
        </el-table-column>
        <el-table-column label="大小" width="110" align="center">
          <template #default="scope">{{ formatFileSize(scope.row.currentFileSize) }}</template>
        </el-table-column>
        <el-table-column label="上传人" prop="createByName" width="110" align="center" />
        <el-table-column label="更新时间" prop="updateTime" width="165" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope"><el-tag :type="statusTagType(scope.row.status)" effect="light">{{ statusLabel(scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280" align="center">
          <template #default="scope">
            <template v-if="activeTab === 'active'">
              <el-button v-hasPermi="['department:document:query']" link type="primary" @click="handlePreview(toDocument(scope.row))">预览</el-button>
              <el-button v-hasPermi="['department:document:download']" link type="primary" @click="handleDownload(toDocument(scope.row))">下载</el-button>
              <el-button v-hasPermi="['department:document:query']" link type="primary" @click="handleDetail(toDocument(scope.row))">详情</el-button>
              <el-dropdown v-hasPermi="['department:document:edit']" @command="(command: string) => handleMoreCommand(command, toDocument(scope.row))">
                <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="version">上传新版本</el-dropdown-item>
                    <el-dropdown-item command="edit">编辑信息</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button v-hasPermi="['department:document:remove']" link type="danger" @click="handleDelete(toDocument(scope.row))">删除</el-button>
            </template>
            <template v-else>
              <el-button v-hasPermi="['department:document:restore']" link type="primary" @click="handleRestore(toDocument(scope.row))">恢复</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="editDialog.visible" :title="editDialog.title" width="620px" append-to-body>
      <el-form ref="editFormRef" :model="editForm" label-width="100px">
        <el-form-item label="资料标题" required><el-input v-model="editForm.title" maxlength="200" show-word-limit placeholder="请输入资料标题" /></el-form-item>
        <el-form-item label="资料分类" required>
          <el-tree-select v-model="editForm.categoryId" :data="categories" node-key="id" check-strictly filterable style="width: 100%" :props="{ label: 'categoryName', children: 'children' }" placeholder="请选择资料分类" />
        </el-form-item>
        <el-alert v-if="!categories.length" title="请先在“资料分类配置”中创建并启用分类" type="warning" :closable="false" show-icon />
        <el-form-item label="关联项目">
          <el-select v-model="editForm.projectId" clearable filterable placeholder="不关联项目" style="width: 100%">
            <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="资料状态">
          <el-radio-group v-model="editForm.status">
            <el-radio value="PUBLISHED">已发布</el-radio>
            <el-radio value="DRAFT">草稿</el-radio>
            <el-radio value="ARCHIVED">已归档</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="失效日期"><el-date-picker v-model="editForm.expireDate" type="date" value-format="YYYY-MM-DD" clearable style="width: 100%" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="editForm.tags" maxlength="500" placeholder="多个标签用逗号分隔" /></el-form-item>
        <el-form-item label="资料说明"><el-input v-model="editForm.description" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="补充资料用途、适用范围或注意事项" /></el-form-item>
        <el-form-item v-if="!editForm.id" label="选择文件" required>
          <el-upload drag :auto-upload="false" :limit="1" :file-list="editFileList" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z" :on-change="handleEditFileChange" :on-remove="clearEditFile">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到这里，或点击选择</div>
            <template #tip><div class="el-upload__tip">单个文件不超过 50MB，支持常见文档、图片和压缩包。</div></template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="buttonLoading" @click="submitEdit">保存</el-button><el-button @click="editDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="versionDialog.visible" title="上传资料新版本" width="520px" append-to-body>
      <div class="version-tip">当前版本：v{{ versionTarget?.versionNo || 1 }}，上传后将生成 v{{ (versionTarget?.versionNo || 1) + 1 }}。</div>
      <el-form label-width="90px">
        <el-form-item label="版本说明"><el-input v-model="versionForm.versionNote" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="说明本次版本的修改内容" /></el-form-item>
        <el-form-item label="新文件" required>
          <el-upload drag :auto-upload="false" :limit="1" :file-list="versionFileList" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z" :on-change="handleVersionFileChange" :on-remove="clearVersionFile">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">选择新版本文件</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="buttonLoading" @click="submitVersion">上传版本</el-button><el-button @click="versionDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailDialog.visible" title="资料详情" width="760px" append-to-body>
      <el-descriptions v-if="detailData" :column="2" border>
        <el-descriptions-item label="资料标题">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="资料分类">{{ detailData.categoryName }}</el-descriptions-item>
        <el-descriptions-item label="关联项目">{{ detailData.projectName || '科室公共资料' }}</el-descriptions-item>
        <el-descriptions-item label="当前版本">v{{ detailData.versionNo || 1 }}</el-descriptions-item>
        <el-descriptions-item label="当前文件" :span="2">{{ detailData.currentOriginalName }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">{{ detailData.tags || '—' }}</el-descriptions-item>
        <el-descriptions-item label="资料说明" :span="2"><div class="detail-description">{{ detailData.description || '—' }}</div></el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">版本记录</el-divider>
      <el-table v-loading="detailLoading" border :data="versions" size="small">
        <el-table-column label="版本" width="80" align="center"><template #default="scope">v{{ scope.row.versionNo }}</template></el-table-column>
        <el-table-column label="文件名" prop="originalName" min-width="220" show-overflow-tooltip />
        <el-table-column label="大小" width="100" align="center"><template #default="scope">{{ formatFileSize(scope.row.fileSize) }}</template></el-table-column>
        <el-table-column label="上传人" prop="createByName" width="100" align="center" />
        <el-table-column label="版本说明" prop="versionNote" min-width="160" show-overflow-tooltip />
        <el-table-column label="时间" prop="createTime" width="165" align="center" />
      </el-table>
      <template #footer><el-button @click="detailDialog.visible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="previewDialog.visible" :title="previewDialog.title" width="min(1000px, 90vw)" append-to-body destroy-on-close>
      <div v-loading="previewDialog.loading" class="preview-container">
        <img v-if="previewKind === 'image' && previewUrl" :src="previewUrl" alt="资料预览" class="preview-image" />
        <iframe v-else-if="previewKind === 'pdf' && previewUrl" :src="previewUrl" title="资料预览" class="preview-frame" />
        <el-empty v-else description="当前文件格式暂不支持页面内预览，请下载后查看" />
      </div>
      <template #footer><el-button v-if="previewDialog.row" type="primary" @click="handleDownload(previewDialog.row)">下载文件</el-button><el-button @click="closePreview">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DepartmentDocument">
import type { FormInstance, UploadFile, UploadFiles } from 'element-plus';
import { ArrowDown, UploadFilled } from '@element-plus/icons-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { listDepartmentDocumentCategoryOptions } from '@/api/department/documentCategory';
import type { DepartmentDocumentCategoryVO } from '@/api/department/documentCategory/types';
import { listDepartmentProjectOptions } from '@/api/department/project';
import type { DepartmentProjectVO } from '@/api/department/project/types';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import {
  delDepartmentDocument,
  downloadDepartmentDocument,
  getDepartmentDocument,
  listDepartmentDocument,
  listDepartmentDocumentRecycle,
  listDepartmentDocumentVersions,
  previewDepartmentDocument,
  restoreDepartmentDocument,
  updateDepartmentDocument,
  uploadDepartmentDocument,
  uploadDepartmentDocumentVersion
} from '@/api/department/document';
import type { DepartmentDocumentForm, DepartmentDocumentQuery, DepartmentDocumentVersionVO, DepartmentDocumentVO } from '@/api/department/document/types';
import modal from '@/plugins/modal';
import { saveBlob } from '@/utils/save';

const fileTypes = [
  { label: 'PDF', value: '.pdf' },
  { label: 'Word', value: '.docx' },
  { label: 'Excel', value: '.xlsx' },
  { label: 'PPT', value: '.pptx' },
  { label: '图片', value: '.png' }
];

const loading = ref(false);
const buttonLoading = ref(false);
const detailLoading = ref(false);
const activeTab = ref('active');
const documentList = ref<DepartmentDocumentVO[]>([]);
const categories = ref<DepartmentDocumentCategoryVO[]>([]);
const projectOptions = ref<DepartmentProjectVO[]>([]);
const total = ref(0);
const queryParams = reactive<DepartmentDocumentQuery>({ pageNum: 1, pageSize: 10, title: undefined, categoryId: undefined, projectId: undefined, fileSuffix: undefined, status: undefined });
const editForm = reactive<DepartmentDocumentForm>({ categoryId: undefined, status: 'PUBLISHED', visibility: 'DEPT' });
const editFile = ref<UploadFile>();
const editFileList = ref<any[]>([]);
const versionFile = ref<UploadFile>();
const versionFileList = ref<any[]>([]);
const versionForm = reactive({ versionNote: '' });
const versionTarget = ref<DepartmentDocumentVO>();
const detailData = ref<DepartmentDocumentVO>();
const versions = ref<DepartmentDocumentVersionVO[]>([]);
const editFormRef = ref<FormInstance>();
const editDialog = reactive({ visible: false, title: '' });
const versionDialog = reactive({ visible: false });
const detailDialog = reactive({ visible: false });
const previewDialog = reactive({ visible: false, loading: false, title: '', row: undefined as DepartmentDocumentVO | undefined });
const previewUrl = ref('');
const previewKind = ref<'image' | 'pdf' | 'none'>('none');

const categoryCount = computed(() => categories.value.length);
const toDocument = (row: unknown) => row as DepartmentDocumentVO;

const getList = async () => {
  loading.value = true;
  try {
    const res = activeTab.value === 'recycle' ? await listDepartmentDocumentRecycle(queryParams) : await listDepartmentDocument(queryParams);
    documentList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
};

const getProjectOptions = async () => {
  const res = await listDepartmentProjectOptions();
  projectOptions.value = res.data || [];
};

const getCategoryOptions = async () => {
  const res = await listDepartmentDocumentCategoryOptions();
  categories.value = res.data || [];
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  Object.assign(queryParams, { pageNum: 1, title: undefined, categoryId: undefined, projectId: undefined, fileSuffix: undefined, status: undefined });
  getList();
};

const handleTabChange = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetEdit = () => {
  Object.assign(editForm, { id: undefined, projectId: undefined, categoryId: categories.value[0]?.id, title: undefined, description: undefined, tags: undefined, visibility: 'DEPT', status: 'PUBLISHED', expireDate: undefined });
  editFile.value = undefined;
  editFileList.value = [];
  editFormRef.value?.resetFields();
};

const handleAdd = () => {
  resetEdit();
  editDialog.title = '上传科室资料';
  editDialog.visible = true;
};

const handleEdit = async (row: DepartmentDocumentVO) => {
  const res = await getDepartmentDocument(row.id);
  Object.assign(editForm, res.data);
  editFile.value = undefined;
  editFileList.value = [];
  editDialog.title = '编辑资料信息';
  editDialog.visible = true;
};

const handleEditFileChange = (file: UploadFile, files: UploadFiles) => {
  editFile.value = file;
  editFileList.value = files.slice(-1);
};

const clearEditFile = () => {
  editFile.value = undefined;
  editFileList.value = [];
};

const appendIfPresent = (data: FormData, key: string, value: unknown) => {
  if (value !== undefined && value !== null && value !== '') data.append(key, String(value));
};

const submitEdit = async () => {
  if (!editForm.title?.trim()) return modal.msgWarning('请输入资料标题');
  if (!editForm.categoryId) return modal.msgWarning(categories.value.length ? '请选择资料分类' : '请先在“资料分类配置”中创建并启用分类');
  buttonLoading.value = true;
  try {
    if (editForm.id) {
      await updateDepartmentDocument(editForm);
    } else {
      if (!editFile.value?.raw) return modal.msgWarning('请选择要上传的文件');
      const data = new FormData();
      appendIfPresent(data, 'title', editForm.title);
      appendIfPresent(data, 'categoryId', editForm.categoryId);
      appendIfPresent(data, 'projectId', editForm.projectId);
      appendIfPresent(data, 'description', editForm.description);
      appendIfPresent(data, 'tags', editForm.tags);
      appendIfPresent(data, 'visibility', editForm.visibility);
      appendIfPresent(data, 'status', editForm.status);
      appendIfPresent(data, 'expireDate', editForm.expireDate);
      data.append('file', editFile.value.raw);
      await uploadDepartmentDocument(data);
    }
    modal.msgSuccess(editForm.id ? '资料信息已更新' : '资料上传成功');
    editDialog.visible = false;
    await getList();
  } finally {
    buttonLoading.value = false;
  }
};

const handleMoreCommand = (command: string, row: DepartmentDocumentVO) => {
  if (command === 'version') handleVersion(row);
  if (command === 'edit') handleEdit(row);
};

const handleDetail = async (row: DepartmentDocumentVO) => {
  detailLoading.value = true;
  detailDialog.visible = true;
  try {
    const [detailRes, versionRes] = await Promise.all([getDepartmentDocument(row.id), listDepartmentDocumentVersions(row.id)]);
    detailData.value = detailRes.data;
    versions.value = versionRes.data || [];
  } finally {
    detailLoading.value = false;
  }
};

const handleVersion = (row: DepartmentDocumentVO) => {
  versionTarget.value = row;
  versionForm.versionNote = '';
  versionFile.value = undefined;
  versionFileList.value = [];
  versionDialog.visible = true;
};

const handleVersionFileChange = (file: UploadFile, files: UploadFiles) => {
  versionFile.value = file;
  versionFileList.value = files.slice(-1);
};

const clearVersionFile = () => {
  versionFile.value = undefined;
  versionFileList.value = [];
};

const submitVersion = async () => {
  if (!versionTarget.value || !versionFile.value?.raw) return modal.msgWarning('请选择新版本文件');
  buttonLoading.value = true;
  try {
    const data = new FormData();
    appendIfPresent(data, 'versionNote', versionForm.versionNote);
    data.append('file', versionFile.value.raw);
    await uploadDepartmentDocumentVersion(versionTarget.value.id, data);
    modal.msgSuccess('新版本上传成功');
    versionDialog.visible = false;
    await getList();
  } finally {
    buttonLoading.value = false;
  }
};

const handleDelete = async (row: DepartmentDocumentVO) => {
  await modal.confirm(`确认将资料“${row.title}”移入回收站吗？`);
  await delDepartmentDocument(row.id);
  modal.msgSuccess('资料已移入回收站');
  await getList();
};

const handleRestore = async (row: DepartmentDocumentVO) => {
  await modal.confirm(`确认恢复资料“${row.title}”吗？`);
  await restoreDepartmentDocument(row.id);
  modal.msgSuccess('资料已恢复');
  await getList();
};

const handleDownload = async (row: DepartmentDocumentVO) => {
  const blob = await downloadDepartmentDocument(row.id);
  saveBlob(blob, row.currentOriginalName || `${row.title}${row.currentFileSuffix || ''}`);
};

const handlePreview = async (row: DepartmentDocumentVO) => {
  const suffix = (row.currentFileSuffix || '').toLowerCase();
  previewKind.value = suffix === '.pdf' ? 'pdf' : ['.jpg', '.jpeg', '.png', '.gif'].includes(suffix) ? 'image' : 'none';
  previewDialog.title = `预览：${row.title}`;
  previewDialog.row = row;
  previewDialog.visible = true;
  previewDialog.loading = true;
  previewUrl.value = '';
  try {
    if (previewKind.value !== 'none') {
      const blob = await previewDepartmentDocument(row.id);
      previewUrl.value = URL.createObjectURL(blob);
    }
  } finally {
    previewDialog.loading = false;
  }
};

const closePreview = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = '';
  previewDialog.visible = false;
};

const formatFileSize = (size?: number) => {
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const statusLabel = (status?: string) => ({ DRAFT: '草稿', ARCHIVED: '已归档', PUBLISHED: '已发布' })[status || ''] || '已发布';
const statusTagType = (status?: string) => (status === 'DRAFT' ? 'warning' : status === 'ARCHIVED' ? 'info' : 'success');
const fileIconText = (suffix?: string) => (suffix || '').replace('.', '').slice(0, 4).toUpperCase() || 'FILE';
const fileIconClass = (suffix?: string) => {
  const value = (suffix || '').toLowerCase();
  if (value === '.pdf') return 'pdf';
  if (['.doc', '.docx'].includes(value)) return 'word';
  if (['.xls', '.xlsx', '.csv'].includes(value)) return 'excel';
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(value)) return 'image';
  return 'other';
};

onMounted(() => {
  getCategoryOptions();
  getProjectOptions();
  getList();
});
</script>

<style scoped lang="scss">
.department-document-page {
  .document-hero { border: 0; background: linear-gradient(135deg, #12233d 0%, #1e4d75 52%, #228b9b 100%); color: #fff; }
  .hero-content { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .hero-content { min-height: 126px; padding: 4px 8px; }
  .hero-kicker { letter-spacing: 0.14em; font-size: 12px; font-weight: 700; }
  .hero-kicker { color: #8ddcf0; }
  h2 { margin: 10px 0 8px; font-size: 28px; }
  h3 { margin: 4px 0; }
  .hero-content p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
  .hero-content p { color: rgba(255, 255, 255, 0.72); max-width: 660px; }
  .hero-stats { display: flex; gap: 34px; padding-right: 14px; }
  .hero-stats div { min-width: 74px; text-align: center; }
  .hero-stats strong, .hero-stats span { display: block; }
  .hero-stats strong { font-size: 28px; line-height: 1.15; }
  .hero-stats span { margin-top: 8px; color: rgba(255, 255, 255, 0.66); font-size: 12px; }
  .document-card { border-radius: 12px; }
  .toolbar-actions, .query-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .query-form { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 10px; margin-bottom: 16px; padding: 14px 16px 2px; border-radius: 10px; background: var(--el-fill-color-light); }
  .query-actions { margin-left: auto; margin-bottom: 18px; }
  .title-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .file-icon { display: inline-flex; flex: 0 0 42px; align-items: center; justify-content: center; width: 42px; height: 46px; border-radius: 10px; color: #fff; font-size: 10px; font-weight: 800; }
  .file-icon.pdf { background: linear-gradient(135deg, #ef5757, #b72745); }
  .file-icon.word { background: linear-gradient(135deg, #3b82f6, #2554ae); }
  .file-icon.excel { background: linear-gradient(135deg, #23a86c, #15744d); }
  .file-icon.image { background: linear-gradient(135deg, #9b7af5, #6351b9); }
  .file-icon.other { background: linear-gradient(135deg, #76869a, #445064); }
  .document-title, .document-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .document-title { color: var(--el-text-color-primary); font-weight: 600; }
  .document-file-name { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
  .version-tip { margin-bottom: 18px; padding: 12px 14px; border-radius: 8px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
  .detail-description { white-space: pre-wrap; line-height: 1.7; }
  .preview-container { display: flex; align-items: center; justify-content: center; min-height: 420px; max-height: 70vh; overflow: auto; background: var(--el-fill-color-light); }
  .preview-image { max-width: 100%; max-height: 66vh; object-fit: contain; }
  .preview-frame { width: 100%; height: 66vh; border: 0; background: #fff; }
  @media (max-width: 900px) {
    .hero-content { align-items: flex-start; flex-direction: column; }
    .hero-stats { width: 100%; justify-content: space-between; padding-right: 0; }
    .query-actions { margin-left: 0; }
  }
}
</style>
