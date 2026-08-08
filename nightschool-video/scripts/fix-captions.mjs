/**
 * 修复 captions.json：繁体转简体 + 修复乱码字符
 */
import fs from "fs";

const inputPath = process.argv[2] || "public/captions.json";

const captions = JSON.parse(fs.readFileSync(inputPath, "utf8"));

// 繁体→简体映射
const t2sMap = {
    "因為": "因为", "這樣": "这样", "幾": "几", "塊": "块",
    "這": "这", "門": "门", "學": "学", "質": "质",
    "對": "对", "來說": "来说", "後": "后", "機": "机",
    "歡": "欢", "覺得": "觉得", "喜歡": "喜欢",
    "我覺得": "我觉得", "態": "态", "然後": "然后",
    "之後": "之后", "這個": "这个", "這個是": "这个是",
};

// 按长度降序排列key，确保更长的先匹配
const sortedKeys = Object.keys(t2sMap).sort((a, b) => b.length - a.length);

function t2s(text) {
    let result = text;
    for (const key of sortedKeys) {
        result = result.replaceAll(key, t2sMap[key]);
    }
    return result;
}

// Step 1: 繁转简
const simplified = captions.map(c => ({ ...c, text: t2s(c.text) }));

// Step 2: 合并乱码字符（Whisper 有时会把 '心' 拆成两个乱码 + '态'）
const result = [];
let i = 0;
while (i < simplified.length) {
    const c = simplified[i];
    if (c.text.includes("\ufffd") || c.text === "�") {
        // 收集连续乱码
        let j = i;
        while (j < simplified.length && (simplified[j].text.includes("\ufffd") || simplified[j].text === "�")) {
            j++;
        }
        // 看后面是不是 "态"
        if (j < simplified.length && simplified[j].text === "态") {
            result.push({
                text: "心态",
                startMs: simplified[i].startMs,
                endMs: simplified[j].endMs,
                timestampMs: simplified[j].timestampMs,
                confidence: 0.8,
            });
            i = j + 1;
        } else {
            // 把乱码跳过
            i = j;
        }
    } else {
        result.push(c);
        i++;
    }
}

fs.writeFileSync(inputPath, JSON.stringify(result, null, 2));
console.log(`✅ 修复完成，共 ${result.length} 个字幕片段`);
console.log("📝 完整文案：", result.map(c => c.text).join(""));
