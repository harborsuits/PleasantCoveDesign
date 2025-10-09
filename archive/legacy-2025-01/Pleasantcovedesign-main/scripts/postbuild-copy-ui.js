// archive/Pleasantcovedesign-main/scripts/postbuild-copy-ui.js
const fs = require("fs");
const path = require("path");

const src = path.resolve(__dirname, "../../lovable-ui-integration/dist");
const dest = path.resolve(__dirname, "../lovable-dist");

if (!fs.existsSync(src)) {
  console.warn("[copy-ui] UI dist not found at", src, "— did you run build:ui?");
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

// shallow copy (enough for Vite dist)
function copyDir(from, to) {
  for (const entry of fs.readdirSync(from)) {
    const a = path.join(from, entry);
    const b = path.join(to, entry);
    const stat = fs.statSync(a);
    if (stat.isDirectory()) {
      fs.mkdirSync(b, { recursive: true });
      copyDir(a, b);
    } else {
      fs.copyFileSync(a, b);
    }
  }
}
copyDir(src, dest);
console.log("[copy-ui] Copied UI dist to", dest);
