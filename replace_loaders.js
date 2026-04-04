const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');

function findAndReplaceLoaders(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findAndReplaceLoaders(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Check if Loader or Loader2 is imported from lucide-react
            const importMatch = content.match(/import\s+{([^}]*)}\s+from\s+['"]lucide-react['"];?/);
            if (importMatch && (importMatch[1].includes('Loader2') || importMatch[1].includes('Loader'))) {
                // Calculate relative path to AppLoader
                const appLoaderPath = path.join(srcDir, 'components', 'common', 'AppLoader.jsx');
                const relativePath = path.relative(path.dirname(fullPath), appLoaderPath).replace(/\\/g, '/');
                let appLoaderImportPath = relativePath;
                if (!appLoaderImportPath.startsWith('.')) {
                    appLoaderImportPath = './' + appLoaderImportPath;
                }
                appLoaderImportPath = appLoaderImportPath.replace('.jsx', '');

                // Ensure AppLoader is imported
                if (!content.includes('AppLoader')) {
                    const importStatement = `import AppLoader from "${appLoaderImportPath}";\n`;
                    content = importStatement + content;
                }

                // Replace <Loader2 ... /> and <Loader... />
                content = content.replace(/<Loader2[^>]*\/>/g, '<AppLoader size="sm" />');
                content = content.replace(/<Loader\s[^>]*\/>/g, '<AppLoader size="sm" />');

                // Remove Loader and Loader2 from lucide-react import
                let newImport = importMatch[1]
                    .replace(/\bLoader2?,?\s*/g, '')
                    .replace(/,\s*$/, '')
                    .trim();

                if (newImport.length === 0) {
                    content = content.replace(importMatch[0], '');
                } else {
                    const newImportMatch = `import { ${newImport} } from 'lucide-react';`;
                    content = content.replace(importMatch[0], newImportMatch);
                }

                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

findAndReplaceLoaders(srcDir);
