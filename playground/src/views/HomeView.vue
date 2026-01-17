<template>
  <div class="home">
    <div class="hero">
      <div class="hero-content">
        <div class="hero-badge">v2.0</div>
        <h1 class="hero-title">
          <span class="gradient-text">HTML Layout Parser</span>
        </h1>
        <p class="hero-subtitle">
          WebAssembly-powered HTML/CSS layout engine for Canvas text rendering
        </p>
        <div class="hero-stats">
          <div class="stat">
            <div class="stat-value">129K+</div>
            <div class="stat-label">chars/sec</div>
          </div>
          <div class="stat">
            <div class="stat-value">91.2%</div>
            <div class="stat-label">cache hit rate</div>
          </div>
          <div class="stat">
            <div class="stat-value">2.25MB</div>
            <div class="stat-label">WASM size</div>
          </div>
        </div>
        <div class="hero-actions">
          <router-link to="/basic" class="btn btn-primary btn-lg">
            <span>🚀 Try Demo</span>
          </router-link>
          <a href="https://tajigaqzh.github.io/html-layout-parser/" target="_blank" class="btn btn-secondary btn-lg">
            <span>📚 Documentation</span>
          </a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-card">
          <div class="visual-header">
            <div class="visual-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="visual-title">HTML + CSS</div>
          </div>
          <div class="visual-content">
            <div class="code-line"><span class="tag">&lt;div</span> <span class="attr">class</span>=<span class="string">"title"</span><span class="tag">&gt;</span></div>
            <div class="code-line indent">Hello World</div>
            <div class="code-line"><span class="tag">&lt;/div&gt;</span></div>
          </div>
        </div>
        <div class="visual-arrow">→</div>
        <div class="visual-card">
          <div class="visual-header">
            <div class="visual-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="visual-title">Canvas Output</div>
          </div>
          <div class="visual-content canvas-preview">
            <canvas ref="previewCanvas" width="200" height="80"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">Powerful Features</h2>
      <div class="features-grid">
        <div class="feature-card" v-for="feature in features" :key="feature.title">
          <div class="feature-icon-wrapper">
            <div class="feature-icon">{{ feature.icon }}</div>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
          <router-link :to="feature.link" class="feature-link">
            Explore <span>→</span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <div class="demo-card">
        <div class="demo-content">
          <h2>Ready to try it?</h2>
          <p>Experience the power of HTML Layout Parser with our interactive demos</p>
          <router-link to="/basic" class="btn btn-primary btn-lg">
            Start Demo →
          </router-link>
        </div>
        <div class="demo-illustration">
          <div class="illustration-circle circle-1"></div>
          <div class="illustration-circle circle-2"></div>
          <div class="illustration-circle circle-3"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const previewCanvas = ref<HTMLCanvasElement>()

const features = [
  {
    icon: '🚀',
    title: 'High Performance',
    description: 'WebAssembly-powered parsing up to 129,000+ chars/sec with smart caching',
    link: '/basic'
  },
  {
    icon: '🔤',
    title: 'Multi-Font Support',
    description: 'Load and manage multiple fonts with automatic fallback chains',
    link: '/multi-font'
  },
  {
    icon: '🎨',
    title: 'CSS Separation',
    description: 'Separate HTML content from CSS styles for flexible theming',
    link: '/css-separation'
  },
  {
    icon: '📦',
    title: 'Output Modes',
    description: 'Choose from flat, byRow, simple, or full hierarchical output',
    link: '/output-modes'
  },
  {
    icon: '🎯',
    title: 'Canvas-Ready',
    description: 'Output format directly maps to Canvas 2D API for seamless rendering',
    link: '/basic'
  },
  {
    icon: '💾',
    title: 'Memory Efficient',
    description: 'Strict memory management with 91.2% cache hit rate',
    link: '/basic'
  }
]

onMounted(() => {
  if (previewCanvas.value) {
    const ctx = previewCanvas.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 200, 80)
      
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = '#4f46e5'
      ctx.fillText('Hello World', 20, 45)
    }
  }
})
</script>

<style scoped>
.home {
  max-width: 1400px;
  margin: 0 auto;
}

/* Hero Section */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  padding: 60px 0 80px;
  min-height: 600px;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  width: fit-content;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin: 0;
}

.gradient-text {
  background: linear-gradient(135deg, #4f46e5, #7c3aed, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 500px;
}

.hero-stats {
  display: flex;
  gap: 32px;
  margin: 8px 0;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.btn {
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-lg {
  padding: 14px 32px;
  font-size: 1.0625rem;
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(79, 70, 229, 0.4);
}

.btn-secondary {
  background: white;
  color: var(--text-color);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Hero Visual */
.hero-visual {
  display: flex;
  align-items: center;
  gap: 24px;
  justify-content: center;
}

.visual-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  width: 240px;
}

.visual-header {
  padding: 12px 16px;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 12px;
}

.visual-dots {
  display: flex;
  gap: 6px;
}

.visual-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border-color);
}

.visual-dots span:nth-child(1) {
  background: #ef4444;
}

.visual-dots span:nth-child(2) {
  background: #f59e0b;
}

.visual-dots span:nth-child(3) {
  background: #10b981;
}

.visual-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.visual-content {
  padding: 20px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.8;
  background: #1e293b;
  color: #e2e8f0;
  min-height: 120px;
}

.code-line {
  white-space: nowrap;
}

.indent {
  padding-left: 20px;
}

.tag {
  color: #7dd3fc;
}

.attr {
  color: #fbbf24;
}

.string {
  color: #86efac;
}

.canvas-preview {
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.visual-arrow {
  font-size: 2rem;
  color: var(--primary-color);
  font-weight: bold;
}

/* Features Section */
.features-section {
  padding: 80px 0;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 48px;
  background: linear-gradient(135deg, #1e293b, #475569);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
}

.feature-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
  transform: scaleX(0);
  transition: transform 0.3s;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  border-color: transparent;
}

.feature-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.feature-icon {
  font-size: 2rem;
}

.feature-card h3 {
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-color);
}

.feature-card p {
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 20px;
}

.feature-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.3s;
}

.feature-link:hover {
  gap: 8px;
}

/* Demo Section */
.demo-section {
  padding: 80px 0;
}

.demo-card {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 24px;
  padding: 60px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.demo-content h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
}

.demo-content p {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 32px;
  line-height: 1.6;
}

.demo-content .btn {
  background: white;
  color: var(--primary-color);
}

.demo-content .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.3);
}

.demo-illustration {
  position: relative;
  height: 300px;
}

.illustration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 0;
  right: 0;
  animation: float 6s ease-in-out infinite;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: 20px;
  right: 100px;
  animation: float 8s ease-in-out infinite;
}

.circle-3 {
  width: 100px;
  height: 100px;
  top: 100px;
  right: 200px;
  animation: float 7s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }

  .hero-content {
    align-items: center;
  }

  .hero-subtitle {
    max-width: 600px;
  }

  .hero-visual {
    flex-direction: column;
  }

  .visual-arrow {
    transform: rotate(90deg);
  }

  .demo-card {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .demo-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 16px;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
