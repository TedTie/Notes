// 环境检查脚本
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 检查环境配置...');

const checks = [
  {
    name: 'Node.js',
    check: () => {
      const version = process.version;
      console.log(`✅ Node.js版本: ${version}`);
      return true;
    }
  },
  {
    name: 'npm',
    check: () => {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✅ npm版本: ${version}`);
      return true;
    }
  },
  {
    name: '项目目录',
    check: () => {
      const requiredDirs = ['frontend', 'api', 'supabase'];
      requiredDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          console.log(`✅ ${dir}目录存在`);
        } else {
          console.log(`⚠️ ${dir}目录不存在`);
        }
      });
      return true;
    }
  },
  {
    name: '环境变量',
    check: () => {
      const envFile = '.env';
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const hasDatabaseUrl = content.includes('DATABASE_URL');
        const hasJwtSecret = content.includes('JWT_SECRET');

        if (hasDatabaseUrl) console.log('✅ 找到DATABASE_URL');
        else console.log('⚠️ 缺少DATABASE_URL');

        if (hasJwtSecret) console.log('✅ 找到JWT_SECRET');
        else console.log('⚠️ 缺少JWT_SECRET');
      } else {
        console.log('⚠️ .env文件不存在');
      }
      return true;
    }
  }
];

checks.forEach(check => {
  try {
    console.log(`\n🔍 检查${check.name}...`);
    check.check();
  } catch (error) {
    console.log(`❌ ${check.name}检查失败: ${error.message}`);
  }
});

console.log('\n🎉 环境检查完成!');