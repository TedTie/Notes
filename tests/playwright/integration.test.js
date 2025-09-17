const { test, expect } = require('@playwright/test');

test.describe('集成测试', () => {
  const baseURL = 'https://notes-five-smoky.vercel.app/';

  test('用户流程测试', async ({ page }) => {
    await page.goto(baseURL);

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();

    // 截屏保存
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
  });

  test('表单功能测试', async ({ page }) => {
    await page.goto(baseURL);

    // 查找表单元素
    const inputs = await page.$$('input');
    const buttons = await page.$$('button');

    console.log(`找到 ${inputs.length} 个输入框, ${buttons.length} 个按钮`);

    // 如果有输入框，测试输入功能
    if (inputs.length > 0) {
      await inputs[0].type('测试文本');
      const value = await inputs[0].inputValue();
      expect(value).toBe('测试文本');
    }
  });

  test('API连接测试', async ({ page }) => {
    await page.goto(baseURL);

    // 监听API请求
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // 等待一段时间收集API响应
    await page.waitForTimeout(3000);

    console.log(`捕获到 ${responses.length} 个API响应`);
    responses.forEach(response => {
      console.log(`${response.url}: ${response.status}`);
    });
  });
});

test.describe('响应式测试', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    test(`${viewport.name}视图测试`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('https://notes-five-smoky.vercel.app/');
      await page.waitForLoadState('networkidle');

      // 截屏
      await page.screenshot({
        path: `test-results/${viewport.name}.png`,
        fullPage: true
      });

      // 检查页面是否正常加载
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    });
  });
});