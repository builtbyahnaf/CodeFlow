/**
 * Public entry point for CodeFlow Accessibility System (`src/visualization/a11y/`).
 */

export {
  KEYBOARD_ACTIONS,
  SHORTCUT_REGISTRY,
  sortNodesInReadingOrder,
  findNextNodeInDirection,
  evaluateKeyboardEvent,
} from './keyboard.js';

export {
  formatAriaStatus,
  buildAccessibleOutline,
  renderOutlineHtml,
} from './outline.js';

export {
  announceLevelChange,
  announceClusterExpansion,
  announceSelection,
  announceStaleSources,
  announceNotice,
} from './announcer.js';
