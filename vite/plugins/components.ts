import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { resolve } from 'path';

/**
 * 所有旧页面的 <el-tooltip> 统一进入主题适配器。
 * 办公模式仍渲染 Element Plus，动森模式则渲染 Animal Tooltip，避免逐页维护两套模板。
 */
const uiTooltipResolver = (name: string) => {
  if (name !== 'ElTooltip') return;
  return {
    name: 'default',
    // Vite/Rolldown 在 Windows 下要求 resolver 返回正斜杠路径。
    from: resolve(import.meta.dirname, '../../src/components/UiKit/UiTooltip.vue').replace(/\\/g, '/')
  };
};

export default () => {
  return Components({
    resolvers: [
      uiTooltipResolver,
      // 自动导入 Element Plus 组件
      ElementPlusResolver({
        importStyle: false
      })
    ],
    dts: resolve(import.meta.dirname, '../../src/types/components.d.ts')
  });
};
