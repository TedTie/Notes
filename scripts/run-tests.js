// 测试运行器
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始运行测试...');

const tests = [
  {
    name: '基础文件检查',
    run: () => {
      const requiredFiles = [
        '.claude/workflow-config.json',
        '.claude/commands.md',
        'package.json',
        'auto-workflow.ps1',
        'quick-test.ps1'
      ];

      requiredFiles.forEach(file => {
        if (!fs.existsSync(file)) {
          throw new Error(`缺少文件: ${file}`);
        }
      });
      console.log('✅ 基础文件检查通过');
    }
  },
  {
    name: '依赖检查',
    run: () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (!packageJson.dependencies && !packageJson.devDependencies) {
        throw new Error('package.json中没有找到依赖');
      }
      console.log('✅ 依赖检查通过');
    }
  },
  {
    name: '配置文件验证',
    run: () => {
      const config = JSON.parse(fs.readFileSync('.claude/workflow-config.json', 'utf8'));
      if (!config.project || !config.deployment || !config.database) {
        throw new Error('workflow-config.json格式不正确');
      }
      console.log('✅ 配置文件验证通过');
    }
  }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  try {
    console.log(`\n🧪 运行测试: ${test.name}`);
    test.run();
    passed++;
  } catch (error) {
    console.log(`❌ 测试失败: ${test.name}`);
    console.log(`   错误: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 测试结果:`);
console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);
console.log(`📈 成功率: ${Math.round((passed / tests.length) * 100)}%`);

if (failed > 0) {
  console.log('\n❌ 部分测试失败');
  process.exit(1);
} else {
  console.log('\n🎉 所有测试通过!');
  process.exit(0);
}