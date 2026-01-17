<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>📐 HTML Layout Parser Playground</h1>
      </div>
      <div class="nav-links">
        <router-link to="/">Home</router-link>
        <router-link to="/basic">Basic Demo</router-link>
        <router-link to="/multi-font">Multi-Font</router-link>
        <router-link to="/css-separation">CSS Separation</router-link>
        <router-link to="/output-modes">Output Modes</router-link>
        <router-link to="/worker">Worker Rendering</router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
    <LogSaver />
  </div>
</template>

<script setup lang="ts">
import LogSaver from './components/LogSaver.vue'
</script>

<style>
@font-face {
  font-family: 'aliBaBaFont65';
  src: url('/fonts/aliBaBaFont65.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'MaoKenShiJinHei';
  src: url('/fonts/MaoKenShiJinHei-2.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'PingFang';
  src: url('/fonts/PingFang-Jian-ChangGuiTi-2.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'HuaGuang';
  src: url('/fonts/huaguangbudouti.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --success-color: #10b981;
  --error-color: #ef4444;
  --bg-color: #f8fafc;
  --panel-bg: #ffffff;
  --border-color: #e2e8f0;
  --text-color: #1e293b;
  --text-muted: #64748b;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: linear-gradient(135deg, var(--primary-color), #7c3aed);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-brand h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.nav-links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.nav-links a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-links a:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-links a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 24px;
}
</style>
