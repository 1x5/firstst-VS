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
        const indexContent = readFileSync(indexPath, 'utf-8');
        
        // Write it as 404.html
        writeFileSync(notFoundPath, indexContent, 'utf-8');
        
        console.log('✅ Created 404.html for GitHub Pages SPA routing');
      } catch (error) {
        console.warn(`⚠️  Failed to create 404.html: ${error}`);
      }
    },
  };
}

