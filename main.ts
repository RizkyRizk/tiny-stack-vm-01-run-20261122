import * as fs from "node:fs";
import * as path from "node:path";
const INDIR = process.env.MAKEFUN_INPUT_DIR || "/input";
const OUTDIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";
function run(p, inp) {
  const S = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256);
  const out = [];
  let sp = 0, cp = 0, pc = 0, ip = 0, steps = 0, code = 0;
  const n = p.length;
  loop: while (true) {
    if (steps >= 1000000) { code = 10; break; }
    if (pc < 0 || pc >= n) { code = 9; break; }
    const op = p[pc];
    let il = 0;
    if (op === 1) il = 1;
    else if (op === 2) il = 4;
    else if (op >= 48 && op <= 51) il = 2;
    else if (!(op === 0 || (op >= 3 && op <= 7) || (op >= 16 && op <= 30) || (op >= 32 && op <= 34) || op === 52 || op === 64 || op === 65 || (op >= 80 && op <= 83))) { code = 5; break; }
    if (pc + 1 + il > n) { code = 9; break; }
    steps++;
    const nx = pc + 1 + il;
    pc = nx;
    let po = 0, pu = 0;
    if (op === 1 || op === 2 || op === 82) pu = 1;
    else if (op === 3 || op === 49 || op === 50 || op === 80 || op === 81 || op === 83) po = 1;
    else if (op === 4) { po = 1; pu = 2; }
    else if (op === 5) { po = 2; pu = 2; }
    else if (op === 6) { po = 2; pu = 3; }
    else if (op === 7) { po = 3; pu = 3; }
    else if ((op >= 16 && op <= 22) || (op >= 24 && op <= 26) || (op >= 28 && op <= 30) || (op >= 32 && op <= 34)) { po = 2; pu = 1; }
    else if (op === 23 || op === 27 || op === 64) { po = 1; pu = 1; }
    else if (op === 65) po = 2;
    if (sp < po) { code = 2; break; }
    if (sp - po + pu > 256) { code = 3; break; }
    switch (op) {
      case 0: break loop;
      case 1: S[sp++] = (p[nx - 1] << 24) >> 24; break;
      case 2: S[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24); break;
      case 3: sp--; break;
      case 4: S[sp] = S[sp - 1]; sp++; break;
      case 5: { const t = S[sp - 1]; S[sp - 1] = S[sp - 2]; S[sp - 2] = t; break; }
      case 6: S[sp] = S[sp - 2]; sp++; break;
      case 7: { const t = S[sp - 3]; S[sp - 3] = S[sp - 2]; S[sp - 2] = S[sp - 1]; S[sp - 1] = t; break; }
      case 16: { const b = S[--sp]; S[sp - 1] = (S[sp - 1] + b) | 0; break; }
      case 17: { const b = S[--sp]; S[sp - 1] = (S[sp - 1] - b) | 0; break; }
      case 18: { const b = S[--sp]; S[sp - 1] = Math.imul(S[sp - 1], b); break; }
      case 19: case 20: case 21: case 22: {
        const b = S[--sp];
        if (b === 0) { code = 4; break loop; }
        const a = S[sp - 1];
        S[sp - 1] = op === 19 ? (a / b) | 0 : op === 20 ? (a % b) | 0 : op === 21 ? ((a >>> 0) / (b >>> 0)) | 0 : ((a >>> 0) % (b >>> 0)) | 0;
        break;
      }
      case 23: S[sp - 1] = (-S[sp - 1]) | 0; break;
      case 24: { const b = S[--sp]; S[sp - 1] = S[sp - 1] & b; break; }
      case 25: { const b = S[--sp]; S[sp - 1] = S[sp - 1] | b; break; }
      case 26: { const b = S[--sp]; S[sp - 1] = S[sp - 1] ^ b; break; }
      case 27: S[sp - 1] = ~S[sp - 1]; break;
      case 28: { const b = S[--sp]; S[sp - 1] = S[sp - 1] << (b & 31); break; }
      case 29: { const b = S[--sp]; S[sp - 1] = S[sp - 1] >> (b & 31); break; }
      case 30: { const b = S[--sp]; S[sp - 1] = (S[sp - 1] >>> (b & 31)) | 0; break; }
      case 32: { const b = S[--sp]; S[sp - 1] = S[sp - 1] === b ? 1 : 0; break; }
      case 33: { const b = S[--sp]; S[sp - 1] = S[sp - 1] < b ? 1 : 0; break; }
      case 34: { const b = S[--sp]; S[sp - 1] = (S[sp - 1] >>> 0) < (b >>> 0) ? 1 : 0; break; }
      case 48: case 49: case 50: {
        let o = p[nx - 2] | (p[nx - 1] << 8);
        if (o & 32768) o -= 65536;
        if (op === 48 || (op === 49 && S[--sp] === 0) || (op === 50 && S[--sp] !== 0)) pc = nx + o;
        break;
      }
      case 51:
        if (cp >= 64) { code = 7; break loop; }
        C[cp++] = nx; pc = p[nx - 2] | (p[nx - 1] << 8); break;
      case 52:
        if (cp === 0) { code = 8; break loop; }
        pc = C[--cp]; break;
      case 64: { const a = S[sp - 1]; if (a < 0 || a > 255) { code = 6; break loop; } S[sp - 1] = M[a]; break; }
      case 65: { const a = S[--sp]; const v = S[--sp]; if (a < 0 || a > 255) { code = 6; break loop; } M[a] = v; break; }
      case 80: {
        const s = String(S[--sp]);
        if (out.length + s.length > 65536) { code = 11; break loop; }
        for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
        break;
      }
      case 81: { const v = S[--sp]; if (out.length + 1 > 65536) { code = 11; break loop; } out.push(v & 255); break; }
      case 82: S[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 83: code = S[--sp] & 255; break loop;
    }
  }
  return [Buffer.from(out), code];
}
for (let k = 1; k <= 40; k++) {
  const id = "i" + String(k).padStart(3, "0");
  const dir = path.join(INDIR, id);
  let prog = Buffer.alloc(0), inp = Buffer.alloc(0);
  try { prog = fs.readFileSync(path.join(dir, "program.bin")); } catch {}
  try { inp = fs.readFileSync(path.join(dir, "input.bin")); } catch {}
  const [out, code] = run(prog, inp);
  const od = path.join(OUTDIR, id);
  fs.mkdirSync(od, { recursive: true });
  fs.writeFileSync(path.join(od, "stdout.bin"), out);
  fs.writeFileSync(path.join(od, "exit.txt"), String(code) + "\n");
}
