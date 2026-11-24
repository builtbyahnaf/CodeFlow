/**
 * Destructive Action Confirmation Guard (Phase 12 §7, P12-15).
 *
 * Ensures all destructive actions (e.g. index clearing, configuration reset)
 * require explicit modal confirmation and clearly state consequences.
 */

/**
 * Format confirmation modal message explaining consequence.
 *
 * @param {string} actionTitle
 * @param {string} consequence
 * @returns {string}
 */
export function buildConfirmationMessage(actionTitle, consequence) {
  return `CodeFlow: Are you sure you want to ${actionTitle}?\n\nConsequence: ${consequence}`;
}

/**
 * Request user confirmation before executing a destructive operation.
 *
 * @param {{
 *   showWarningMessage: (message: string, options: {modal: boolean}, ...items: string[]) => Promise<string | undefined>,
 *   actionTitle: string,
 *   confirmLabel: string,
 *   consequence: string,
 * }} options
 * @returns {Promise<boolean>}
 */
export async function confirmDestructiveAction({
  showWarningMessage,
  actionTitle,
  confirmLabel,
  consequence,
}) {
  const message = buildConfirmationMessage(actionTitle, consequence);
  const choice = await showWarningMessage(
    message,
    { modal: true },
    confirmLabel,
  );
  return choice === confirmLabel;
}
