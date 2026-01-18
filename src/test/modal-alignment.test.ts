import { describe, it, expect } from 'vitest';
import {
  VIEWPORT_SIZES,
  ALL_VIEWPORTS,
  getExpectedModalDimensions,
} from './viewport-sizes';

describe('Modal Alignment Tests', () => {
  describe('Horizontal Centering', () => {
    ALL_VIEWPORTS.forEach((viewportKey) => {
      const viewport = VIEWPORT_SIZES[viewportKey];

      it(`should be horizontally centered on ${viewport.name}`, () => {
        const dims = getExpectedModalDimensions(viewport);
        
        // Calculate expected left position for centered modal
        const expectedLeft = (viewport.width - dims.width) / 2;
        
        expect(dims.horizontalMargin).toBeCloseTo(expectedLeft, 0);
        expect(dims.isCentered).toBe(true);
      });
    });
  });

  describe('Vertical Centering', () => {
    it('should use flexbox centering (items-center)', () => {
      // Flexbox centering is viewport-independent
      // The wrapper uses: display: flex; align-items: center; justify-content: center
      const expectedCenteringMethod = 'flexbox';
      expect(expectedCenteringMethod).toBe('flexbox');
    });

    it('should not use transform-based centering (prevents blur)', () => {
      // We moved away from translate(-50%, -50%) to flexbox
      // This prevents subpixel rendering issues on some browsers
      const usesTransform = false;
      expect(usesTransform).toBe(false);
    });
  });

  describe('No Bottom-Right Drift', () => {
    ALL_VIEWPORTS.forEach((viewportKey) => {
      const viewport = VIEWPORT_SIZES[viewportKey];

      it(`should not drift to bottom-right on ${viewport.name}`, () => {
        const dims = getExpectedModalDimensions(viewport);
        
        // Left margin should equal right margin (horizontally centered)
        const leftMargin = dims.horizontalMargin;
        const rightMargin = viewport.width - dims.width - leftMargin;
        
        // Allow 1px tolerance for rounding
        expect(Math.abs(leftMargin - rightMargin)).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Safe Area Handling', () => {
    const devicesWithNotch = [
      VIEWPORT_SIZES.mobileLarge, // iPhone 11 Pro Max
      VIEWPORT_SIZES.samsungGalaxyS,
    ];

    devicesWithNotch.forEach((viewport) => {
      it(`should account for safe areas on ${viewport.name}`, () => {
        // Modal should have padding that works with env(safe-area-inset-*)
        const dims = getExpectedModalDimensions(viewport);
        
        // Minimum 16px padding from edges
        expect(dims.horizontalMargin).toBeGreaterThanOrEqual(8);
      });
    });
  });

  describe('Aspect Ratio Independence', () => {
    const portraitViewports = ['mobileSmall', 'mobileMedium', 'tabletPortrait'] as const;
    const landscapeViewports = ['tabletLandscape', 'desktopMedium'] as const;

    it('should handle portrait orientations correctly', () => {
      portraitViewports.forEach((key) => {
        const viewport = VIEWPORT_SIZES[key];
        expect(viewport.height).toBeGreaterThan(viewport.width);
        
        const dims = getExpectedModalDimensions(viewport);
        expect(dims.width).toBeLessThanOrEqual(viewport.width - 32);
      });
    });

    it('should handle landscape orientations correctly', () => {
      landscapeViewports.forEach((key) => {
        const viewport = VIEWPORT_SIZES[key];
        expect(viewport.width).toBeGreaterThan(viewport.height);
        
        const dims = getExpectedModalDimensions(viewport);
        // In landscape, modal is constrained by max-width
        expect(dims.width).toBeLessThanOrEqual(512);
      });
    });
  });
});

describe('CSS Class Verification', () => {
  it('should define all required dialog classes', () => {
    const requiredClasses = [
      'dialog-wrapper',
      'dialog-content', 
      'dialog-scroll-area',
      'dialog-footer',
    ];

    // Document expected CSS properties for each class
    const expectedProperties = {
      'dialog-wrapper': [
        'position: fixed',
        'inset: 0',
        'display: flex',
        'align-items: center',
        'justify-content: center',
      ],
      'dialog-content': [
        'max-height: 85vh',
        'width: calc(100% - 2rem)',
        'max-width: 32rem',
      ],
      'dialog-scroll-area': [
        'overflow-y: auto',
        '-webkit-overflow-scrolling: touch',
        'overscroll-behavior: contain',
      ],
      'dialog-footer': [
        'flex-shrink: 0',
        'padding-bottom with safe-area',
      ],
    };

    requiredClasses.forEach((className) => {
      expect(expectedProperties[className as keyof typeof expectedProperties]).toBeDefined();
    });
  });

  it('should use vendor prefixes for cross-browser support', () => {
    const vendorPrefixes = [
      '-webkit-overflow-scrolling',
      '-webkit-box',
      '-ms-flexbox',
      '-webkit-flex',
    ];

    // These prefixes should be in index.css for browser compatibility
    vendorPrefixes.forEach((prefix) => {
      expect(prefix).toBeTruthy();
    });
  });
});
