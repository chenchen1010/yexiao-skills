#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const inputPath = process.argv[2] || 'public/voiceover.wav';
const outputPath = process.argv[3] || 'public/captions.json';
const appid = process.env.VOLCANO_VC_APPID;
const token = process.env.VOLCANO_VC_TOKEN;
const base = (process.env.VOLCANO_VC_BASE_URL || 'https://openspeech.bytedance.com/api/v1/vc').replace(/\/$/, '');

if (!appid || !token) throw new Error('缺少 VOLCANO_VC_APPID / VOLCANO_VC_TOKEN');
const absInput = path.resolve(inputPath);
if (!fs.existsSync(absInput)) throw new Error(`音频不存在: ${absInput}`);

const submitUrl = `${base}/submit?appid=${encodeURIComponent(appid)}&language=zh-CN&use_itn=True&use_punc=True&max_lines=1&words_per_line=15`;
const queryBase = `${base}/query?appid=${encodeURIComponent(appid)}`;
const authHeader = `Bearer; ${token}`;

async function submit() {
  const wav = fs.readFileSync(absInput);
  const res = await fetch(submitUrl, {method:'POST', headers:{Authorization:authHeader,'Content-Type':'audio/wav',Accept:'*/*'}, body:wav});
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok || Number(data.code) !== 0 || !data.id) throw new Error(`submit失败: ${res.status} ${text.slice(0,300)}`);
  return data.id;
}

async function query(id) {
  for (let i=0;i<10;i++) {
    const url = `${queryBase}&id=${encodeURIComponent(id)}&blocking=1`;
    const res = await fetch(url, {headers:{Authorization:authHeader,Accept:'*/*'}});
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    const code = Number(data.code);
    if (code === 0) return data;
    if (code === 2000) { await new Promise(r=>setTimeout(r, 1500)); continue; }
    throw new Error(`query失败: ${res.status} ${text.slice(0,300)}`);
  }
  throw new Error('query超时');
}

function toCaptions(data) {
  const out = [];
  for (const u of data.utterances || []) {
    if ((u.words || []).length) {
      for (const w of u.words) {
        const t=(w.text||'').trim(); if(!t) continue;
        out.push({text:t,startMs:Number(w.start_time||0),endMs:Number(w.end_time||0),confidence:0.95});
      }
    }
  }
  return out;
}

const id = await submit();
console.log('task id:', id);
const result = await query(id);
const captions = toCaptions(result);
if (!captions.length) throw new Error('字幕为空');
fs.writeFileSync(outputPath, JSON.stringify(captions, null, 2));
console.log(`done captions=${captions.length} -> ${outputPath}`);
