import type { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Vite plugin to automatically create 404.html from index.html for GitHub Pages SPA routing
 * This ensures that all routes work correctly when users refresh the page or access URLs directly
 */
export function githubPages404(): Plugin {
  let outDir = 'dist';

  return {
    name: 'github-pages-404',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const indexPath = join(outDir, 'index.html');
      const notFoundPath = join(outDir, '404.html');

      try {
        // Read the built index.html
        let indexContent = readFileSync(indexPath, 'utf-8');
        
        // Add SPA routing script before closing body tag
        const redirectScript = `
    <script>
      // GitHub Pages SPA fallback
      // Store current path for React Router to handle after load
      (function() {
        var path = window.location.pathname;
        var hash = window.location.hash;
        var search = window.location.search;
        
        // ВАЖНО: Сохраняем hash ПЕРВЫМ ДЕЛОМ, до любых других операций
        if (hash && hash.length > 1) {
          // Сохраняем hash без # в начале
          var hashValue = hash.substring(1);
          sessionStorage.setItem('_reset_password_hash', hashValue);
          console.log('[404.html] Saved hash to sessionStorage:', hashValue.substring(0, 50) + '...');
        }
        
        // Сохраняем полный путь включая hash для обработки reset-password
        if (path !== '/' && !path.startsWith('/assets/') && !path.endsWith('.js') && !path.endsWith('.css') && !path.endsWith('.json') && !path.endsWith('.svg')) {
          var fullPath = path + search + hash;
          sessionStorage.setItem('_404_redirect', fullPath);
          console.log('[404.html] Saved redirect path:', fullPath.substring(0, 100) + '...');
        }
      })();
    </script>`;
        
        // Insert script before closing body tag
        indexContent = indexContent.replace('</body>', redirectScript + '\n  </body>');
        
        // Write it as 404.html
        writeFileSync(notFoundPath, indexContent, 'utf-8');
        
        console.log('✅ Created 404.html for GitHub Pages SPA routing');
      } catch (error) {
        console.warn(`⚠️  Failed to create 404.html: ${error}`);
      }
    },
  };
}

