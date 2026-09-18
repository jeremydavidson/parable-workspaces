import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StringHelper } from '../../core/helpers/StringHelper';
import { OpenWorkspaceService } from '../../core/services/OpenWorkspaceService';
import type { Workspace } from '../../core/dtos/Workspace';

const workspaceState = {
  workspaceFolders: undefined as
    | Array<{ uri: { fsPath: string }; name: string }>
    | undefined,
  workspaceFile: undefined as { fsPath: string; scheme: string } | undefined,
};

vi.mock('vscode', () => ({
  workspace: {
    get workspaceFolders() {
      return workspaceState.workspaceFolders;
    },
    get workspaceFile() {
      return workspaceState.workspaceFile;
    },
  },
}));

describe('OpenWorkspaceService', () => {
  const openFolder = vi.fn(async () => undefined);
  const save = vi.fn(async () => undefined);
  let workspace: Workspace;
  let openNewWindow = false;

  const createService = (): OpenWorkspaceService => {
    const repository = {
      findOne: vi.fn(() => workspace),
      save,
    };
    const userInteraction = { openFolder };
    const settings = {
      opensNewWindow: (): boolean => openNewWindow,
    };
    return new OpenWorkspaceService(
      repository as never,
      userInteraction as never,
      settings as never,
    );
  };

  beforeEach(() => {
    openFolder.mockClear();
    save.mockClear();
    openNewWindow = false;
    workspaceState.workspaceFolders = undefined;
    workspaceState.workspaceFile = undefined;
    workspace = {
      id: StringHelper.toBase64('/tmp/multi/multi.code-workspace'),
      name: 'Multi',
      folders: ['/tmp/multi/folder-a', '/tmp/multi/folder-b'],
      tags: [],
      lastOpened: 1,
    };
  });

  it('opens the code-workspace file instead of folders[0] when switching', async () => {
    const service = createService();

    await service.open(workspace.id, false);

    expect(openFolder).toHaveBeenCalledWith(
      '/tmp/multi/multi.code-workspace',
      false,
    );
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceFile: '/tmp/multi/multi.code-workspace',
        lastOpened: expect.any(Number),
      }),
    );
  });

  it('opens the recorded workspaceFile when present', async () => {
    workspace.workspaceFile = '/tmp/multi/saved.code-workspace';
    workspace.id = StringHelper.toBase64('/tmp/multi/folder-a');
    const service = createService();

    await service.open(workspace.id, false);
    expect(openFolder).toHaveBeenCalledWith(
      '/tmp/multi/saved.code-workspace',
      false,
    );
  });

  it('replaces the current window when openNewWindow is unset', async () => {
    workspace.folders = ['/tmp/plain'];
    workspace.id = StringHelper.toBase64('/tmp/plain');
    const service = createService();

    await service.open(workspace.id);

    expect(openFolder).toHaveBeenCalledWith('/tmp/plain', false);
  });

  it('opens a new window when the openNewWindow setting is true', async () => {
    openNewWindow = true;
    workspace.folders = ['/tmp/plain'];
    workspace.id = StringHelper.toBase64('/tmp/plain');
    const service = createService();

    await service.open(workspace.id);

    expect(openFolder).toHaveBeenCalledWith('/tmp/plain', true);
  });

  it('lets an explicit forceNewWindow override the setting', async () => {
    openNewWindow = false;
    workspace.folders = ['/tmp/plain'];
    workspace.id = StringHelper.toBase64('/tmp/plain');
    const service = createService();

    await service.open(workspace.id, true);

    expect(openFolder).toHaveBeenCalledWith('/tmp/plain', true);
  });

  it('skips opening when the target is already open even if forceNewWindow is true', async () => {
    workspace.workspaceFile = '/tmp/multi/multi.code-workspace';
    workspaceState.workspaceFile = {
      fsPath: '/tmp/multi/multi.code-workspace',
      scheme: 'file',
    };
    workspaceState.workspaceFolders = [
      { uri: { fsPath: '/tmp/multi/folder-a' }, name: 'folder-a' },
    ];

    const service = createService();

    await service.open(workspace.id, true);

    expect(openFolder).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });

  it('opens a code-workspace from a folder window that shares the same primary folder', async () => {
    workspaceState.workspaceFolders = [
      { uri: { fsPath: '/tmp/multi/folder-a' }, name: 'folder-a' },
    ];

    const service = createService();

    await service.open(workspace.id, false);

    expect(openFolder).toHaveBeenCalledWith(
      '/tmp/multi/multi.code-workspace',
      false,
    );
  });

  it('skips reopen when the target path is already open in this window', async () => {
    workspace.folders = ['/tmp/plain'];
    workspace.id = StringHelper.toBase64('/tmp/plain');
    workspaceState.workspaceFolders = [
      { uri: { fsPath: '/tmp/plain' }, name: 'plain' },
    ];

    const service = createService();

    await service.open(workspace.id, false);

    expect(openFolder).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });
});
