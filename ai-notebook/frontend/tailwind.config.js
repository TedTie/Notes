/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    // 移除了自定义CSS类，因为它们在CSS文件中定义，不需要Tailwind生成
    // 'desktop-nav', 'mobile-nav', 'force-mobile' 这些是自定义类，不是Tailwind工具类
  ],
  theme: {
    extend: {
      colors: {
        // Light Mode - 赛博朋克白天主题（青色调）
        'cyber-light': {
          'primary': '#00e5ff',      // 明亮青色
          'secondary': '#00bcd4',    // 深青色
          'accent': '#4dd0e1',       // 浅青色
          'bg': '#f0f8ff',           // 浅蓝白背景
          'surface': '#e1f5fe',      // 表面色
          'text': '#003d40',         // 深青文字
          'border': '#4dd0e1',       // 边框色
          'glow': '#00e5ff',         // 发光色
        },
        // Dark Mode - 赛博朋克夜晚主题（紫色调）
        'cyber-dark': {
          'primary': '#bb86fc',      // 明亮紫色
          'secondary': '#9c27b0',    // 深紫色
          'accent': '#e1bee7',       // 浅紫色
          'bg': '#0a0a0f',           // 深紫黑背景
          'surface': '#1a1a2e',      // 表面色
          'text': '#e1bee7',         // 浅紫文字
          'border': '#bb86fc',       // 边框色
          'glow': '#bb86fc',         // 发光色
        },
        // 通用赛博朋克色彩
        'cyber': {
          'primary': '#00ffff',      // 青色
          'secondary': '#ff00ff',    // 品红
          'accent': '#ffff00',       // 黄色
          'dark': '#0a0a0a',         // 深黑
          'darker': '#050505',       // 更深黑
          'gray': '#1a1a1a',         // 深灰
          'light-gray': '#2a2a2a',   // 浅灰
        },
        // 霓虹效果色彩
        'neon': {
          'blue': '#00d4ff',
          'pink': '#ff0080',
          'green': '#00ff41',
          'purple': '#8000ff',
          'orange': '#ff8000',
          'cyan': '#00e5ff',
          'magenta': '#bb86fc',
        }
      },
      fontFamily: {
        'cyber': ['Exo 2', 'Rajdhani', 'Orbitron', 'system-ui', 'sans-serif'],
        'cyber-display': ['Orbitron', 'Exo 2', 'system-ui', 'sans-serif'],
        'cyber-body': ['Rajdhani', 'Exo 2', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flicker': 'flicker 0.15s infinite linear',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        glow: {
          'from': { 'box-shadow': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff' },
          'to': { 'box-shadow': '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff' }
        },
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: '0.99' },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: '0.4' }
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'neon': '0 0 5px currentColor, 0 0 20px currentColor, 0 0 35px currentColor',
        'neon-sm': '0 0 2px currentColor, 0 0 10px currentColor',
        'cyber': '0 4px 14px 0 rgba(0, 255, 255, 0.39)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}