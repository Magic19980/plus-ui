// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { applyUiTheme, isAnimalTheme } from './uiTheme';

describe('uiTheme', () => {
  beforeEach(() => {
    const classes = new Set<string>();
    const documentElement = {
      dataset: {} as Record<string, string>,
      style: { colorScheme: '' },
      classList: {
        toggle(name: string, enabled: boolean) {
          if (enabled) classes.add(name);
          else classes.delete(name);
        },
        contains(name: string) {
          return classes.has(name);
        }
      }
    };
    (globalThis as typeof globalThis & { document: Document }).document = { documentElement } as unknown as Document;
  });

  it('normalizes invalid themes and synchronizes light mode state', () => {
    applyUiTheme('unknown', false);
    expect(document.documentElement.dataset.uiTheme).toBe(UiThemeEnum.OFFICE);
    expect(document.documentElement.dataset.colorMode).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('synchronizes dark mode state', () => {
    applyUiTheme(UiThemeEnum.OFFICE, true);
    expect(document.documentElement.dataset.uiTheme).toBe(UiThemeEnum.OFFICE);
    expect(document.documentElement.dataset.colorMode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('ui-theme-office')).toBe(true);
  });

  it('recognizes only the Animal theme', () => {
    expect(isAnimalTheme(UiThemeEnum.ANIMAL)).toBe(true);
    expect(isAnimalTheme(UiThemeEnum.OFFICE)).toBe(false);
  });
});
