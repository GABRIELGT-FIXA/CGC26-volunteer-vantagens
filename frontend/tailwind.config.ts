import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['selector', '[data-mode="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      colors: {
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        card: {
          DEFAULT:    'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT:    'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT:    'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT:    'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT:    'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT:    'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border:  'var(--border)',
        input:   'var(--input)',
        ring:    'var(--ring)',
        brand: {
          primary:        'var(--brand-primary)',
          light:          'var(--brand-primary-light)',
          pale:           'var(--brand-primary-pale)',
          secondary:      'var(--brand-secondary)',
          accent:         'var(--brand-accent)',
          'accent-muted': 'var(--brand-accent-muted)',
          surface:        'var(--brand-surface)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'brand-gradient': 'var(--brand-gradient)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
