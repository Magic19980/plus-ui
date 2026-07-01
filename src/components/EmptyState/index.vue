<template>
  <el-empty :image-size="imageSize" :description="description">
    <template #image>
      <svg
        class="empty-state-svg"
        viewBox="0 0 200 160"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <!-- 背景圆 -->
        <circle cx="100" cy="100" r="48" fill="var(--app-accent-soft, rgba(14,165,233,0.08))" />
        <!-- 装饰小圆 -->
        <circle cx="72" cy="72" r="6" fill="var(--app-accent-soft, rgba(14,165,233,0.08))" />
        <circle cx="134" cy="80" r="4" fill="var(--app-accent-soft, rgba(14,165,233,0.08))" />
        <circle cx="114" cy="132" r="5" fill="var(--app-accent-soft, rgba(14,165,233,0.08))" />
        <!-- 中间空白文档图标 -->
        <rect x="82" y="82" width="36" height="44" rx="6" stroke="var(--app-text-muted, #6b7280)" stroke-width="1.5" fill="var(--app-surface-bg, #fff)" opacity="0.6" />
        <!-- 文档上的线条 -->
        <line x1="90" y1="96" x2="110" y2="96" stroke="var(--app-text-muted, #6b7280)" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
        <line x1="90" y1="104" x2="106" y2="104" stroke="var(--app-text-muted, #6b7280)" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
        <line x1="90" y1="112" x2="102" y2="112" stroke="var(--app-text-muted, #6b7280)" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
        <!-- 放大镜 -->
        <circle cx="128" cy="116" r="8" stroke="var(--app-accent-strong, #0ea5e9)" stroke-width="1.5" fill="none" opacity="0.5" />
        <line x1="134" y1="122" x2="140" y2="128" stroke="var(--app-accent-strong, #0ea5e9)" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
      </svg>
    </template>
  </el-empty>
</template>

<script setup lang="ts">
interface Props {
  description?: string;
  imageSize?: number;
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  imageSize: 120,
});
</script>

<style lang="scss" scoped>
.empty-state-svg {
  width: 100%;
  height: 100%;
}
</style>
