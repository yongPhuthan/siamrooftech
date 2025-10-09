import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("daisyui")],
  // ✅ FIX: Disable DaisyUI base styles ที่ทำให้ input มีสีพื้นหลังเข้ม
  daisyui: {
    styled: false,  // ปิด component styles อัตโนมัติ
    themes: false,  // ปิด theme system
    base: false,    // ปิด base styles (reset CSS)
  },
};
export default config;
