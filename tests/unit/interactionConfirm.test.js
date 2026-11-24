import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildConfirmationMessage,
  confirmDestructiveAction,
} from '../../src/extension/interaction/confirm.js';

describe('Destructive Action Confirmation (P12-15)', () => {
  it('buildConfirmationMessage includes action title and stated consequence', () => {
    const msg = buildConfirmationMessage('clear the index', 'All cached symbol graphs will be deleted and must be re-analyzed.');
    assert.ok(msg.includes('clear the index'));
    assert.ok(msg.includes('All cached symbol graphs will be deleted'));
  });

  it('confirmDestructiveAction returns true when confirmed by user', async () => {
    let modalPrompted = false;
    const mockShowWarning = async (message, options, confirmItem) => {
      modalPrompted = options.modal;
      return confirmItem;
    };

    const confirmed = await confirmDestructiveAction({
      showWarningMessage: mockShowWarning,
      actionTitle: 'clear index',
      confirmLabel: 'Clear Index Now',
      consequence: 'Will discard analysis cache',
    });

    assert.equal(confirmed, true);
    assert.equal(modalPrompted, true);
  });

  it('confirmDestructiveAction returns false when user dismisses or cancels', async () => {
    const mockShowWarning = async () => undefined;

    const confirmed = await confirmDestructiveAction({
      showWarningMessage: mockShowWarning,
      actionTitle: 'reset settings',
      confirmLabel: 'Reset Settings',
      consequence: 'All settings return to defaults',
    });

    assert.equal(confirmed, false);
  });
});
