import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import crossOriginIsolation from "vite-plugin-cross-origin-isolation";
// import wasm from "vite-plugin-wasm";
// import topLevelAwait from "vite-plugin-top-level-await";
import wasmPack from 'vite-plugin-wasm-pack';


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    crossOriginIsolation(),
    wasmPack('./wasm')
    // wasm(),
    // topLevelAwait(),
  ],
});
