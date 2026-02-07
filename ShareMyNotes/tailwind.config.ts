import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paper-inspired warm neutral palette (from Destilify)
        primary: '#5C5956',
        'primary-light': '#78756F',
        'primary-dark': '#3D3935',
        secondary: '#F9F7F5',
        'secondary-dark': '#EBE7E3',
        accent: '#8A8580',
        'accent-green': '#7BA66B',
        'accent-sage': '#9DB88E',
        'accent-blue': '#6B8BA6',
        'text-primary': '#2D2A27',
        'text-secondary': '#5C5956',
        'text-tertiary': '#8A8580',
        border: '#D6D2CD',
        'border-light': '#EBE7E3',
        background: '#FFFEFB',
        'background-subtle': '#F9F7F5',
        'background-muted': '#EBE7E3',
        'background-dark': '#3D3935',
        'background-darker': '#2D2A27',
        success: '#7BA66B',
        error: '#C55A50',
        warning: '#B8956A',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.625rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.03)',
      },
    },
  },
  plugins: [],
}
export default config
