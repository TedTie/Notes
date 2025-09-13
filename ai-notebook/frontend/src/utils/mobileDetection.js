/**
 * 移动端设备检测工具
 * 用于在Vercel部署环境中准确识别移动设备
 */

// 移动端检测函数 - 基于宽高比的精确检测
export const detectMobileDevice = () => {
  // 检查是否在浏览器环境中
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // 获取屏幕宽高比
  const screenWidth = window.innerWidth || window.screen.width
  const screenHeight = window.innerHeight || window.screen.height
  const aspectRatio = screenWidth / screenHeight
  
  // 主流手机宽高比范围（基于市场调研数据）
  // iPhone: 19.5:9 (2.17), 20:9 (2.22)
  // Android: 18:9 (2.0), 18.5:9 (2.06), 19:9 (2.11), 19.5:9 (2.17), 20:9 (2.22), 21:9 (2.33), 22:9 (2.44)
  // 电脑端常见比例: 4:3 (1.33), 16:10 (1.6), 16:9 (1.78), 21:9 (2.33 超宽屏)
  
  const isMobileAspectRatio = (
    // 竖屏模式 - 手机的主要使用方式
    aspectRatio < 1.0
  )
  
  // 电脑端宽高比判断（更宽泛的桌面环境识别）
  const isDesktopAspectRatio = (
    // 标准电脑比例
    (aspectRatio >= 1.3 && aspectRatio <= 1.35) || // 4:3
    (aspectRatio >= 1.6 && aspectRatio <= 1.65) || // 16:10
    (aspectRatio >= 1.75 && aspectRatio <= 1.8) || // 16:9
    // 宽屏和超宽屏电脑（包含所有横屏比例 > 1.8）
    (aspectRatio > 1.8 && screenWidth > 800) ||
    // 特殊处理：任何宽度超过1000px的环境都视为桌面
    (screenWidth > 1000)
  )
  
  // 综合判断：更保守的移动端检测
  const isMobile = isMobileUA || 
                   (isTouchDevice && isMobileAspectRatio && screenWidth <= 800) ||
                   (isMobileAspectRatio && !isDesktopAspectRatio && screenWidth <= 600)
  
  // 调试信息
  console.log('Aspect Ratio Detection Update:', {
    userAgent: userAgent,
    isMobileUA: isMobileUA,
    isTouchDevice: isTouchDevice,
    screenSize: `${screenWidth}x${screenHeight}`,
    aspectRatio: aspectRatio.toFixed(2),
    isMobileAspectRatio: isMobileAspectRatio,
    isDesktopAspectRatio: isDesktopAspectRatio,
    finalResult: isMobile,
    detectionMethod: 'aspect-ratio-based'
  })
  
  return isMobile
}

// 应用移动端样式
export const applyMobileStyles = (isMobile) => {
  if (typeof document === 'undefined') return
  
  if (isMobile) {
    document.documentElement.classList.add('force-mobile')
    document.body.classList.add('mobile-device')
    
    // 确保viewport设置正确
    let viewport = document.querySelector('meta[name=viewport]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    }
    
    // 添加移动端特定的CSS变量
    document.documentElement.style.setProperty('--is-mobile', '1')
  } else {
    document.documentElement.classList.remove('force-mobile')
    document.body.classList.remove('mobile-device')
    document.documentElement.style.setProperty('--is-mobile', '0')
  }
}

// 初始化移动端检测
export const initMobileDetection = () => {
  if (typeof window === 'undefined') return
  
  const updateMobileStatus = () => {
    const isMobile = detectMobileDevice()
    applyMobileStyles(isMobile)
    
    // 调试信息（仅在开发环境）
    if (import.meta.env.DEV) {
      const screenWidth = window.innerWidth || window.screen.width
      const screenHeight = window.innerHeight || window.screen.height
      const aspectRatio = screenWidth / screenHeight
      
      console.log('Mobile Detection Update:', {
        userAgent: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(navigator.userAgent.toLowerCase()),
        touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        smallScreen: window.innerWidth <= 768 || window.screen.width <= 768,
        portrait: window.innerHeight > window.innerWidth,
        aspectRatio: aspectRatio.toFixed(2),
        aspectRatioCategory: aspectRatio < 1.0 ? '竖屏' : 
                           aspectRatio <= 1.5 ? '4:3类型' :
                           aspectRatio <= 1.9 ? '16:9类型' :
                           aspectRatio <= 2.4 ? '超宽屏' : '极宽屏',
        isMobileAspectRatio: aspectRatio < 1.0 || 
                            (aspectRatio > 2.0 && screenWidth <= 1024) || 
                            (aspectRatio >= 1.8 && aspectRatio <= 2.4 && screenWidth <= 768),
        finalResult: isMobile,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
      })
    }
    
    return isMobile
  }
  
  // 立即执行检测
  updateMobileStatus()
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateMobileStatus)
  
  // 监听设备方向变化
  window.addEventListener('orientationchange', () => {
    setTimeout(updateMobileStatus, 100)
  })
  
  // 页面加载完成后再次检测
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateMobileStatus)
  }
  
  // 返回清理函数
  return () => {
    window.removeEventListener('resize', updateMobileStatus)
    window.removeEventListener('orientationchange', updateMobileStatus)
    document.removeEventListener('DOMContentLoaded', updateMobileStatus)
  }
}

// 强制刷新移动端检测
export const forceMobileDetection = () => {
  const isMobile = detectMobileDevice()
  applyMobileStyles(isMobile)
  return isMobile
}

// 检查当前是否为移动设备
export const isMobileDevice = () => {
  if (typeof document === 'undefined') return false
  return document.body.classList.contains('mobile-device')
}