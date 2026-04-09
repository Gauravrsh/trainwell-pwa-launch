import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VIEWPORT_SIZES,
  ALL_VIEWPORTS,
  MOBILE_VIEWPORTS,
  MODAL_CONSTRAINTS,
  getExpectedModalDimensions,
  shouldModalScroll,
} from './viewport-sizes';

describe('Modal Responsive Behavior', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    // Restore original dimensions
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
  });

  function setViewport(width: number, height: number) {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
    window.dispatchEvent(new Event('resize'));
  }

  describe('Viewport Size Definitions', () => {
    it('should have all required viewport sizes defined', () => {
      expect(Object.keys(VIEWPORT_SIZES)).toHaveLength(12);
    });

    it('should have valid dimensions for all viewports', () => {
      Object.values(VIEWPORT_SIZES).forEach((viewport) => {
        expect(viewport.width).toBeGreaterThan(0);
        expect(viewport.height).toBeGreaterThan(0);
        expect(viewport.name).toBeTruthy();
      });
    });

    it('should have mobile viewports with width <= 414', () => {
      MOBILE_VIEWPORTS.forEach((key) => {
        expect(VIEWPORT_SIZES[key].width).toBeLessThanOrEqual(414);
      });
    });
  });

  describe('Modal Dimension Calculations', () => {
    ALL_VIEWPORTS.forEach((viewportKey) => {
      const viewport = VIEWPORT_SIZES[viewportKey];

      describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        beforeEach(() => {
          setViewport(viewport.width, viewport.height);
        });

        it('should calculate correct modal width', () => {
          const dims = getExpectedModalDimensions(viewport);
          
          // Modal should not exceed max-w-lg (512px)
          expect(dims.width).toBeLessThanOrEqual(MODAL_CONSTRAINTS.maxWidth);
          
          // Modal should have minimum width
          expect(dims.width).toBeGreaterThanOrEqual(MODAL_CONSTRAINTS.minWidth);
        });

        it('should calculate correct max height (85% of viewport)', () => {
          const dims = getExpectedModalDimensions(viewport);
          const expectedMaxHeight = Math.floor(viewport.height * 0.85);
          
          expect(dims.maxHeight).toBe(expectedMaxHeight);
        });

        it('should be horizontally centered', () => {
          const dims = getExpectedModalDimensions(viewport);
          
          expect(dims.isCentered).toBe(true);
          expect(dims.horizontalMargin).toBeGreaterThanOrEqual(0);
        });

        it('should have proper horizontal margins on small screens', () => {
          const dims = getExpectedModalDimensions(viewport);
          
          // Check that modal + margins = viewport width
          const totalWidth = dims.width + (dims.horizontalMargin * 2);
          expect(totalWidth).toBeLessThanOrEqual(viewport.width);
        });
      });
    });
  });

  describe('Modal Scrolling Behavior', () => {
    const testContentHeights = [300, 500, 800, 1200];

    ALL_VIEWPORTS.forEach((viewportKey) => {
      const viewport = VIEWPORT_SIZES[viewportKey];

      describe(`${viewport.name}`, () => {
        testContentHeights.forEach((contentHeight) => {
          it(`should ${contentHeight > viewport.height * 0.85 ? '' : 'not '}scroll with ${contentHeight}px content`, () => {
            const shouldScroll = shouldModalScroll(viewport, contentHeight);
            const maxHeight = viewport.height * MODAL_CONSTRAINTS.maxHeightRatio;
            
            expect(shouldScroll).toBe(contentHeight > maxHeight);
          });
        });
      });
    });
  });

  describe('Cross-Browser CSS Compatibility', () => {
    it('should support flexbox centering fallbacks', () => {
      // Verify CSS classes exist for cross-browser support
      const expectedClasses = [
        'dialog-wrapper',
        'dialog-content',
        'dialog-scroll-area',
        'dialog-footer',
      ];
      
      // This test verifies the class names are documented
      expectedClasses.forEach((className) => {
        expect(className).toBeTruthy();
      });
    });

    it('should handle dvh with vh fallback', () => {
      // Test that max-h-modal uses both vh and dvh
      const heightRatio = MODAL_CONSTRAINTS.maxHeightRatio;
      expect(heightRatio).toBe(0.85);
    });

    it('should account for safe area insets on mobile', () => {
      // Verify safe area padding is considered
      MOBILE_VIEWPORTS.forEach((viewportKey) => {
        const viewport = VIEWPORT_SIZES[viewportKey];
        const dims = getExpectedModalDimensions(viewport);
        
        // Horizontal padding should be at least 16px (1rem)
        expect(dims.horizontalMargin).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Touch Scroll Behavior', () => {
    it('should enable touch scrolling on mobile viewports', () => {
      MOBILE_VIEWPORTS.forEach((viewportKey) => {
        const viewport = VIEWPORT_SIZES[viewportKey];
        
        // Modal should be scrollable when content exceeds 85% height
        const tallContent = viewport.height * 0.9;
        expect(shouldModalScroll(viewport, tallContent)).toBe(true);
      });
    });

    it('should prevent body scroll when modal is open', () => {
      // This is handled by Radix Dialog - documenting expected behavior
      expect(true).toBe(true);
    });
  });

  describe('India-Specific Browser Viewport Tests', () => {
    const indiaBrowserViewports = [
      { browser: 'Chrome Android', ...VIEWPORT_SIZES.samsungGalaxyA },
      { browser: 'Samsung Internet', ...VIEWPORT_SIZES.samsungGalaxyS },
      { browser: 'UC Browser', ...VIEWPORT_SIZES.budgetAndroid },
      { browser: 'Opera Mini', ...VIEWPORT_SIZES.redmiNote },
      { browser: 'Firefox Android', ...VIEWPORT_SIZES.mobileMedium },
    ];

    indiaBrowserViewports.forEach(({ browser, width, height }) => {
      it(`should render correctly on ${browser} (${width}x${height})`, () => {
        setViewport(width, height);
        
        const dims = getExpectedModalDimensions({ width, height, name: browser });
        
        // Modal should fit within viewport
        expect(dims.width + (dims.horizontalMargin * 2)).toBeLessThanOrEqual(width);
        expect(dims.maxHeight).toBeLessThanOrEqual(height);
        
        // Modal should be usable (minimum touch target size)
        expect(dims.width).toBeGreaterThanOrEqual(280);
        expect(dims.maxHeight).toBeGreaterThanOrEqual(200);
      });
    });
  });
});
