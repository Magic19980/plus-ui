<template>
  <div>
    <el-dropdown trigger="click" @command="handleSetSize">
      <div class="size-icon--style">
        <svg-icon class-name="size-icon" icon-class="size" />
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="item of sizeOptions"
            :key="item.value"
            :disabled="size === item.value"
            :command="item.value"
          >
            {{ item.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/store/modules/app';

const { t } = useI18n();
const appStore = useAppStore();
const size = computed(() => appStore.size);

const sizeOptions = computed(() => [
  { label: t('navbar.layoutSizeLarge'), value: 'large' },
  { label: t('navbar.layoutSizeDefault'), value: 'default' },
  { label: t('navbar.layoutSizeSmall'), value: 'small' }
]);

const handleSetSize = (size: 'large' | 'default' | 'small') => {
  appStore.setSize(size);
};
</script>

<style lang="scss" scoped>
.size-icon--style {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  :deep(.svg-icon) {
    width: 16px;
    height: 16px;
  }
}
</style>
