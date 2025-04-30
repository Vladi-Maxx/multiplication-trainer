export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      animation: {
        'sparkle-fade': 'sparkle 0.7s forwards ease-out',
        'float': 'float 3s ease-in-out infinite alternate',
        'twinkle': 'twinkle 5s infinite alternate',
        'pulse-slow': 'pulse 3s infinite alternate',
      },
      keyframes: {
        sparkle: {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
          '50%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.7 },
          '100%': { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 }
        },
        float: {
          '0%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(1deg)' },
          '100%': { transform: 'translateY(0px) rotate(-1deg)' }
        },
        twinkle: {
          '0%': { opacity: 0.2, transform: 'scale(0.8)' },
          '50%': { opacity: 0.7, transform: 'scale(1.2)' },
          '100%': { opacity: 0.3, transform: 'scale(1)' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      }
    }
  },
  plugins: []
};
