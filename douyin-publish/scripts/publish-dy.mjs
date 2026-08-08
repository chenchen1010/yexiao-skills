#!/usr/bin/env node
/**
 * 抖音自动发布脚本（独立版）
 *
 * 功能：
 *   - 自动上传视频到抖音创作者平台
 *   - 自动填写描述/标题
 *   - 持久化浏览器登录态，免重复扫码
 *
 * 用法：
 *   node publish-dy.mjs --video=/path/to/video.mp4
 *   node publish-dy.mjs --video=./video.mp4 --desc="#话题 描述" --title="视频标题"
 *
 * 参数：
 *   --video=<路径>    视频文件路径（必填）
 *   --desc=<描述>     视频描述文字（可选）
 *   --title=<标题>    视频标题（可选）
 */

import 'dotenv/config';
import { Stagehand } from '@browserbasehq/stagehand';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

// ─── 路径工具 ───
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── 参数解析 ───
const args = process.argv.slice(2);

function getArg(prefix) {
    const a = args.find(a => a.startsWith(prefix));
    return a ? a.slice(prefix.length) : null;
}

const videoRaw = getArg('--video=');
if (!videoRaw) {
    console.error('❌ 请指定视频文件路径：--video=/path/to/video.mp4');
    process.exit(1);
}
const videoPath = resolve(process.cwd(), videoRaw);
if (!existsSync(videoPath)) {
    console.error(`❌ 视频文件不存在：${videoPath}`);
    process.exit(1);
}

const videoDesc = getArg('--desc=') || '';
const videoTitle = getArg('--title=') || '';

// ─── LLM 配置 ───
function getModelConfig() {
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (!hasAnthropic && !hasOpenAI) {
        console.error('❌ 缺少 LLM API Key');
        console.error('   请在 .env 中配置：ANTHROPIC_API_KEY=sk-... 或 OPENAI_API_KEY=sk-...');
        process.exit(1);
    }

    const modelName = process.env.STAGEHAND_MODEL
        || (hasAnthropic ? 'anthropic/claude-haiku-4-5-20251001' : 'openai/gpt-4o');
    const baseURL = process.env.ANTHROPIC_BASE_URL || null;

    if (baseURL && hasAnthropic) {
        return {
            model: { modelName, apiKey: process.env.ANTHROPIC_API_KEY, baseURL },
            provider: `中转 (${new URL(baseURL).hostname})`,
        };
    }
    return {
        model: modelName,
        provider: hasAnthropic ? 'Anthropic' : 'OpenAI',
    };
}

const modelConfig = getModelConfig();

// ─── 浏览器登录态目录（固定在 ~/.douyin-publish/ 下，跨项目共享） ───
const DY_PUBLISH_URL = 'https://creator.douyin.com/creator-micro/content/upload';
const userDataDir = resolve(homedir(), '.douyin-publish/chrome-data');
if (!existsSync(userDataDir)) mkdirSync(userDataDir, { recursive: true });

// ─── 打印配置 ───
console.log(`\n🎬 抖音自动发布`);
console.log(`   视频：${videoPath}`);
console.log(`   描述：${videoDesc || '（无）'}`);
if (videoTitle) console.log(`   标题：${videoTitle}`);
console.log(`   LLM：${modelConfig.provider}`);
console.log('');

// ─── 工具函数 ───
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function waitForEnter(prompt) {
    if (prompt) console.log(prompt);
    return new Promise((resolve) => {
        process.stdin.setRawMode?.(false);
        process.stdin.resume();
        process.stdin.once('data', () => { process.stdin.pause(); resolve(); });
    });
}

async function pageLooksLoggedOut(page) {
    try {
        return await page.evaluate(() => {
            const text = document.body?.innerText || '';
            return text.includes('扫码登录')
                || text.includes('验证码登录')
                || text.includes('登录/注册')
                || text.includes('创作者登录');
        });
    } catch {
        return false;
    }
}

async function ensureUploadComposer(page) {
    if (page.url().includes('/content/upload')) return;
    try {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, a'));
            const target = btns.find((el) => (el.textContent || '').includes('发布视频'));
            if (target) target.click();
        });
        await sleep(3000);
    } catch { }
}

