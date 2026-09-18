import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Open new window setting E2E', () => {
  test('registers parableWorkspaces.openNewWindow defaulting to false', async () => {
    const extension = vscode.extensions.getExtension(
      'stanleygomes.parable-workspaces',
    );
    assert.ok(extension);
    await extension.activate();

    const properties =
      extension.packageJSON?.contributes?.configuration?.properties;
    assert.ok(properties?.['parableWorkspaces.openNewWindow']);
    assert.strictEqual(
      properties['parableWorkspaces.openNewWindow'].default,
      false,
    );
    assert.strictEqual(
      properties['parableWorkspaces.openNewWindow'].type,
      'boolean',
    );
  });

  test('exposes openNewWindow through the workspace configuration API', async () => {
    const value = vscode.workspace
      .getConfiguration('parableWorkspaces')
      .get('openNewWindow');
    assert.strictEqual(value, false);
  });
});
