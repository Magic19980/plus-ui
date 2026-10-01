import { UiThemeEnum } from '@/enums/UiThemeEnum';

/** 工作模式描述，用于设置面板和主题预览。 */
export interface UiThemeDefinition {
  id: UiThemeEnum;
  label: string;
  description: string;
  tone: string;
}

/**
 * 所有工作模式的元数据集中维护，避免设置面板自行拼接主题名称。
 */
export const UI_THEME_DEFINITIONS: UiThemeDefinition[] = [
  {
    id: UiThemeEnum.OFFICE,
    label: '办公模式',
    description: '使用当前系统组件，适合日常业务办理。',
    tone: 'professional'
  },
  {
    id: UiThemeEnum.ANIMAL,
    label: '动森模式',
    description: '使用 Animal Island 风格组件，保留完整业务能力。',
    tone: 'island'
  }
];

export const isUiTheme = (value: unknown): value is UiThemeEnum =>
  value === UiThemeEnum.OFFICE || value === UiThemeEnum.ANIMAL;