async function getActionFrames(page) {
    const frames = page.frames().slice().reverse();
    const scored = [];
    for (const frame of frames) {
        try {
            const score = await frame.evaluate(() => {
                const text = document.body?.innerText || '';
                let s = 0;
                if (location.href.includes('/content/upload')) s += 2;
                if (text.includes('上传视频')) s += 3;
                if (text.includes('点击上传')) s += 2;
                if (text.includes('拖拽')) s += 1;
                if (text.includes('发布视频')) s += 1;
                if (document.querySelector('input[type="file"]')) s += 5;
                if (document.querySelector('[class*="upload"], [class*="Upload"], [data-testid*="upload"]')) s += 2;
                return s;
            });
            scored.push({ frame, score });
        } catch {
            scored.push({ frame, score: 0 });
        }
    }
    return scored.sort((a, b) => b.score - a.score).map((item) => item.frame);
}

async function exposeFileInputsInFrames(page) {
    for (const frame of await getActionFrames(page)) {
        try {
            await frame.evaluate(() => {
                document.querySelectorAll('input[type="file"]').forEach((input) => {
                    input.style.cssText = 'opacity:1!important;display:block!important;position:fixed!important;top:50px!important;left:50px!important;width:300px!important;height:100px!important;z-index:999999!important;';
                });
            });
        } catch { }
    }
}

async function setInputFilesInFrames(page, filePath) {
    for (const frame of await getActionFrames(page)) {
        for (const sel of [
            'input[type="file"]',
            'input.accept[type="file"]',
            'input[accept*="video"]',
            'input[accept*="mp4"]',
        ]) {
            try {
                const locator = frame.locator(sel);
                const count = await locator.count();
                if (count > 0) {
                    await locator.first().setInputFiles(filePath);
                    return true;
                }
            } catch { }
        }
    }
    return false;
}

async function clickUploadAffordanceInFrames(page, filePath) {
    const hints = ['上传视频', '点击上传', '上传', '拖拽视频', '拖入视频', '选择视频', '本地上传', '发布视频'];
    for (const frame of await getActionFrames(page)) {
        try {
            const hasCandidate = await frame.evaluate((texts) => {
                const nodes = Array.from(document.querySelectorAll('button, a, div, span, label'));
                return nodes.some((el) => {
                    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
                    if (!text) return false;
                    if (!texts.some((t) => text.includes(t))) return false;
                    const rect = el.getBoundingClientRect();
                    return rect.width > 40 && rect.height > 20;
                }) || !!document.querySelector('[class*="upload"], [class*="Upload"], [data-testid*="upload"]');
            }, hints);
            if (!hasCandidate) continue;

            const chooserPromise = page.waitForEvent('filechooser', { timeout: 2500 }).catch(() => null);
            const clicked = await frame.evaluate((texts) => {
                const nodes = Array.from(document.querySelectorAll('button, a, div, span, label'));
                const target = nodes.find((el) => {
                    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
                    if (!text) return false;
                    if (!texts.some((t) => text.includes(t))) return false;
                    const rect = el.getBoundingClientRect();
                    return rect.width > 40 && rect.height > 20;
                });
                if (target) {
                    target.click();
                    return true;
                }
                const dropzone = document.querySelector('[class*="upload"], [class*="Upload"], [data-testid*="upload"]');
                if (dropzone instanceof HTMLElement) {
                    dropzone.click();
                    return true;
                }
                return false;
            }, hints);
            if (!clicked) continue;

            const chooser = await chooserPromise;
            if (chooser) {
                await chooser.setFiles(filePath);
                return true;
            }
            await sleep(1000);
        } catch { }
    }
    return false;
}

async function uploadVideoAuto(page, stagehand, filePath) {
    const maxAttempts = 12;
    for (let i = 1; i <= maxAttempts; i++) {
        await ensureUploadComposer(page);
        await exposeFileInputsInFrames(page);
        await sleep(800);

        if (await setInputFilesInFrames(page, filePath)) {
            return { ok: true, method: 'input' };
        }
        if (await clickUploadAffordanceInFrames(page, filePath)) {
            return { ok: true, method: 'filechooser' };
        }

        try {
            await stagehand.act('click the video upload area or the button to upload a video file');
            await sleep(1500);
            if (await setInputFilesInFrames(page, filePath)) {
                return { ok: true, method: 'act+input' };
            }
            if (await clickUploadAffordanceInFrames(page, filePath)) {
                return { ok: true, method: 'act+filechooser' };
            }
        } catch { }

        console.log(`   ⏳ 第 ${i}/${maxAttempts} 次自动定位上传入口未命中，继续重试...`);
        await sleep(2000);
    }
    return { ok: false, method: 'none' };
}

