import { describe, expect, it, vi } from 'vitest';
import { ConfigurationKey } from '../../core/enums/ConfigurationKey';
import { SettingsStateManager } from './SettingsStateManager';

const configuration = {
  detectIcons: false,
  openNewWindow: false,
};

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: () => ({
      get: (key: string, defaultValue: boolean): boolean => {
        if (key === ConfigurationKey.DetectIcons) {
          return configuration.detectIcons;
        }
        if (key === ConfigurationKey.OpenNewWindow) {
          return configuration.openNewWindow;
        }
        return defaultValue;
      },
    }),
  },
}));

describe('SettingsStateManager', () => {
  const settings = new SettingsStateManager({} as never);

  it('defaults opensNewWindow to false', () => {
    configuration.openNewWindow = false;
    expect(settings.opensNewWindow()).toBe(false);
  });

  it('reads the openNewWindow configuration flag', () => {
    configuration.openNewWindow = true;
    expect(settings.opensNewWindow()).toBe(true);
  });
});
