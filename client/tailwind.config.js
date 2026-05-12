/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
              "secondary-fixed": "#6ffbbe",
              "on-primary-container": "#005f6d",
              "error": "#ffb4ab",
              "on-secondary": "#003824",
              "on-surface": "#dae2fd",
              "primary-fixed": "#a5eeff",
              "tertiary-container": "#ffc175",
              "inverse-on-surface": "#283044",
              "primary-container": "#00e0ff",
              "surface-container": "#171f33",
              "secondary": "#4edea3",
              "on-secondary-fixed-variant": "#005236",
              "on-secondary-container": "#00311f",
              "error-container": "#93000a",
              "surface-container-lowest": "#060e20",
              "tertiary-fixed": "#ffddb8",
              "outline-variant": "#3b494c",
              "surface-container-highest": "#2d3449",
              "on-secondary-fixed": "#002113",
              "on-tertiary-container": "#7a4c00",
              "on-background": "#dae2fd",
              "primary": "#baf2ff",
              "on-primary": "#00363f",
              "surface-variant": "#2d3449",
              "inverse-surface": "#dae2fd",
              "secondary-fixed-dim": "#4edea3",
              "on-tertiary-fixed": "#2a1700",
              "on-tertiary-fixed-variant": "#653e00",
              "on-primary-fixed-variant": "#004e5a",
              "on-primary-fixed": "#001f25",
              "on-error-container": "#ffdad6",
              "background": "#0b1326",
              "outline": "#859397",
              "surface-bright": "#31394d",
              "surface-tint": "#00daf8",
              "on-surface-variant": "#bac9cd",
              "tertiary-fixed-dim": "#ffb95f",
              "surface-container-high": "#222a3d",
              "on-error": "#690005",
              "secondary-container": "#00a572",
              "on-tertiary": "#472a00",
              "primary-fixed-dim": "#00daf8",
              "surface-dim": "#0b1326",
              "surface": "#0b1326",
              "inverse-primary": "#006877",
              "surface-container-low": "#131b2e",
              "tertiary": "#ffe4c9"
      },
      "borderRadius": {
              "DEFAULT": "0.125rem",
              "lg": "0.25rem",
              "xl": "0.5rem",
              "full": "0.75rem"
      },
      "spacing": {
              "container-padding": "24px",
              "stack-lg": "24px",
              "gutter": "16px",
              "stack-sm": "4px",
              "stack-md": "12px",
              "base": "8px"
      },
      "fontFamily": {
              "data-tabular": ["JetBrains Mono", "monospace"],
              "body-base": ["Geist", "sans-serif"],
              "label-caps": ["JetBrains Mono", "monospace"],
              "display-lg": ["JetBrains Mono", "monospace"],
              "headline-md": ["JetBrains Mono", "monospace"]
      },
      "fontSize": {
              "data-tabular": ["14px", {"lineHeight": "1.4", "letterSpacing": "-0.01em", "fontWeight": "500"}],
              "body-base": ["16px", {"lineHeight": "1.5", "fontWeight": "400"}],
              "label-caps": ["11px", {"lineHeight": "1.2", "letterSpacing": "0.08em", "fontWeight": "700"}],
              "display-lg": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
              "headline-md": ["24px", {"lineHeight": "1.2", "fontWeight": "600"}]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