async function isPublishReadyInFrames(page) {
    for (const frame of await getActionFrames(page)) {
        try {
            const ready = await frame.evaluate(() => {
                const btns = document.querySelectorAll('button');
                for (const b of btns) {
                    if (b.textContent?.trim() === '发布' && !b.disabled) return true;
                }
                return false;
            });
            if (ready) return true;
        } catch { }
    }
    return false;
}

async function fillDescriptionInFrames(page, desc) {
    for (const frame of await getActionFrames(page)) {
        try {
            const filled = await frame.evaluate((value) => {
                const selectors = [
                    '.notranslate[contenteditable="true"]',
                    '[contenteditable="true"]',
                    '.ql-editor',
                    '.DraftEditor-root [contenteditable="true"]',
                    'textarea',
                ];
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && el.offsetWidth > 0) {
                        el.focus();
                        if (el.tagName === 'TEXTAREA') {
                            el.value = value;
                        } else {
                            el.innerHTML = value;
                        }
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        return { ok: true };
                    }
                }
                return { ok: false };
            }, desc);
            if (filled?.ok) return true;
        } catch { }
    }
    return false;
}

async function fillTitleInFrames(page, title) {
    for (const frame of await getActionFrames(page)) {
        try {
            const filled = await frame.evaluate((value) => {
                const selectors = [
                    'input[placeholder*="标题"]',
                    'textarea[placeholder*="标题"]',
                    'input[maxlength]'
                ];
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && el.offsetWidth > 0) {
                        el.focus();
                        el.value = value;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        return true;
                    }
                }
                return false;
            }, title);
            if (filled) return true;
        } catch { }
    }
    return false;
}

async function clickPublishInFrames(page) {
    for (const frame of await getActionFrames(page)) {
        try {
            const published = await frame.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const visiblePublishBtns = btns.filter((b) => {
                    const t = (b.textContent || '').trim();
                    if (t !== '发布') return false;
                    if (b.disabled) return false;
                    const rect = b.getBoundingClientRect();
                    if (rect.width < 40 || rect.height < 20) return false;
                    if (rect.y < window.innerHeight * 0.25) return false;
                    return true;
                });
                const target = visiblePublishBtns[0] || null;
                if (target) {
                    target.click();
                    return true;
                }
                return false;
            });
            if (published) return true;
        } catch { }
    }
    return false;
}

async function clickConfirmPopupInFrames(page) {
    for (const frame of await getActionFrames(page)) {
        try {
            const r = await frame.evaluate(() => {
                const btns = document.querySelectorAll('button');
                for (const b of btns) {
                    const t = b.textContent?.trim();
                    if (['确认', '确定', '我知道了', '知道了'].includes(t) && !b.disabled && b.offsetParent !== null) {
                        b.click();
                        return t;
                    }
                }
                return null;
            });
            if (r) return r;
        } catch { }
    }
    return null;
}

