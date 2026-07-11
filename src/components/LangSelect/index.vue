<template>
  <el-dropdown trigger="click" @command="handleLanguageChange">
    <div class="lang-select--style">
      <svg-icon icon-class="language" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item :disabled="appStore.language === 'zh_CN'" command="zh_CN">中文</el-dropdown-item>
        <el-dropdown-item :disabled="appStore.language === 'en_US'" command="en_US">English</el-dropdown-item>
        <el-dropdown-item :disabled="appStore.language === 'id_ID'" command="id_ID">Bahasa Indonesia</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SvgIcon from '@/components/SvgIcon/index.vue';
import { useAppStore } from '@/store/modules/app';
import { usePermissionStore } from '@/store/modules/permission';
import { useTagsViewStore } from '@/store/modules/tagsView';

const appStore = useAppStore();
const permissionStore = usePermissionStore();
const tagsViewStore = useTagsViewStore();
const { locale, t } = useI18n();

const message: Record<string, string> = {
  zh_CN: '切换语言成功！',
  en_US: 'Switch Language Successful!',
  id_ID: 'Bahasa berhasil diubah!'
};

const handleLanguageChange = async (lang: string) => {
  locale.value = lang;
  appStore.changeLanguage(lang);
  // refreshRoutes 返回 path→title 映射，无需再次扫描路由树
  const pathTitleMap = await permissionStore.refreshRoutes();
  // 对静态 i18n key（如 route.dashboard）做翻译；后端返回的目标语言原文 t() 会透传
  const translatedMap = new Map<string, string>();
  for (const [path, title] of pathTitleMap) {
    translatedMap.set(path, t(title));
  }
  tagsViewStore.refreshTitles(translatedMap);
  ElMessage.success(message[lang] || '切换语言成功！');
};
</script>

<style lang="scss" scoped>
.lang-select--style {
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
