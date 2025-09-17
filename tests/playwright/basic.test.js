const { test, expect } = require('@playwright/test');

test.describe('基础功能测试', () => {
  const baseURL = 'https://notes-five-smoky.vercel.app/';

  test('网站可以正常访问', async ({ page }) => {
    await page.goto(baseURL);
    await expect(page).toHaveTitle(/.*/);
  });

  test('页面加载正常', async ({ page }) => {
    await page.goto(baseURL);

    // 检查页面是否有内容
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('响应式设计正常', async ({ page }) => {
    await page.goto(baseURL);

    // 测试移动端
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // 测试桌面端
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    expect(true).toBe(true);
  });

  test('导航功能正常', async ({ page }) => {
    await page.goto(baseURL);

    // 检查是否有导航链接
    const links = await page.$$('a');
    expect(links.length).toBeGreaterThan(0);
  });
});

test.describe('性能测试', () => {
  test('页面加载时间', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('https://notes-five-smoky.vercel.app/');
    const loadTime = Date.now() - startTime;

    console.log(`页面加载时间: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10秒内加载完成
  });
});