// ─── 主流程 ───
async function main() {
    // ═══ Step 1：初始化浏览器 ═══
    console.log('📌 Step 1：初始化浏览器...');
    const stagehand = new Stagehand({
        env: 'LOCAL',
        localBrowserLaunchOptions: {
            headless: false,
            viewport: { width: 1380, height: 900 },
            userDataDir,
            preserveUserDataDir: true,
        },
        model: modelConfig.model,
    });
    await stagehand.init();
    console.log('   ✅ 浏览器已启动');
    const page = stagehand.context.pages()[0];

    try {
        // ═══ Step 2：打开抖音创作者发布页 ═══
        console.log('\n📌 Step 2：打开发布页...');
        await page.goto(DY_PUBLISH_URL, { waitUntil: 'domcontentloaded' });
        await sleep(5000);

        // 检查是否需要登录
        const currentUrl = page.url();
        if (currentUrl.includes('login') || currentUrl.includes('passport') || await pageLooksLoggedOut(page)) {
            console.log('📱 需要登录，请在 Chromium 浏览器中用抖音 App 扫码登录...');
            await waitForEnter('   登录完成后按回车继续...');
            await page.goto(DY_PUBLISH_URL, { waitUntil: 'domcontentloaded' });
            await sleep(5000);
        }
        await ensureUploadComposer(page);
        console.log('   ✅ 发布页已打开');

        // ═══ Step 3：上传视频 ═══
        console.log('\n📌 Step 3：上传视频...');
        try {
            const uploaded = await uploadVideoAuto(page, stagehand, videoPath);
            if (!uploaded.ok) throw new Error('找不到可用的上传 input 或 filechooser');
            console.log(`   ✅ 视频已上传（${uploaded.method}）`);
        } catch (err) {
            console.log(`   ❌ 自动上传失败：${err.message.substring(0, 80)}`);
            await waitForEnter('   请在浏览器中手动上传视频后按回车...');
        }

        // 等待视频处理
        console.log('\n⏳ 等待视频处理...');
        let videoReady = false;
        for (let i = 0; i < 60; i++) {
            await sleep(5000);
            process.stdout.write(`\r   已等待 ${(i + 1) * 5} 秒...`);
            try {
                const ready = await isPublishReadyInFrames(page);
                if (ready) { console.log('\n   ✅ 视频处理完成'); videoReady = true; break; }
            } catch { }
        }
        if (!videoReady) console.log('\n   ⚠️ 等待超时，尝试继续...');

        // ═══ Step 4：填写描述/标题 ═══
        console.log('\n📌 Step 4：填写视频信息...');

        if (videoDesc) {
            try {
                const filled = await fillDescriptionInFrames(page, videoDesc);
                if (filled) {
                    console.log('   ✅ 描述已填写');
                } else {
                    console.log('   ⚠️ 未自动定位到描述框，请手动填写后按回车继续');
                    await waitForEnter('   已填写描述后按回车...');
                }
            } catch (err) {
                console.log(`   ⚠️ 描述填写失败：${err.message.substring(0, 60)}`);
                await waitForEnter('   请手动填写描述后按回车...');
            }
        } else {
            console.log('   跳过描述（未指定）');
        }

        if (videoTitle) {
            try {
                const titleFilled = await fillTitleInFrames(page, videoTitle);
                if (titleFilled) {
                    console.log('   ✅ 标题已填写');
                } else {
                    console.log('   ⚠️ 未自动定位到标题框，请手动填写后按回车继续');
                    await waitForEnter('   已填写标题后按回车...');
                }
            } catch (err) {
                console.log(`   ⚠️ 标题填写失败：${err.message.substring(0, 60)}`);
                await waitForEnter('   请手动填写标题后按回车...');
            }
        }

        await sleep(2000);

        // ═══ Step 5：点击发布 ═══
        console.log('\n📌 Step 5：点击发布...');
        try {
            const published = await clickPublishInFrames(page);
            if (published) {
                console.log('   ✅ 已点击发布');
            } else {
                console.log('   ⚠️ 未定位到发布按钮，请手动点击发布后按回车继续');
                await waitForEnter('   已点击发布后按回车...');
            }
        } catch (err) {
            console.log(`   ⚠️ ${err.message.substring(0, 80)}`);
            await waitForEnter('   请手动点击发布后按回车...');
        }

        // 等待页面跳转
        for (let i = 0; i < 15; i++) {
            await sleep(2000);
            if (!page.url().includes('/upload')) {
                console.log(`   ✅ 页面已跳转`);
                break;
            }
            try {
                const r = await clickConfirmPopupInFrames(page);
                if (r) console.log(`   ✅ 已处理弹窗：「${r}」`);
            } catch { }
        }

        await sleep(3000);

        // ═══ 完成 ═══
        const afterUrl = page.url();
        if (!afterUrl.includes('/upload')) {
            console.log('\n🎉 发布成功！');
        } else {
            console.log('\n⚠️ 请在抖音创作者后台确认发布状态');
        }
        console.log('\n' + '═'.repeat(50));
        console.log('🎉 抖音发布流程完成！');
        console.log('═'.repeat(50));

    } catch (err) {
        console.error(`\n❌ 出错：${err.message}`);
        console.error(err.stack);
    }

    console.log('\n⏳ 5 秒后关闭浏览器...');
    await sleep(5000);
    await stagehand.close();
    console.log('🔚 浏览器已关闭');
}

main().catch((err) => {
    console.error('❌ 失败：', err.message);
    process.exit(1);
});
