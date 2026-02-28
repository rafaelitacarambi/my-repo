/**
 * Utility to calculate the best text color (black or white) for a given background color
 * to ensure high contrast and accessibility.
 */

/**
 * Parses a hex color string or CSS color name to RGB.
 * Currently supports #RGB and #RRGGBB formats.
 */
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
    }

    // Support short format #RGB
    const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (shortResult) {
        return {
            r: parseInt(shortResult[1] + shortResult[1], 16),
            g: parseInt(shortResult[2] + shortResult[2], 16),
            b: parseInt(shortResult[3] + shortResult[3], 16)
        };
    }

    return null;
}

/**
 * Calculates the relative luminance of a color.
 * Based on WCAG 2.0 formulas.
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
    const sRGB = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return sRGB[0] * 0.2126 + sRGB[1] * 0.7152 + sRGB[2] * 0.0722;
}

/**
 * Returns the recommended text color ('black' or 'white') for a given background hex.
 * Defaults to 'black' if color parsing fails.
 */
export function getContrastColor(backgroundColor: string): 'black' | 'white' {
    const rgb = hexToRgb(backgroundColor);
    if (!rgb) return 'black';

    const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);

    // Contrast ratio is calculated against white and black.
    // L1 is the relative luminance of the lighter of the colors, 
    // and L2 is the relative luminance of the darker of the colors.
    // Ratio = (L1 + 0.05) / (L2 + 0.05)

    // We compare which one provides better contrast
    return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Utility to provide Tailwind-compatible text color class
 */
export function getContrastClass(backgroundColor: string): string {
    return getContrastColor(backgroundColor) === 'white' ? 'text-white' : 'text-black';
}
