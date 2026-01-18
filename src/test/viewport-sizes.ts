/**
 * Common viewport sizes for cross-browser responsive testing
 * Covers top Indian browsers: Chrome, Samsung Internet, Opera, Firefox, UC Browser
 */

export const VIEWPORT_SIZES = {
  // Mobile devices
  mobileSmall: { width: 320, height: 568, name: 'iPhone SE / Small Android' },
  mobileMedium: { width: 375, height: 667, name: 'iPhone 8 / Medium Android' },
  mobileLarge: { width: 414, height: 896, name: 'iPhone 11 Pro Max / Large Android' },
  
  // Samsung devices (popular in India)
  samsungGalaxyA: { width: 360, height: 800, name: 'Samsung Galaxy A Series' },
  samsungGalaxyS: { width: 384, height: 854, name: 'Samsung Galaxy S Series' },
  
  // Budget Android (common in India)
  budgetAndroid: { width: 320, height: 534, name: 'Budget Android' },
  redmiNote: { width: 393, height: 873, name: 'Redmi Note Series' },
  
  // Tablets
  tabletPortrait: { width: 768, height: 1024, name: 'iPad Portrait' },
  tabletLandscape: { width: 1024, height: 768, name: 'iPad Landscape' },
  
  // Desktop
  desktopSmall: { width: 1280, height: 720, name: 'Small Desktop / Laptop' },
  desktopMedium: { width: 1440, height: 900, name: 'Medium Desktop' },
  desktopLarge: { width: 1920, height: 1080, name: 'Full HD Desktop' },
} as const;

export type ViewportSize = keyof typeof VIEWPORT_SIZES;

export const MOBILE_VIEWPORTS: ViewportSize[] = [
  'mobileSmall',
  'mobileMedium',
  'mobileLarge',
  'samsungGalaxyA',
  'samsungGalaxyS',
  'budgetAndroid',
  'redmiNote',
];

export const TABLET_VIEWPORTS: ViewportSize[] = [
  'tabletPortrait',
  'tabletLandscape',
];

export const DESKTOP_VIEWPORTS: ViewportSize[] = [
  'desktopSmall',
  'desktopMedium',
  'desktopLarge',
];

export const ALL_VIEWPORTS: ViewportSize[] = [
  ...MOBILE_VIEWPORTS,
  ...TABLET_VIEWPORTS,
  ...DESKTOP_VIEWPORTS,
];

// Modal size constraints for validation
export const MODAL_CONSTRAINTS = {
  minWidth: 280,
  maxWidth: 512, // max-w-lg = 32rem = 512px
  minHeight: 200,
  maxHeightRatio: 0.85, // 85vh/85dvh
  horizontalPadding: 16, // 1rem on each side
} as const;

export interface ViewportDimensions {
  width: number;
  height: number;
  name: string;
}

/**
 * Calculate expected modal dimensions for a given viewport
 */
export function getExpectedModalDimensions(viewport: ViewportDimensions) {
  const availableWidth = viewport.width - (MODAL_CONSTRAINTS.horizontalPadding * 2);
  const expectedWidth = Math.min(availableWidth, MODAL_CONSTRAINTS.maxWidth);
  const maxHeight = Math.floor(viewport.height * MODAL_CONSTRAINTS.maxHeightRatio);
  
  return {
    width: expectedWidth,
    maxHeight,
    isCentered: true,
    horizontalMargin: Math.max(0, (viewport.width - expectedWidth) / 2),
    verticalMargin: 'auto', // Flexbox centering
  };
}

/**
 * Check if modal should be scrollable at given viewport
 */
export function shouldModalScroll(viewport: ViewportDimensions, contentHeight: number) {
  const maxHeight = Math.floor(viewport.height * MODAL_CONSTRAINTS.maxHeightRatio);
  return contentHeight > maxHeight;
}
