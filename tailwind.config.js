/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  safelist: [
    'border-l-rose-400', 'border-l-amber-400', 'border-l-lime-400',
    'border-l-emerald-400', 'border-l-cyan-400', 'border-l-blue-400',
    'border-l-violet-400', 'border-l-fuchsia-400',
    'bg-rose-100', 'bg-amber-100', 'bg-lime-100',
    'bg-emerald-100', 'bg-cyan-100', 'bg-blue-100',
    'bg-violet-100', 'bg-fuchsia-100',
    'bg-rose-400', 'bg-amber-400', 'bg-lime-400',
    'bg-emerald-400', 'bg-cyan-400', 'bg-blue-400',
    'bg-violet-400', 'bg-fuchsia-400',
    'text-rose-700', 'text-amber-700', 'text-lime-700',
    'text-emerald-700', 'text-cyan-700', 'text-blue-700',
    'text-violet-700', 'text-fuchsia-700',
  ],
  plugins: [],
};
