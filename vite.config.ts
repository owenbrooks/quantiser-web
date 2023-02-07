import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import crossOriginIsolation from "vite-plugin-cross-origin-isolation";
import wasmPack from 'vite-plugin-wasm-pack';
import ViteRestart from 'vite-plugin-restart'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    crossOriginIsolation(),
    wasmPack('./wasm'),
    ViteRestart({
      restart: [
        'wasm/pkg/*',
      ]
    })
  ],
});
