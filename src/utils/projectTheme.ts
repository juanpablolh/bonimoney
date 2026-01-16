
export interface ProjectTheme {
    bgColor: string;         // CSS value for background-color
    textColor: string;       // CSS value for color
    mutedTextColor: string;  // CSS value for secondary text
    iconBgColor: string;     // CSS value for icon container background
    iconTextColor: string;   // CSS value for icon color
    borderColor: string;     // CSS value for border-color
    overlay?: string;        // Tailwind class for overlay (still useful as class if static)
}

// Helper to create OKLCH CSS string
const oklch = (l: number, c: number, h: number, a?: number) => {
    if (a !== undefined) {
        return `oklch(${l} ${c} ${h} / ${a})`;
    }
    return `oklch(${l} ${c} ${h})`;
};

// Generates a consistent pastel theme from a single Hue angle
const createPastelTheme = (hue: number): ProjectTheme => {
    // 200 tone: Light, visible pastel background (L0.93 C0.06)
    const bgColor = oklch(0.93, 0.06, hue);

    // 900 tone: Dark, saturated text
    const textColor = oklch(0.32, 0.10, hue);

    // 600 tone: Muted text
    const mutedTextColor = oklch(0.50, 0.08, hue);

    // Icon container: White with 50% opacity
    const iconBgColor = 'rgba(255, 255, 255, 0.5)';

    // Icon color: Slightly richer than text
    const iconTextColor = oklch(0.35, 0.12, hue);

    // Border: Slightly darker than BG (L0.88)
    const borderColor = oklch(0.88, 0.05, hue);

    return {
        bgColor,
        textColor,
        mutedTextColor,
        iconBgColor,
        iconTextColor,
        borderColor,
        // Keep overlay as a className string since gradients are complex to construct manually and standard white gradient is fine
        overlay: 'bg-gradient-to-br from-white/40 to-transparent opacity-100'
    };
};

// --- PALETTE DEFINITION ---

// Defined Hues for good separation
const HUES = {
    'rose': 15,
    'coral': 35,
    'orange': 55,
    'amber': 75,
    'yellow': 90,
    'lime': 110,
    'green': 140,
    'emerald': 160,
    'teal': 175,
    'cyan': 195,
    'sky': 220,
    'blue': 250,
    'indigo': 280,
    'violet': 305,
    'purple': 325,
    'magenta': 345,
    'slate': 260,
};

const generateThemes = () => {
    const themes: Record<string, ProjectTheme> = {};

    // Generate standard pastel themes
    Object.entries(HUES).forEach(([name, hue]) => {
        themes[`project-${name}`] = createPastelTheme(hue);
    });

    // Special override logic for Slate if needed (Low Chroma)
    const slateHue = 260;
    themes['project-slate'] = {
        bgColor: oklch(0.95, 0.01, slateHue),
        textColor: oklch(0.25, 0.02, slateHue),
        mutedTextColor: oklch(0.50, 0.02, slateHue),
        iconBgColor: 'rgba(255, 255, 255, 0.6)',
        iconTextColor: oklch(0.30, 0.02, slateHue),
        borderColor: oklch(0.90, 0.01, slateHue),
        overlay: 'bg-gradient-to-br from-white/40 to-transparent opacity-100'
    };

    return themes;
};

export const PROJECT_THEMES = generateThemes();

export const getProjectTheme = (colorKey?: string, projectId?: string): ProjectTheme => {
    if (colorKey && PROJECT_THEMES[colorKey]) {
        return PROJECT_THEMES[colorKey];
    }

    const keys = Object.keys(PROJECT_THEMES);

    if (projectId) {
        let hash = 0;
        for (let i = 0; i < projectId.length; i++) {
            hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return PROJECT_THEMES[keys[Math.abs(hash) % keys.length]];
    }

    return PROJECT_THEMES['project-emerald'];
};
