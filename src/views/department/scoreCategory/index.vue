<template>
  <div class="p-2 app-container department-score-category-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">SCORE CATEGORY</span>
            <h3>SCORE分类配置</h3>
            <p>所有科室共用同一套提案大类和小类，停用分类不会影响历史提案。</p>
          </div>
          <el-button v-hasPermi="['department:scoreCategory:add']" type="primary" icon="Plus" @click="handleAddMain">新增提案大类</el-button>
        </div>
      </template>

      <el-table v-loading="loading" row-key="id" border :data="categoryTree" default-expand-all>
        <el-table-column label="分类名称" prop="categoryName" min-width="240" show-overflow-tooltip />
        <el-table-column label="层级" width="100" align="center">
          <template #default="scope">{{ scope.row.categoryLevel === 1 ? '提案大类' : '提案小类' }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope"><el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">{{ statusLabel(scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="使用提案数" prop="proposalCount" width="110" align="center" />
        <el-table-column label="排序" prop="sortNum" width="90" align="center" />
        <el-table-column label="备注" prop="remark" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="240" align="center">
          <template #default="scope">
            <el-button v-if="scope.row.categoryLevel === 1" v-hasPermi="['department:scoreCategory:add']" link type="success" icon="Plus" @click="handleAddSub(scope.row)">新增小类</el-button>
            <el-button v-hasPermi="['department:scoreCategory:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['department:scoreCategory:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && categoryTree.length === 0" description="暂无分类，请先新增提案大类" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类层级"><el-tag>{{ form.parentId ? `提案小类（${dialog.parentName}）` : '提案大类' }}</el-tag></el-form-item>
        <el-form-item label="分类名称" prop="categoryName"><el-input v-model="form.categoryName" maxlength="500" show-word-limit placeholder="请输入分类名称（支持印尼文+中文）" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status"><el-radio label="ENABLED">启用</el-radio><el-radio label="DISABLED">停用</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="排序号"><el-input-number v-model="form.sortNum" :min="0" :max="9999" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="buttonLoading" @click="submitForm">保存</el-button><el-button @click="dialog.visible = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentScoreCategory" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { addScoreCategory, delScoreCategory, listScoreCategory, updateScoreCategory } from '@/api/department/scoreCategory';
import type { ScoreCategoryForm, ScoreCategoryVO } from '@/api/department/scoreCategory/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';

const { loading, withLoading } = useLoading(true);
const categoryTree = ref<ScoreCategoryVO[]>([]);
const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const form = reactive<ScoreCategoryForm>({ parentId: 0, categoryName: '', status: 'ENABLED', sortNum: 0 });
const dialog = reactive({ visible: false, title: '', parentName: '' });
const rules = { categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] };

const statusLabel = (status?: string) => (status === 'DISABLED' ? '停用' : '启用');

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

<style scoped lang="scss">
.department-score-category-page {
  .toolbar-shell { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .table-heading h3 { margin: 4px 0; }
  .table-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
  @media (max-width: 700px) { .toolbar-shell { align-items: flex-start; flex-direction: column; } }
}
</style>
