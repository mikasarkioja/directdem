import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        nordic: {
          white: "#ECEFF4",
          light: "#E5E9F0",
          gray: "#D8DEE9",
          dark: "#4C566A",
          blue: "#5E81AC",
          deep: "#3B4252",
          darker: "#2E3440",
        },
        // Flat color names for easier usage
        "nordic-white": "#ECEFF4",
        "nordic-light": "#E5E9F0",
        "nordic-gray": "#D8DEE9",
        "nordic-dark": "#4C566A",
        "nordic-blue": "#5E81AC",
        "nordic-deep": "#3B4252",
        "nordic-darker": "#2E3440",
      },
    },
  },
  plugins: [],
};
export default config;


