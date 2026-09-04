<template>
  <el-dialog
    v-model="visible"
    :title="preview.fileName || fileName || '附件预览'"
    width="1000px"
    append-to-body
    destroy-on-close
    class="attachment-preview-dialog"
  >
    <el-alert v-if="preview.message" :title="preview.message" type="info" :closable="false" class="mb-3" />
    <div v-loading="preview.loading" class="attachment-preview-content">
      <el-table v-if="!preview.loading && preview.previewType === 'TABLE'" :data="preview.rows" border stripe max-height="560px">
        <el-table-column label="行号" width="72" fixed="left" align="center">
          <template #default="scope">{{ preview.rowNumbers[scope.$index] }}</template>
        </el-table-column>
        <el-table-column
          v-for="(label, index) in preview.columnLabels"
          :key="`${label}-${index}`"
          :label="label"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="scope">{{ scope.row[index] || '—' }}</template>
        </el-table-column>
      </el-table>
      <el-empty
        v-else-if="!preview.loading"
        :description="preview.message || '当前附件暂不支持在线预览，请下载后查看'"
      />
    </div>
    <template #footer>
      <el-button v-if="ossId" plain @click="downloadAttachment">下载附件</el-button>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import modal from '@/plugins/modal';
import { previewOaApplicationAttachment } from '@/api/ecology';
import type { OaAttachmentPreviewVO } from '@/api/ecology/types';
import { download as requestDownload } from '@/utils/request';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  ossId?: string | number;
  fileName?: string;
  previewLoader?: () => Promise<OaAttachmentPreviewVO>;
}>(), {
  ossId: undefined,
  fileName: '',
  previewLoader: undefined
});

const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>();
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});
const preview = reactive<{
  loading: boolean;
  previewType?: string;
  message?: string;
  fileName?: string;
  columnLabels: string[];
  rowNumbers: number[];
  rows: string[][];
}>({ loading: false, columnLabels: [], rowNumbers: [], rows: [] });

const reset = () => {
  preview.loading = false;
  preview.previewType = undefined;
  preview.message = '';
  preview.fileName = '';
  preview.columnLabels = [];
  preview.rowNumbers = [];
  preview.rows = [];
};

const loadPreview = async () => {
  reset();
  if (!props.ossId && !props.previewLoader) {
    preview.message = '附件尚未生成，提交完成后才可以预览';
    return;
  }
  preview.loading = true;
  try {
    const data = props.previewLoader
      ? await props.previewLoader()
      : (await previewOaApplicationAttachment(props.ossId!)).data as OaAttachmentPreviewVO;
    preview.previewType = data?.previewType;
    preview.message = data?.message;
    preview.fileName = data?.fileName;
    preview.columnLabels = data?.columnLabels || [];
    preview.rowNumbers = data?.rowNumbers || [];
    preview.rows = data?.rows || [];
  } catch (error) {
    console.error('加载附件预览失败', error);
    preview.message = '附件预览失败，请下载原始文件查看';
  } finally {
    preview.loading = false;
  }
};

const downloadAttachment = () => {
  if (!props.ossId) return modal.msgWarning('提交前预览不会生成文件，请确认提交后再下载');
  requestDownload(`/ecology/application/attachment-download/${props.ossId}`, {}, props.fileName || `附件_${props.ossId}.xlsx`, 'get');
};

watch(() => [props.modelValue, props.ossId], ([opened]) => {
  if (opened) void loadPreview();
});
</script>

<style scoped lang="scss">
.attachment-preview-content {
  min-height: 160px;
}

:deep(.el-table) {
  border-radius: 10px;
}
</style>
