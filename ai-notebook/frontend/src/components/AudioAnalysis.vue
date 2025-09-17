<template>
  <div class="audio-analysis">
    <!-- 音频上传区域 -->
    <div class="futuristic-card mb-8">
      <div class="futuristic-header mb-6">
        <h2 class="futuristic-title-medium">{{ languageService.t('audio.analysis.workflow.title') }}</h2>
        <div class="futuristic-subtitle">{{ languageService.t('audio.analysis.workflow.subtitle') }}</div>
      </div>
      
      <!-- 拖拽上传区域 -->
      <div 
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        :class="[
          'upload-zone border-2 border-dashed rounded-xl p-12 text-center transition-all duration-500 relative overflow-hidden',
          isDragging ? 'border-green-400 bg-green-500/10 scale-105' : 'border-cyber-primary/30 hover:border-cyber-primary/60 hover:bg-cyber-primary/5'
        ]"
      >
        <div v-if="!selectedFile" class="relative z-10">
          <div class="futuristic-icon-container mb-8">
            <svg class="mx-auto h-20 w-20 text-cyber-primary/60 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <h3 class="futuristic-title-small mb-4">{{ languageService.t('audio.upload.drag.title') }}</h3>
          <p class="futuristic-subtitle mb-8">{{ languageService.t('audio.upload.drag.subtitle') }}</p>
          <button @click="triggerFileInput" class="futuristic-btn-primary group">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5L12 5H5a2 2 0 00-2 2z"></path>
              </svg>
              <span>{{ languageService.t('audio.upload.selectFile') }}</span>
            </div>
          </button>
          <input 
            ref="fileInput"
            type="file"
            accept="audio/*"
            @change="handleFileSelect"
            class="hidden"
          >
        </div>
        
        <!-- 已选择文件 -->
        <div v-else class="selected-file relative z-10">
          <div class="futuristic-card bg-gradient-to-br from-cyber-primary/10 to-transparent mb-6">
            <div class="flex items-center space-x-6 mb-6">
              <div class="futuristic-icon-container">
                <svg class="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="futuristic-title-small mb-2">{{ selectedFile.name }}</h3>
                <div class="flex items-center space-x-4 text-sm">
                  <span class="futuristic-subtitle flex items-center space-x-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <span>{{ formatFileSize(selectedFile.size) }}</span>
                  </span>
                  <span class="futuristic-subtitle flex items-center space-x-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{{ formatDuration(audioDuration) }}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <!-- 音频预览 -->
            <audio 
              ref="audioPlayer"
              :src="audioPreviewUrl"
              controls
              class="w-full mb-6 rounded-lg bg-cyber-dark/50"
              @loadedmetadata="updateDuration"
            ></audio>
          </div>
          
          <div class="flex space-x-4">
            <button @click="startAnalysis" :disabled="isProcessing" class="futuristic-btn-primary flex-1 group disabled:opacity-50">
              <div class="flex items-center justify-center space-x-2">
                <svg v-if="isProcessing" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span>{{ isProcessing ? languageService.t('audio.analysis.processing') : languageService.t('audio.analysis.start') }}</span>
              </div>
            </button>
            <button @click="clearFile" class="futuristic-btn-danger group">
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                <span>{{ languageService.t('audio.upload.clear') }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 处理进度 -->
    <div v-if="isProcessing" class="futuristic-card mb-8 bg-gradient-to-br from-blue-500/10 to-transparent">
      <div class="futuristic-header mb-6">
        <h3 class="futuristic-title-small">{{ languageService.t('audio.processing.title') }}</h3>
        <div class="futuristic-subtitle">{{ languageService.t('audio.processing.subtitle') }}</div>
      </div>
      
      <div class="space-y-6">
        <div v-for="step in processingSteps" :key="step.id" class="flex items-center space-x-4">
          <div :class="[
            'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500',
            step.status === 'completed' ? 'bg-green-500/20 border-green-400 text-green-400' :
            step.status === 'processing' ? 'bg-blue-500/20 border-blue-400 text-blue-400 animate-pulse scale-110' :
            'bg-cyber-primary/10 border-cyber-primary/30 text-cyber-primary/60'
          ]">
            <svg v-if="step.status === 'completed'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <svg v-else-if="step.status === 'processing'" class="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span v-else class="text-lg">{{ step.id }}</span>
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-lg futuristic-title mb-1">{{ getProcessingStepTitle(step.title) }}</h4>
            <p class="futuristic-subtitle">{{ getProcessingStepDescription(step.description) }}</p>
          </div>
          <div v-if="step.status === 'processing'" class="text-right">
            <div class="text-lg font-bold text-blue-400 mb-1">{{ step.progress }}%</div>
            <div class="w-20 h-2 bg-cyber-primary/20 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300"
                :style="{ width: step.progress + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分析结果 -->
    <div v-if="analysisResult" class="results-section space-y-6">
      <!-- 转录结果 -->
      <div class="futuristic-card mb-8 bg-gradient-to-br from-green-500/10 to-transparent">
        <div class="futuristic-header mb-6">
          <h3 class="futuristic-title-small">{{ languageService.t('audio.results.transcription.title') }}</h3>
          <button 
            @click="copyToClipboard(analysisResult.transcription)"
            class="futuristic-btn-secondary group"
          >
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <span>{{ languageService.t('common.copy') }}</span>
            </div>
          </button>
        </div>
        <div class="futuristic-card bg-cyber-dark/30 border border-cyber-primary/20 max-h-60 overflow-y-auto">
          <p class="text-sm leading-relaxed futuristic-subtitle">{{ analysisResult.transcription }}</p>
        </div>
      </div>
      
      <!-- AI分析结果 -->
      <div class="futuristic-card mb-8 bg-gradient-to-br from-purple-500/10 to-transparent">
        <div class="futuristic-header mb-8">
          <h3 class="futuristic-title-small">{{ languageService.t('audio.results.analysis.title') }}</h3>
          <div class="futuristic-subtitle">{{ languageService.t('audio.results.analysis.subtitle') }}</div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 摘要 -->
          <div class="futuristic-card bg-cyber-gray/10">
            <div class="flex items-center space-x-3 mb-4">
              <div class="futuristic-icon-container">
                <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h4 class="futuristic-title">{{ languageService.t('audio.results.summary.title') }}</h4>
            </div>
            <div class="futuristic-card bg-cyber-dark/30 border border-cyber-primary/20">
              <p class="text-sm leading-relaxed futuristic-subtitle">{{ analysisResult.summary }}</p>
            </div>
          </div>
          
          <!-- 关键词 -->
          <div class="futuristic-card bg-cyber-gray/10">
            <div class="flex items-center space-x-3 mb-4">
              <div class="futuristic-icon-container">
                <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
              </div>
              <h4 class="futuristic-title">{{ languageService.t('audio.results.keywords.title') }}</h4>
            </div>
            <div class="flex flex-wrap gap-3">
              <span 
                v-for="keyword in analysisResult.keywords"
                :key="keyword"
                class="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full text-sm border border-green-400/30 hover:scale-105 transition-transform"
              >
                {{ keyword }}
              </span>
            </div>
          </div>
          
          <!-- 行动项 -->
          <div class="futuristic-card bg-cyber-gray/10">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                </div>
                <h4 class="futuristic-title">{{ languageService.t('audio.results.actionItems.title') }}</h4>
              </div>
              <button 
                v-if="analysisResult.action_items && analysisResult.action_items.length > 0"
                @click="addActionItemsToTodos"
                class="futuristic-btn-secondary group"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span>{{ languageService.t('audio.results.actionItems.addToTodo') }}</span>
                </div>
              </button>
            </div>
            <div class="space-y-3">
              <div 
                v-for="(item, index) in analysisResult.action_items"
                :key="index"
                class="futuristic-card bg-cyber-dark/30 border border-cyber-primary/20 hover:border-yellow-400/50 transition-colors"
              >
                <div class="flex items-start space-x-2 text-sm">
                  <span class="text-yellow-400 mt-1">•</span>
                  <span class="futuristic-subtitle">{{ item }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 情感分析 -->
          <div class="futuristic-card bg-cyber-gray/10">
            <div class="flex items-center space-x-3 mb-4">
              <div class="futuristic-icon-container">
                <svg class="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h4 class="futuristic-title">{{ languageService.t('audio.results.sentiment.title') }}</h4>
            </div>
            <div class="futuristic-card bg-cyber-dark/30 border border-cyber-primary/20">
              <div class="flex items-center space-x-6">
                <div class="text-4xl">{{ getSentimentEmoji(analysisResult.sentiment) }}</div>
                <div class="flex-1">
                  <h5 class="font-semibold text-lg futuristic-title mb-2">{{ getSentimentText(analysisResult.sentiment) }}</h5>
                  <p class="text-sm futuristic-subtitle">{{ analysisResult.sentiment_explanation }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 会议记录 -->
        <div v-if="analysisResult.meeting_notes" class="mt-8">
          <div class="futuristic-card bg-gradient-to-br from-cyan-500/10 to-transparent">
            <div class="futuristic-header mb-6">
              <div class="flex items-center space-x-3">
                <div class="futuristic-icon-container">
                  <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                </div>
                <h4 class="futuristic-title-large">{{ languageService.t('audio.results.meetingNotes.title') }}</h4>
              </div>
              <button 
                @click="saveAsNote"
                class="futuristic-btn-secondary group"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                  </svg>
                  <span>{{ languageService.t('audio.results.meetingNotes.saveAsNote') }}</span>
                </div>
              </button>
            </div>
            <div class="futuristic-card bg-cyber-gray/20 border border-cyan-400/30">
              <pre class="text-sm futuristic-subtitle whitespace-pre-wrap">{{ analysisResult.meeting_notes }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="futuristic-card mb-8 bg-gradient-to-br from-orange-500/10 to-transparent">
        <div class="futuristic-header mb-6">
          <h3 class="futuristic-title-small">{{ languageService.t('audio.results.actions.title') }}</h3>
          <div class="futuristic-subtitle">{{ languageService.t('audio.results.actions.subtitle') }}</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button @click="downloadTranscription" class="futuristic-btn-primary group">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>{{ languageService.t('audio.results.actions.downloadTranscription') }}</span>
            </div>
          </button>
          <button @click="downloadAnalysis" class="futuristic-btn-primary group">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a4 4 0 01-4 4z"></path>
              </svg>
              <span>{{ languageService.t('audio.results.actions.downloadAnalysis') }}</span>
            </div>
          </button>
          <button @click="shareResults" class="futuristic-btn-primary group">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
              <span>{{ languageService.t('audio.results.actions.shareResults') }}</span>
            </div>
          </button>
          <button @click="startNewAnalysis" class="futuristic-btn-danger group">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{{ languageService.t('audio.results.actions.newAnalysis') }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 历史记录 -->
    <div class="futuristic-card mt-8 bg-gradient-to-br from-indigo-500/10 to-transparent">
      <div class="futuristic-header mb-6">
        <h3 class="futuristic-title-small">{{ languageService.t('audio.history.title') }}</h3>
        <button @click="loadHistory" class="futuristic-btn-secondary group">
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>{{ languageService.t('common.refresh') }}</span>
          </div>
        </button>
      </div>
      
      <div v-if="analysisHistory.length === 0" class="text-center py-12">
        <div class="futuristic-icon-container mb-6">
          <svg class="w-20 h-20 text-cyber-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h4 class="futuristic-title mb-2">{{ languageService.t('audio.history.empty.title') }}</h4>
        <p class="futuristic-subtitle">{{ languageService.t('audio.history.empty.subtitle') }}</p>
      </div>
      
      <div v-else class="space-y-4">
        <div 
          v-for="item in analysisHistory"
          :key="item.id"
          @click="loadHistoryItem(item)"
          class="futuristic-card cursor-pointer hover:border-cyber-primary/60 hover:bg-cyber-primary/5 hover:scale-[1.02] transition-all duration-300 group"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="futuristic-icon-container group-hover:scale-110 transition-transform">
                <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                </svg>
              </div>
              <div>
                <h4 class="futuristic-title mb-1">{{ item.filename }}</h4>
                <p class="futuristic-subtitle text-xs">{{ formatDate(item.created_at) }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full text-xs border border-green-400/30">
                {{ formatDuration(item.duration) }}
              </span>
              <button 
                @click.stop="deleteHistoryItem(item.id)"
                class="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all group/delete"
              >
                <svg class="w-4 h-4 group-hover/delete:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import aiService from '../services/aiService'
import notesService from '../services/notesService'
import todosService from '../services/todosService'
import languageService from '../services/languageService'

// 响应式数据
const selectedFile = ref(null)
const audioPreviewUrl = ref('')
const audioDuration = ref(0)
const isDragging = ref(false)
const isProcessing = ref(false)
const analysisResult = ref(null)
const analysisHistory = ref([])
const fileInput = ref(null)
const audioPlayer = ref(null)

const processingSteps = ref([
  { id: 1, title: 'audio.processing.steps.upload.title', description: 'audio.processing.steps.upload.description', status: 'pending', progress: 0 },
  { id: 2, title: 'audio.processing.steps.transcription.title', description: 'audio.processing.steps.transcription.description', status: 'pending', progress: 0 },
  { id: 3, title: 'audio.processing.steps.analysis.title', description: 'audio.processing.steps.analysis.description', status: 'pending', progress: 0 },
  { id: 4, title: 'audio.processing.steps.report.title', description: 'audio.processing.steps.report.description', status: 'pending', progress: 0 }
])

const getProcessingStepTitle = (key) => languageService.t(key)
const getProcessingStepDescription = (key) => languageService.t(key)

// 方法
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectFile(file)
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    selectFile(files[0])
  }
}

const selectFile = (file) => {
  // 验证文件类型
  if (!file.type || !file.type.startsWith('audio/')) {
    alert(languageService.t('audio.validation.invalidFileType'))
    return
  }
  
  // 验证文件大小 (50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert(languageService.t('audio.validation.fileSizeLimit'))
    return
  }
  
  selectedFile.value = file
  audioPreviewUrl.value = URL.createObjectURL(file)
}

const clearFile = () => {
  selectedFile.value = null
  audioPreviewUrl.value = ''
  audioDuration.value = 0
  analysisResult.value = null
  resetProcessingSteps()
}

const updateDuration = () => {
  if (audioPlayer.value) {
    audioDuration.value = audioPlayer.value.duration || 0
  }
}

const resetProcessingSteps = () => {
  processingSteps.value.forEach(step => {
    step.status = 'pending'
    step.progress = 0
  })
}

const updateProcessingStep = (stepId, status, progress = 0) => {
  const step = processingSteps.value.find(s => s.id === stepId)
  if (step) {
    step.status = status
    step.progress = progress
  }
}

const startAnalysis = async () => {
  if (!selectedFile.value) return
  
  isProcessing.value = true
  resetProcessingSteps()
  
  try {
    // 步骤1: 上传文件
    updateProcessingStep(1, 'processing', 0)
    const uploadResult = await aiService.uploadAudio(selectedFile.value)
    updateProcessingStep(1, 'completed', 100)
    
    if (!uploadResult.success && !uploadResult.id) {
      throw new Error(languageService.t('audio.errors.uploadFailed'))
    }
    
    const audioId = uploadResult.audio_id || uploadResult.id
    
    // 步骤2: 转录音频
    updateProcessingStep(2, 'processing', 0)
    const transcriptionResult = await aiService.transcribeAudio(audioId)
    updateProcessingStep(2, 'completed', 100)
    
    if (!transcriptionResult.success && !transcriptionResult.transcript) {
      throw new Error(languageService.t('audio.errors.transcriptionFailed'))
    }
    
    // 步骤3: AI分析
    updateProcessingStep(3, 'processing', 0)
    const analysisResponse = await aiService.analyzeAudio(audioId)
    updateProcessingStep(3, 'completed', 100)
    
    if (!analysisResponse.success && !analysisResponse.result) {
      throw new Error(languageService.t('audio.errors.analysisFailed'))
    }
    
    // 步骤4: 生成报告
    updateProcessingStep(4, 'processing', 0)
    analysisResult.value = {
      transcription: transcriptionResult.transcript || transcriptionResult.transcription,
      summary: analysisResponse.result?.summary || analysisResponse.summary,
      keywords: analysisResponse.result?.keywords || analysisResponse.keywords,
      action_items: analysisResponse.result?.action_items || analysisResponse.action_items,
      sentiment: analysisResponse.result?.sentiment || analysisResponse.sentiment,
      sentiment_explanation: analysisResponse.result?.sentiment_explanation || analysisResponse.sentiment_explanation,
      meeting_notes: analysisResponse.result?.meeting_notes || analysisResponse.meeting_notes,
      audioId: audioId,
      filename: selectedFile.value.name
    }
    updateProcessingStep(4, 'completed', 100)
    
    // 刷新历史记录
    await loadHistory()
    
  } catch (error) {
    console.error('分析失败:', error)
    alert(languageService.t('audio.errors.analysisFailedWithMessage', { message: error.message }))
  } finally {
    isProcessing.value = false
  }
}

const getSentimentEmoji = (sentiment) => {
  const emojiMap = {
    'positive': '😊',
    'negative': '😔',
    'neutral': '😐',
    'mixed': '🤔'
  }
  return emojiMap[sentiment] || '😐'
}

const getSentimentText = (sentiment) => {
  const textMap = {
    'positive': languageService.t('audio.results.sentiment.positive'),
    'negative': languageService.t('audio.results.sentiment.negative'),
    'neutral': languageService.t('audio.results.sentiment.neutral'),
    'mixed': languageService.t('audio.results.sentiment.mixed')
  }
  return textMap[sentiment] || languageService.t('audio.results.sentiment.unknown')
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert(languageService.t('common.copySuccess'))
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const addActionItemsToTodos = async () => {
  if (!analysisResult.value?.action_items) return
  
  try {
    for (const item of analysisResult.value.action_items) {
      await todosService.createTodo({
        content: item,
        priority: 'medium',
        category: languageService.t('audio.results.actionItems.category')
      })
    }
    alert(languageService.t('audio.results.actionItems.addSuccess', { count: analysisResult.value.action_items.length }))
  } catch (error) {
    console.error('添加待办事项失败:', error)
    alert(languageService.t('audio.results.actionItems.addFailed'))
  }
}

const saveAsNote = async () => {
  if (!analysisResult.value) return
  
  try {
    const noteContent = `# ${languageService.t('audio.results.note.title')} - ${analysisResult.value.filename}

## ${languageService.t('audio.results.note.transcription')}
${analysisResult.value.transcription}

## ${languageService.t('audio.results.note.summary')}
${analysisResult.value.summary}

## ${languageService.t('audio.results.note.keywords')}
${analysisResult.value.keywords?.join(', ') || ''}

## ${languageService.t('audio.results.note.actionItems')}
${analysisResult.value.action_items?.map(item => `- ${item}`).join('\n') || ''}

## ${languageService.t('audio.results.note.sentiment')}
${getSentimentText(analysisResult.value.sentiment)} - ${analysisResult.value.sentiment_explanation}

${analysisResult.value.meeting_notes ? `## ${languageService.t('audio.results.note.meetingNotes')}\n${analysisResult.value.meeting_notes}` : ''}`
    
    await notesService.createNote({
      title: `${languageService.t('audio.results.note.title')} - ${analysisResult.value.filename}`,
      content: noteContent,
      category: languageService.t('audio.results.note.category')
    })
    
    alert(languageService.t('audio.results.meetingNotes.saveSuccess'))
  } catch (error) {
    console.error('保存笔记失败:', error)
    alert(languageService.t('audio.results.meetingNotes.saveFailed'))
  }
}

const downloadTranscription = () => {
  if (!analysisResult.value?.transcription) return
  
  const blob = new Blob([analysisResult.value.transcription], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${analysisResult.value.filename}_${languageService.t('audio.results.transcription.filename')}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const downloadAnalysis = () => {
  if (!analysisResult.value) return
  
  const report = {
    filename: analysisResult.value.filename,
    transcription: analysisResult.value.transcription,
    summary: analysisResult.value.summary,
    keywords: analysisResult.value.keywords,
    action_items: analysisResult.value.action_items,
    sentiment: analysisResult.value.sentiment,
    sentiment_explanation: analysisResult.value.sentiment_explanation,
    meeting_notes: analysisResult.value.meeting_notes
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${analysisResult.value.filename}_${languageService.t('audio.results.analysis.filename')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const shareResults = () => {
  if (!analysisResult.value) return
  
  const shareText = `${languageService.t('audio.results.share.title')} - ${analysisResult.value.filename}\n\n${languageService.t('audio.results.share.summary')}: ${analysisResult.value.summary}\n\n${languageService.t('audio.results.share.keywords')}: ${analysisResult.value.keywords?.join(', ') || ''}`
  
  if (navigator.share) {
    navigator.share({
      title: languageService.t('audio.results.share.shareTitle'),
      text: shareText
    })
  } else {
    copyToClipboard(shareText)
  }
}

const startNewAnalysis = () => {
  clearFile()
}

const loadHistory = async () => {
  try {
    const result = await aiService.getAudioList()
    if (result.success) {
      analysisHistory.value = result.files || []
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

const loadHistoryItem = async (item) => {
  try {
    const result = await aiService.getAudioDetails(item.id)
    if (result.success) {
      analysisResult.value = {
        ...result,
        filename: item.filename
      }
      selectedFile.value = null
      audioPreviewUrl.value = ''
    }
  } catch (error) {
    console.error('加载历史项目失败:', error)
  }
}

const deleteHistoryItem = async (id) => {
  if (!confirm(languageService.t('audio.history.deleteConfirm'))) return
  
  try {
    const result = await aiService.deleteAudio(id)
    if (result.success) {
      await loadHistory()
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert(languageService.t('audio.history.deleteFailed'))
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(languageService.getCurrentLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生命周期
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.audio-analysis {
  @apply max-w-6xl mx-auto;
}

.upload-zone {
  transition: all 0.3s ease;
}

.upload-zone:hover {
  transform: translateY(-2px);
}

.selected-file {
  animation: slideInUp 0.3s ease-out;
}

.analysis-item {
  @apply bg-cyber-gray/10 rounded-lg p-4;
}

.history-item:hover {
  transform: translateY(-1px);
}

/* 进度动画 */
.progress-section .animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 音频播放器样式 */
audio {
  @apply bg-cyber-gray/20 border border-cyber-primary/30;
}

audio::-webkit-media-controls-panel {
  background-color: rgba(var(--cyber-gray), 0.3);
}

/* 结果卡片动画 */
.results-section > div {
  animation: slideInUp 0.5s ease-out;
}

.results-section > div:nth-child(2) {
  animation-delay: 0.1s;
}

.results-section > div:nth-child(3) {
  animation-delay: 0.2s;
}
</style>