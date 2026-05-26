/**
 * Bottom sheet layout, keyboard spacing, and gesture tuning.
 *
 * Primary control for keyboard spacing: {@link KEYBOARD_SHEET_GAP}.
 * Changing it also updates derived padding via
 * {@link SHEET_BOTTOM_PADDING_WITH_KEYBOARD} and
 * {@link SHEET_SCROLL_PADDING_WITH_KEYBOARD}.
 */

/** Extra space (px) between the top of the keyboard and the bottom edge of the sheet. */
export const KEYBOARD_SHEET_GAP = 12;

/** Approximate height (px) of the drag handle strip at the top of the sheet. */
export const SHEET_HANDLE_HEIGHT = 28;

/** Approximate height (px) reserved for the sticky title/actions header row. */
export const SHEET_HEADER_HEIGHT = 48;

/** Approximate height (px) of a fixed footer (e.g. Save button bar). */
export const SHEET_FOOTER_HEIGHT = 72;

/** Minimum sheet height (px) when the keyboard is open so content stays usable. */
export const SHEET_MIN_HEIGHT = 200;

/** Minimum scroll area height (px) inside the sheet. */
export const SHEET_MIN_SCROLL_HEIGHT = 120;

/** Fraction of window height used as max sheet height when the keyboard is closed (0–1). */
export const SHEET_MAX_HEIGHT_RATIO = 0.92;

/** Bottom padding (px) inside the sheet when the keyboard is closed (before safe area). */
export const SHEET_BOTTOM_PADDING_DEFAULT = 16;

/** Extra bottom padding (px) on scroll content when the keyboard is closed. */
export const SHEET_SCROLL_PADDING_DEFAULT = 4;

/** Fixed inset (px) subtracted when calculating scroll area from total sheet height. */
export const SHEET_SCROLL_LAYOUT_INSET = 16;

/**
 * Bottom padding (px) inside the sheet when the keyboard is open.
 * Derived from {@link KEYBOARD_SHEET_GAP} (gap − 4, minimum 12).
 */
export const SHEET_BOTTOM_PADDING_WITH_KEYBOARD = Math.max(
  12,
  KEYBOARD_SHEET_GAP - 4
);

/**
 * Extra bottom padding (px) on scroll content when the keyboard is open.
 * Derived from {@link KEYBOARD_SHEET_GAP} (gap + 4).
 */
export const SHEET_SCROLL_PADDING_WITH_KEYBOARD = KEYBOARD_SHEET_GAP + 4;

/** Drag distance (px) downward before the sheet dismisses on release. */
export const DISMISS_DRAG_DISTANCE = 100;

/** Downward velocity threshold; releasing above this dismisses the sheet. */
export const DISMISS_VELOCITY = 750;

/** TranslateY (px) applied during the dismiss animation after a successful drag. */
export const DISMISS_DRAG_TRANSLATE = 400;

/** Duration (ms) for keyboard-hide and sheet margin-bottom reset animations. */
export const KEYBOARD_HIDE_DURATION_MS = 250;

/** Fallback duration (ms) for keyboard-show animation on Android. */
export const KEYBOARD_SHOW_DURATION_ANDROID_MS = 250;

/** Duration (ms) for the sheet slide-down dismiss animation after drag. */
export const DISMISS_SHEET_DURATION_MS = 220;

/** Minimum vertical movement (px) before the pan gesture activates on the handle. */
export const PAN_ACTIVE_OFFSET_Y = 8;

/** Spring damping when the sheet snaps back after an incomplete drag. */
export const SPRING_DAMPING = 22;

/** Spring stiffness when the sheet snaps back after an incomplete drag. */
export const SPRING_STIFFNESS = 280;

/** Bottom inset (px) for sheet content; uses safe area when the keyboard is closed. */
export function sheetBottomPadding(
  keyboardOpen: boolean,
  safeAreaBottom: number
): number {
  return keyboardOpen
    ? SHEET_BOTTOM_PADDING_WITH_KEYBOARD
    : Math.max(safeAreaBottom, SHEET_BOTTOM_PADDING_DEFAULT);
}

/** Scroll content bottom padding (px) based on keyboard visibility. */
export function sheetScrollPaddingBottom(keyboardOpen: boolean): number {
  return keyboardOpen
    ? SHEET_SCROLL_PADDING_WITH_KEYBOARD
    : SHEET_SCROLL_PADDING_DEFAULT;
}

/** Max sheet height (px); shrinks to fit above the keyboard when it is open. */
export function sheetMaxHeight(
  windowHeight: number,
  keyboardTop: number | null,
  safeAreaTop: number
): number {
  if (keyboardTop != null) {
    return Math.max(SHEET_MIN_HEIGHT, keyboardTop - safeAreaTop - KEYBOARD_SHEET_GAP);
  }
  return windowHeight * SHEET_MAX_HEIGHT_RATIO;
}

/** Max scroll view height (px) after subtracting handle, header, footer, and layout inset. */
export function sheetScrollMaxHeight(
  maxSheetHeight: number,
  options?: { hasHeader?: boolean; hasFooter?: boolean }
): number {
  const { hasHeader = false, hasFooter = false } = options ?? {};
  return Math.max(
    SHEET_MIN_SCROLL_HEIGHT,
    maxSheetHeight -
      SHEET_HANDLE_HEIGHT -
      (hasHeader ? SHEET_HEADER_HEIGHT : 0) -
      (hasFooter ? SHEET_FOOTER_HEIGHT : 0) -
      SHEET_SCROLL_LAYOUT_INSET
  );
}

/**
 * Total bottom margin (px) to lift the sheet: keyboard height plus
 * {@link KEYBOARD_SHEET_GAP}.
 */
export function keyboardLiftOffset(keyboardHeight: number): number {
  return Math.max(keyboardHeight, 0) + KEYBOARD_SHEET_GAP;
}
