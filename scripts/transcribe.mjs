/**
 * 使用 Whisper.cpp 转录 MP3/WAV 音频，生成 Remotion 字幕 JSON
 *
 * ✅ 已内置繁体→简体自动转换（解决 Whisper 中文转录繁简混杂问题）
 *
 * 用法：node scripts/transcribe.mjs [wav文件路径] [输出json文件名]
 * 示例：node scripts/transcribe.mjs public/voiceover.wav public/captions.json
 */
import path from "path";
import fs from "fs";
import {
    downloadWhisperModel,
    installWhisperCpp,
    transcribe,
    toCaptions,
} from "@remotion/install-whisper-cpp";
import * as OpenCC from "opencc-js";

const inputPath = process.argv[2] || "public/voiceover.wav";
const outputPath = process.argv[3] || "public/captions.json";

const whisperDir = path.join(process.cwd(), "whisper.cpp");

console.log("📦 安装 Whisper.cpp ...");
await installWhisperCpp({
    to: whisperDir,
    version: "1.5.5",
});

// 使用 medium 模型（支持中文）
console.log("📥 下载 Whisper medium 模型（支持中文）...");
await downloadWhisperModel({
    model: "medium",
    folder: whisperDir,
});

console.log(`🎤 转录音频: ${inputPath}`);
const whisperCppOutput = await transcribe({
    model: "medium",
    whisperPath: whisperDir,
    whisperCppVersion: "1.5.5",
    inputPath: path.resolve(inputPath),
    tokenLevelTimestamps: true,
    language: "zh",
});

// 后处理为 Remotion Caption 格式
const { captions } = toCaptions({
    whisperCppOutput,
});

// ===== 繁体→简体自动转换 =====
// Whisper 的 "zh" 语言码不区分简繁，模型会根据训练数据随机输出繁体或简体
// 这里用 opencc-js 库做一遍统一的繁→简转换，确保输出全部是简体
console.log("🔄 繁体 → 简体 转换...");
const converter = OpenCC.Converter({ from: "tw", to: "cn" });

const simplifiedCaptions = captions.map((c) => ({
    ...c,
    text: converter(c.text),
}));

// ===== 智能修复乱码字符 =====
// Whisper 有时会把一个汉字（如"划""心"）拆成两个 replacement character (U+FFFD)
// 这些乱码通常成对出现，需要结合上下文推断原始字符
// 策略：如果一个 caption 纯粹是乱码就跳过，后续的"态"等字符保持不变
const cleanedCaptions = [];
for (let i = 0; i < simplifiedCaptions.length; i++) {
    const c = simplifiedCaptions[i];
    const text = c.text;

    // 纯乱码 caption（只包含 replacement characters）→ 跳过
    if (/^\ufffd+$/.test(text)) {
        continue;
    }

    // 包含部分乱码的 caption → 移除乱码字符，保留正常文字
    if (text.includes("\ufffd")) {
        const cleaned = text.replace(/\ufffd/g, "");
        if (cleaned.trim()) {
            cleanedCaptions.push({ ...c, text: cleaned });
        }
        continue;
    }

    // 空 caption → 跳过
    if (!text.trim()) continue;

    cleanedCaptions.push(c);
}

console.log(`✅ 转录完成，共 ${cleanedCaptions.length} 个字幕片段`);
console.log("📝 前 10 个字幕片段预览:");
cleanedCaptions.slice(0, 10).forEach((c, i) => {
    console.log(
        `  [${i}] ${c.startMs}ms - ${c.endMs}ms: "${c.text}"`
    );
});

console.log("📝 完整文案：", cleanedCaptions.map((c) => c.text).join(""));

fs.writeFileSync(outputPath, JSON.stringify(cleanedCaptions, null, 2));
console.log(`💾 字幕已保存到: ${outputPath}`);
