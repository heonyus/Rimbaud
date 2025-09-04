import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: { soft: '0 12px 24px rgba(0,0,0,0.18)' },
      borderRadius: { xl2: '0.875rem' },
      colors: { accent: '#2563eb' }
    }
  },
  plugins: []
} satisfies Config
