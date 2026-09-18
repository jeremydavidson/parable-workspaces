import { describe, expect, it, vi } from 'vitest';
import { ViewMessageHandler } from './ViewMessageHandler';

describe('ViewMessageHandler', () => {
  const createHandler = (open: ReturnType<typeof vi.fn>): ViewMessageHandler =>
    new ViewMessageHandler(
      {} as never,
      { open } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      vi.fn(),
    );

  it('opens a sidebar workspace without forcing a new window', async () => {
    const open = vi.fn(async () => undefined);
    const handler = createHandler(open);

    await handler.handle({
      command: 'openWorkspace',
      workspaceId: 'workspace-1',
    });

    expect(open).toHaveBeenCalledWith('workspace-1');
  });

  it('forces a new window from the context menu action', async () => {
    const open = vi.fn(async () => undefined);
    const handler = createHandler(open);

    await handler.handle({
      command: 'openWorkspaceNewWindow',
      workspaceId: 'workspace-1',
    });

    expect(open).toHaveBeenCalledWith('workspace-1', true);
  });
});
