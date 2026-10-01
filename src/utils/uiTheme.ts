import { UiThemeEnum } from '@/enums/UiThemeEnum';

let animalStylePromise: Promise<unknown> | undefined;

/** 动森模式的品牌强调色，页面和 Element Plus 控件共用这一份定义。 */
export const ANIMAL_PRIMARY_COLOR = '#19c8b9';

/**
 * 仅在进入动森模式时加载组件库样式，避免办公模式承担额外首屏资源。
 */
const ensureAnimalStyle = () => {
  animalStylePromise ??= import('animal-island-vue/style').catch((error) => {
    // 允许下一次切换重试，同时保留错误上下文便于定位构建或依赖问题。
    animalStylePromise = undefined;
    console.error('[ui-theme] 动森组件样式加载失败', error);
    throw error;
  });
  return animalStylePromise;
};
import { isUiTheme } from '@/themes';

/**
 * 将工作模式和显示模式写入 html 根节点。
 * 页面组件只读取 data 属性和语义化 CSS 变量，不直接判断具体主题名称。
 */
export const applyUiTheme = (theme: string, dark: boolean) => {
  const html = document.documentElement;
  const nextTheme = isUiTheme(theme) ? theme : UiThemeEnum.OFFICE;

  html.dataset.uiTheme = nextTheme;
  html.dataset.colorMode = dark ? 'dark' : 'light';
  // Element Plus、VXE 以及浏览器原生控件分别读取不同的深色标记。
  // 在这里一次性同步，避免切换页签或刷新后出现“页面已切换、菜单/表格仍沿用旧主题”的中间状态。
  html.classList.toggle('dark', dark);
  html.style.colorScheme = dark ? 'dark' : 'light';
  html.classList.toggle('ui-theme-office', nextTheme === UiThemeEnum.OFFICE);
  html.classList.toggle('ui-theme-animal', nextTheme === UiThemeEnum.ANIMAL);

  if (nextTheme === UiThemeEnum.ANIMAL) {
    void ensureAnimalStyle().catch(() => {
      // 样式加载失败时不阻塞页面渲染；错误已在上方记录，并允许后续切换重试。
    });
  }
};

/** 工作模式是否为动森模式。 */
export const isAnimalTheme = (theme: string) => theme === UiThemeEnum.ANIMAL;
