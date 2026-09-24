// Loaded by scripts/next-exfat.cjs (npm run build / start) and, via NODE_OPTIONS, by Next's build workers.
// On exFAT/FAT drives Windows reports readlink() on a non-link (file or directory) as EISDIR; POSIX and NTFS
// report EINVAL ("not a symbolic link"), the only code Next/webpack treat as "not a link". readlink never
// legitimately fails with EISDIR, so remap it. No effect on NTFS, Linux or Vercel (never occurs there).
// See docs/case-study-turbopack-exfat-junctions.md.
const fs = require("fs");

// Next spawns build workers; make them load this patch too. Must be launched via scripts/next-exfat.cjs
// (not `node --require`), because Next merges process.execArgv into NODE_OPTIONS and mangles the pair.
const self = `--require "${__filename.replace(/\\/g, "/")}"`;
if (!(process.env.NODE_OPTIONS ?? "").includes("exfat-readlink-patch")) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ""} ${self}`.trim();
}

function remap(err) {
  if (err && err.code === "EISDIR") {
    err.code = "EINVAL";
    err.errno = -4071;
    err.message = err.message.replace("EISDIR: illegal operation on a directory", "EINVAL: invalid argument");
  }
  return err;
}

const readlinkSync = fs.readlinkSync;
fs.readlinkSync = function (...args) {
  try {
    return readlinkSync.apply(this, args);
  } catch (err) {
    throw remap(err);
  }
};

const readlink = fs.readlink;
fs.readlink = function (...args) {
  const cb = args.pop();
  return readlink.call(this, ...args, (err, ...out) => cb(remap(err), ...out));
};

const readlinkP = fs.promises.readlink;
fs.promises.readlink = async function (...args) {
  try {
    return await readlinkP.apply(this, args);
  } catch (err) {
    throw remap(err);
  }
};
