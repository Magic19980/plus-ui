<template>
  <div class="p-2 app-container department-document-category-page">
    <el-card shadow="never" class="table-panel">
      <template #header>
        <DepartmentPanelHeader kicker="DOCUMENT CATEGORY" title="资料分类配置" description="按科室维护多级资料分类，资料库只显示本部门已启用的分类。">
          <el-button v-hasPermi="['department:documentCategory:add']" type="primary" icon="Plus" @click="handleAdd">新增顶级分类</el-button>
        </DepartmentPanelHeader>
      </template>

      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="分类名称">
          <el-input v-model="queryParams.categoryName" clearable placeholder="请输入分类名称" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="启用" value="ENABLED" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <div class="query-actions">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </div>
      </el-form>

      <el-table v-loading="loading" row-key="id" border default-expand-all :data="categoryList" :tree-props="{ children: 'children' }">
        <el-table-column label="分类名称" prop="categoryName" min-width="220" show-overflow-tooltip />
        <el-table-column label="层级" width="110" align="center">
          <template #default="scope">{{ scope.row.parentId ? '子分类' : '顶级分类' }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="110" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortNum" width="90" align="center" />
        <el-table-column label="资料数" prop="documentCount" width="100" align="center" />
        <el-table-column label="备注" prop="remark" min-width="260" show-overflow-tooltip />
        <el-table-column label="更新时间" prop="updateTime" width="170" align="center" />
        <el-table-column label="操作" fixed="right" width="250" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:documentCategory:add']" link type="success" icon="Plus" @click="handleAddChild(toCategory(scope.row))">新增子分类</el-button>
            <el-button v-hasPermi="['department:documentCategory:edit']" link type="primary" icon="Edit" @click="handleUpdate(toCategory(scope.row))">编辑</el-button>
            <el-button v-hasPermi="['department:documentCategory:remove']" link type="danger" icon="Delete" @click="handleDelete(toCategory(scope.row))">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && categoryList.length === 0" description="暂无资料分类，请先新增分类" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级分类">
          <el-tree-select v-model="form.parentId" :data="parentOptions" node-key="id" check-strictly clearable style="width: 100%" :props="{ label: 'categoryName', children: 'children' }" placeholder="不选择则为顶级分类" />
        </el-form-item>
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="form.categoryName" maxlength="100" show-word-limit placeholder="例如：制度规范、培训资料、项目交付物" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="ENABLED">启用</el-radio>
            <el-radio value="DISABLED">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sortNum" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="补充该分类的适用范围" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="buttonLoading" @click="submitForm">保存</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DepartmentDocumentCategory">
import type { FormInstance } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import {
  addDepartmentDocumentCategory,
  delDepartmentDocumentCategory,
  listDepartmentDocumentCategoryTree,
  updateDepartmentDocumentCategory
} from '@/api/department/documentCategory';
import type { DepartmentDocumentCategoryForm, DepartmentDocumentCategoryQuery, DepartmentDocumentCategoryVO } from '@/api/department/documentCategory/types';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import modal from '@/plugins/modal';

const loading = ref(false);
const buttonLoading = ref(false);
const categoryList = ref<DepartmentDocumentCategoryVO[]>([]);
const queryParams = reactive<DepartmentDocumentCategoryQuery>({ pageNum: 1, pageSize: 10, categoryName: undefined, status: undefined });
const form = reactive<DepartmentDocumentCategoryForm>({ parentId: 0, categoryName: '', status: 'ENABLED', sortNum: 0, remark: undefined });
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const rules = { categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] };
const toCategory = (row: unknown) => row as DepartmentDocumentCategoryVO;

const pruneTree = (nodes: DepartmentDocumentCategoryVO[], excludedId?: string | number): DepartmentDocumentCategoryVO[] => {
  return nodes
    .filter((node) => String(node.id) !== String(excludedId))
    .map((node) => ({ ...node, children: node.children ? pruneTree(node.children, excludedId) : [] }));
};

const parentOptions = computed(() => pruneTree(categoryList.value, form.id));

const statusLabel = (status?: string) => (status === 'DISABLED' ? '停用' : '启用');

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDepartmentDocumentCategoryTree({ categoryName: queryParams.categoryName, status: queryParams.status });
    categoryList.value = Array.isArray(res.data) ? res.data : [];
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  Object.assign(queryParams, { pageNum: 1, categoryName: undefined, status: undefined });
  getList();
};

const resetForm = () => {
  Object.assign(form, { id: undefined, parentId: 0, categoryName: '', status: 'ENABLED', sortNum: 0, remark: undefined });
  formRef.value?.resetFields();
};

const handleAdd = () => {
  resetForm();
  dialog.title = '新增资料分类';
  dialog.visible = true;
};

const handleAddChild = (row: DepartmentDocumentCategoryVO) => {
  resetForm();
  form.parentId = row.id;
  dialog.title = `新增子分类（${row.categoryName}）`;
  dialog.visible = true;
};

const handleUpdate = (row: DepartmentDocumentCategoryVO) => {
  resetForm();
  Object.assign(form, { id: row.id, parentId: row.parentId || 0, categoryName: row.categoryName, status: row.status, sortNum: row.sortNum || 0, remark: row.remark });
  dialog.title = '编辑资料分类';
  dialog.visible = true;
};

const submitForm = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      if (form.id) await updateDepartmentDocumentCategory(form);
      else await addDepartmentDocumentCategory(form);
      modal.msgSuccess('保存成功');
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleDelete = async (row: DepartmentDocumentCategoryVO) => {
  await modal.confirm(`确认删除分类“${row.categoryName}”吗？有子分类或已被资料使用的分类不能删除。`);
  await delDepartmentDocumentCategory(row.id);
  modal.msgSuccess('删除成功');
  await getList();
};

onMounted(getList);
</script>

<style scoped lang="scss">
.department-document-category-page {
  .query-form { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 12px; margin-bottom: 16px; padding: 14px 16px 2px; border-radius: 10px; background: var(--el-fill-color-light); }
  .query-actions { display: flex; gap: 8px; margin-left: auto; margin-bottom: 18px; }
  @media (max-width: 700px) {
    .query-actions { margin-left: 0; }
  }
}
</style>
