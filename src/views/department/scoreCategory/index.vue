<template>
  <div class="p-2 app-container department-score-category-page">
    <UiCard shadow="hover" class="table-panel">
      <template #header>
        <DepartmentPanelHeader kicker="SCORE CATEGORY" title="SCORE分类配置" description="所有科室共用同一套提案大类和小类，停用分类不会影响历史提案。">
          <UiButton v-hasPermi="['department:scoreCategory:add']" type="primary" @click="handleAddMain"><el-icon><Plus /></el-icon>新增提案大类</UiButton>
        </DepartmentPanelHeader>
      </template>

      <DepartmentDataTable
        :loading="loading"
        row-key="id"
        border
        :data="categoryTree"
        default-expand-all
        :tree-props="{ children: 'children' }"
      >
        <el-table-column label="分类名称" prop="categoryName" min-width="240" show-overflow-tooltip />
        <el-table-column label="层级" width="100" align="center">
          <template #default="scope">{{ scope.row.categoryLevel === 1 ? '提案大类' : '提案小类' }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope"><UiTag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">{{ statusLabel(scope.row.status) }}</UiTag></template>
        </el-table-column>
        <el-table-column label="使用提案数" prop="proposalCount" width="110" align="center" />
        <el-table-column label="排序" prop="sortNum" width="90" align="center" />
        <el-table-column label="备注" prop="remark" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="240" align="center">
          <template #default="scope">
            <DepartmentTableActions>
              <UiButton v-if="scope.row.categoryLevel === 1" v-hasPermi="['department:scoreCategory:add']" link type="success" @click="handleAddSub(asScoreCategoryRow(scope.row))"><el-icon><Plus /></el-icon>新增小类</UiButton>
              <UiButton v-hasPermi="['department:scoreCategory:edit']" link type="primary" @click="handleUpdate(asScoreCategoryRow(scope.row))"><el-icon><Edit /></el-icon>编辑</UiButton>
              <UiButton v-hasPermi="['department:scoreCategory:remove']" link type="danger" @click="handleDelete(asScoreCategoryRow(scope.row))"><el-icon><Delete /></el-icon></UiButton>
            </DepartmentTableActions>
          </template>
        </el-table-column>
      </DepartmentDataTable>
      <UiEmpty v-if="!loading && categoryTree.length === 0" description="暂无分类，请先新增提案大类" />
    </UiCard>

    <UiDialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类层级"><UiTag>{{ form.parentId ? `提案小类（${dialog.parentName}）` : '提案大类' }}</UiTag></el-form-item>
        <el-form-item label="分类名称" prop="categoryName"><UiInput v-model="form.categoryName" :maxlength="500" show-word-limit placeholder="请输入分类名称（支持印尼文+中文）" /></el-form-item>
        <el-form-item label="状态">
          <UiRadioGroup v-model="form.status" :options="statusOptions" />
        </el-form-item>
        <el-form-item label="排序号"><UiNumberInput v-model="form.sortNum" :min="0" :max="9999" /></el-form-item>
        <el-form-item label="备注"><UiTextarea v-model="form.remark" :rows="3" :maxlength="500" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><UiButton type="primary" :loading="buttonLoading" @click="submitForm">保存</UiButton><UiButton @click="dialog.visible = false">取消</UiButton></template>
    </UiDialog>
  </div>
</template>

<script setup name="DepartmentScoreCategory" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Delete, Edit, Plus } from '@element-plus/icons-vue';
import { addScoreCategory, delScoreCategory, listScoreCategory, updateScoreCategory } from '@/api/department/scoreCategory';
import type { ScoreCategoryForm, ScoreCategoryVO } from '@/api/department/scoreCategory/types';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import { UiButton, UiCard, UiDialog, UiEmpty, UiInput, UiNumberInput, UiRadioGroup, UiTag, UiTextarea } from '@/components/UiKit';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';

const { loading, withLoading } = useLoading(true);
const categoryTree = ref<ScoreCategoryVO[]>([]);
const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const form = reactive<ScoreCategoryForm>({ parentId: 0, categoryName: '', status: 'ENABLED', sortNum: 0 });
const dialog = reactive({ visible: false, title: '', parentName: '' });
const rules = { categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] };
const statusOptions = [
  { value: 'ENABLED', label: '启用' },
  { value: 'DISABLED', label: '停用' }
] as const;

const statusLabel = (status?: string) => (status === 'DISABLED' ? '停用' : '启用');
/** 分类表格使用树行插槽，统一在动作入口恢复分类领域类型。 */
const asScoreCategoryRow = (row: unknown): ScoreCategoryVO => row as ScoreCategoryVO;

const getList = async () => {
  await withLoading(async () => {
    const res = await listScoreCategory();
    categoryTree.value = res.data || [];
  });
};

const resetForm = () => {
  Object.assign(form, { id: undefined, parentId: 0, categoryName: '', status: 'ENABLED', sortNum: 0, remark: undefined });
  dialog.parentName = '';
  formRef.value?.resetFields();
};

const handleAddMain = () => {
  resetForm();
  dialog.title = '新增提案大类';
  dialog.visible = true;
};

const handleAddSub = (row: ScoreCategoryVO) => {
  resetForm();
  form.parentId = row.id;
  dialog.parentName = row.categoryName;
  dialog.title = `新增小类（${row.categoryName}）`;
  dialog.visible = true;
};

const handleUpdate = (row: ScoreCategoryVO) => {
  resetForm();
  Object.assign(form, { id: row.id, parentId: row.parentId || 0, categoryName: row.categoryName, status: row.status, sortNum: row.sortNum || 0, remark: row.remark });
  dialog.parentName = row.parentId ? findParentName(row.parentId) : '';
  dialog.title = row.categoryLevel === 1 ? '编辑提案大类' : '编辑提案小类';
  dialog.visible = true;
};

const findParentName = (parentId: string | number) => categoryTree.value.find((item) => String(item.id) === String(parentId))?.categoryName || '';

const submitForm = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      if (form.id) await updateScoreCategory(form);
      else await addScoreCategory(form);
      modal.msgSuccess('保存成功');
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleDelete = async (row: ScoreCategoryVO) => {
  await modal.confirm(`确认删除分类“${row.categoryName}”吗？已使用的分类只能停用。`);
  await delScoreCategory(row.id);
  modal.msgSuccess('删除成功');
  await getList();
};

onMounted(getList);
</script>
