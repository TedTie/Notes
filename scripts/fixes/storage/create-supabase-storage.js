// 创建 Supabase Storage 存储桶的脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 使用环境变量中的配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 配置信息');
  console.log('请确保 .env 文件包含:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 使用 Service Role Key 创建客户端（具有管理员权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBuckets() {
  console.log('🚀 开始创建 Supabase Storage 存储桶...');
  
  try {
    // 1. 检查现有存储桶
    console.log('📋 检查现有存储桶...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ 获取存储桶列表失败:', listError.message);
      return;
    }
    
    console.log('✅ 现有存储桶:', buckets.map(b => b.name));
    
    // 2. 创建 backgrounds 存储桶（如果不存在）
    const backgroundsBucketExists = buckets.some(bucket => bucket.name === 'backgrounds');
    
    if (!backgroundsBucketExists) {
      console.log('📁 创建 backgrounds 存储桶...');
      const { data: createData, error: createError } = await supabase.storage
        .createBucket('backgrounds', {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/webm',
            'video/quicktime'
          ],
          fileSizeLimit: 52428800 // 50MB
        });
        
      if (createError) {
        console.error('❌ 创建 backgrounds 存储桶失败:', createError.message);
      } else {
        console.log('✅ backgrounds 存储桶创建成功');
      }
    } else {
      console.log('✅ backgrounds 存储桶已存在');
    }
    
    // 3. 创建 uploads 存储桶（如果不存在）
    const uploadsBucketExists = buckets.some(bucket => bucket.name === 'uploads');
    
    if (!uploadsBucketExists) {
      console.log('📁 创建 uploads 存储桶...');
      const { data: createData, error: createError } = await supabase.storage
        .createBucket('uploads', {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/json'
          ],
          fileSizeLimit: 52428800 // 50MB
        });
        
      if (createError) {
        console.error('❌ 创建 uploads 存储桶失败:', createError.message);
      } else {
        console.log('✅ uploads 存储桶创建成功');
      }
    } else {
      console.log('✅ uploads 存储桶已存在');
    }
    
    // 4. 设置存储策略
    console.log('🔐 设置存储策略...');
    
    // 为 backgrounds 存储桶设置策略
    const backgroundsPolicies = [
      {
        name: 'Allow public uploads to backgrounds',
        definition: `
          CREATE POLICY "Allow public uploads to backgrounds" ON storage.objects
          FOR INSERT TO public
          WITH CHECK (bucket_id = 'backgrounds');
        `
      },
      {
        name: 'Allow public downloads from backgrounds', 
        definition: `
          CREATE POLICY "Allow public downloads from backgrounds" ON storage.objects
          FOR SELECT TO public
          USING (bucket_id = 'backgrounds');
        `
      }
    ];
    
    // 为 uploads 存储桶设置策略
    const uploadsPolicies = [
      {
        name: 'Allow public uploads to uploads',
        definition: `
          CREATE POLICY "Allow public uploads to uploads" ON storage.objects
          FOR INSERT TO public
          WITH CHECK (bucket_id = 'uploads');
        `
      },
      {
        name: 'Allow public downloads from uploads',
        definition: `
          CREATE POLICY "Allow public downloads from uploads" ON storage.objects
          FOR SELECT TO public
          USING (bucket_id = 'uploads');
        `
      }
    ];
    
    console.log('✅ 存储桶和策略设置完成!');
    console.log('');
    console.log('📝 下一步操作:');
    console.log('1. 在 Supabase Dashboard > Storage 中验证存储桶已创建');
    console.log('2. 在 Supabase Dashboard > SQL Editor 中执行以下 SQL:');
    console.log('');
    console.log('-- 为 backgrounds 存储桶设置策略');
    backgroundsPolicies.forEach(policy => {
      console.log(policy.definition.trim());
    });
    console.log('');
    console.log('-- 为 uploads 存储桶设置策略');
    uploadsPolicies.forEach(policy => {
      console.log(policy.definition.trim());
    });
    console.log('');
    console.log('3. 更新 Vercel 环境变量:');
    console.log(`   VITE_SUPABASE_URL=${supabaseUrl}`);
    console.log(`   VITE_SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}`);
    console.log('');
    console.log('4. 重新部署应用测试文件上传功能');
    
  } catch (error) {
    console.error('❌ 创建存储桶过程中发生错误:', error.message);
  }
}

// 运行脚本
createStorageBuckets();