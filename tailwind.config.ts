// مثال: tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brandBlue: "#0058E6",
        brandBlueLight: "#4BA3FF",
        brandGreen: "#3B8C4B",
        surface: "#FFFFFF",
        background: "#F7FAFB",
      },
    },
  },
  plugins: [],
};

export default config;
