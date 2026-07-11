// 自定义国际化配置
import { createI18n } from 'vue-i18n';
import { LanguageEnum } from '@/enums/LanguageEnum';
import en_US from '@/lang/en_US';
import id_ID from '@/lang/id_ID';
import zh_CN from '@/lang/zh_CN';

const VALID_LANGUAGES: ReadonlySet<string> = new Set([
  LanguageEnum.zh_CN,
  LanguageEnum.en_US,
  LanguageEnum.id_ID
]);

/**
 * 获取当前语言，直接从 localStorage 同步读取
 * useStorage 对 string 类型值以原始字符串存储（如 id_ID），这里兼容两种格式
 * @returns zh_CN|en_US|id_ID
 */
export const getLanguage = (): LanguageEnum => {
  const stored = localStorage.getItem('language');
  if (!stored) return LanguageEnum.zh_CN;

  // useStorage 对 string 类型值直接存储原始字符串
  if (VALID_LANGUAGES.has(stored)) {
    return stored as LanguageEnum;
  }

  // 兼容旧的 JSON 序列化格式（如 '"zh_CN"'）
  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed === 'string' && VALID_LANGUAGES.has(parsed)) {
      return parsed as LanguageEnum;
    }
  } catch { /* fallback */ }

  return LanguageEnum.zh_CN;
};

const i18n = createI18n({
  globalInjection: true,
  allowComposition: true,
  legacy: false,
  locale: getLanguage(),
  messages: {
    zh_CN: zh_CN,
    en_US: en_US,
    id_ID: id_ID
  }
});

export default i18n;

export type LanguageType = typeof zh_CN;
