#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';

const base = process.cwd();
const srcDir = process.env.NIGHTSCHOOL_ASSETS_DIR || '/Users/aixd1/projects/夜校 openclaw 自动化拆解/夜校视频自动产出/即梦生成素材';
const publicDir = path.join(base, 'public');
const videoTsx = path.join(base, 'src/NightSchoolVideo.tsx');

const argCourses = process.argv.find((a) => a.startsWith('--courses='));
const wanted = argCourses ? argCourses.slice('--courses='.length).split(',').map((s) => s.trim()).filter(Boolean) : null;

const all = fs.readdirSync(srcDir).filter((f) => f.endsWith('.mp4'));
if (all.length < 3) throw new Error('素材不足 3 条');

function shuffle(arr) { const a=[...arr]; for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

function pickThree() {
  if (wanted?.length) {
    const out = [];
    for (const c of wanted) {
      const matches = all.filter((f) => f.startsWith(c + '-'));
      if (!matches.length) throw new Error(`未找到课程素材: ${c}`);
      out.push(matches[Math.floor(Math.random() * matches.length)]);
      if (out.length === 3) break;
    }
    if (out.length < 3) throw new Error('指定课程不足 3 个');
    return shuffle(out);
  }
  return shuffle(all).slice(0, 3); // 默认从全素材池随机抽3个
}

function getDurationSec(file) {
  const full = path.join(srcDir, file);
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 ${JSON.stringify(full)}`;
  return parseFloat(execSync(cmd).toString().trim());
}

function cut(srcFile, targetFile) {
  const srcFull = path.join(srcDir, srcFile);
  const outFull = path.join(publicDir, targetFile);
  const dur = getDurationSec(srcFile);
  const clipDur = 2 + Math.random() * 2; // 2-4s
  const maxStart = Math.max(0, dur - clipDur - 0.05);
  const start = maxStart > 0 ? Math.random() * maxStart : 0;
  const cmd = `ffmpeg -y -ss ${start.toFixed(3)} -t ${clipDur.toFixed(3)} -i ${JSON.stringify(srcFull)} -r 30 -c:v libx264 -pix_fmt yuv420p -an ${JSON.stringify(outFull)}`;
  execSync(cmd, {stdio: 'ignore'});
  return {start: start.toFixed(2), dur: clipDur.toFixed(2)};
}

const picked = pickThree();
const labels = picked.map((f) => f.split('-')[0]);
const targets = ['clip-makeup.mp4', 'clip-guitar.mp4', 'clip-jazz.mp4'];

const trims = [];
for (let i = 0; i < 3; i++) trims.push(cut(picked[i], targets[i]));

let tsx = fs.readFileSync(videoTsx, 'utf8');
tsx = tsx.replace(/const CLIP_LABELS = \[[^\]]*\];/, `const CLIP_LABELS = ["${labels[0]}", "${labels[1]}", "${labels[2]}"];`);
fs.writeFileSync(videoTsx, tsx);

console.log('picked:', picked.join(' | '));
console.log('labels:', labels.join(', '));
console.log('trims:', trims.map((t, i) => `${labels[i]} start=${t.start}s dur=${t.dur}s`).join(' | '));
