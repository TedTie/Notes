# Vercel部署入口文件
# 导入主应用
import sys
import os

# 添加父目录到Python路径，以便导入app模块
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app

# 创建应用实例
app = create_app()

# Vercel需要这个变量
app = app

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)