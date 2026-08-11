import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Semantic tokens — sumber tunggal dari index.css
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      borderRadius: {
        lg: "20px", // Larger rounded corners
        md: "16px",
        sm: "12px",
      },
      fontFamily: {
        heading: ['"DM Sans"', '"Inter"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // Glass morphism effects
        glassShimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        // Soft blue glow effects with #234C6A
        blueGlowPulse: {
          '0%, 100%': {
            boxShadow: '0 4px 20px rgba(35, 76, 106, 0.4), 0 0 30px rgba(35, 76, 106, 0.3)',
            background: 'linear-gradient(135deg, rgba(35, 76, 106, 0.1), rgba(35, 76, 106, 0.05))'
          },
          '50%': {
            boxShadow: '0 6px 25px rgba(35, 76, 106, 0.6), 0 0 40px rgba(35, 76, 106, 0.4)',
            background: 'linear-gradient(135deg, rgba(35, 76, 106, 0.15), rgba(35, 76, 106, 0.08))'
          },
        },
        // Micro interactions
        buttonHover: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.02)' },
        },
        cardHover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        loadingPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
        'gradient-shift-slow': 'gradientShift 5s ease-in-out infinite',
        'blue-glow-pulse': 'blueGlowPulse 3s ease-in-out infinite',
        'loading-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

