// `npm run build` / `npm run start` entry: apply the exFAT readlink patch, then hand over to the Next CLI.
// Usage: node scripts/next-exfat.cjs <next args...>
require("./exfat-readlink-patch.cjs");
require("next/dist/bin/next");
