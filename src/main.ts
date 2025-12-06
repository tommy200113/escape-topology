/**
 * Main entry point for Escape Topology
 * 
 * Sets up Vue app with Pinia for state management.
 * Imports base styles that establish design tokens and reset.
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import './styles/base.css';
import './styles/print.css';

// Create Vue app
const app = createApp(App);

// Install Pinia for state management
const pinia = createPinia();
app.use(pinia);

// Mount the app
app.mount('#app');