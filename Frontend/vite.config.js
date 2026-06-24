import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  preview: {
    // Allow Railway public domains when running vite preview in production.
    allowedHosts: [process.env.PREVIEW_ALLOWED_HOST, ".up.railway.app"].filter(
      Boolean,
    ),
  },
});
