const fs = require('fs');
const path = require('path');

function unifyDarkMode(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // bg-white -> hermes-card
  content = content.replace(/className="([^"]*)bg-white([^"]*)"/g, 'className="$1hermes-card$2"');
  content = content.replace(/className={`([^`]*)bg-white([^`]*)`}/g, 'className={`$1hermes-card$2`}');

  // Text colors
  content = content.replace(/text-zinc-900(?! dark:)/g, 'text-zinc-900 dark:text-hermes-ivory');
  content = content.replace(/text-zinc-800(?! dark:)/g, 'text-zinc-800 dark:text-hermes-ivory');
  content = content.replace(/text-zinc-700(?! dark:)/g, 'text-zinc-700 dark:text-hermes-ivoryDim');
  content = content.replace(/text-zinc-600(?! dark:)/g, 'text-zinc-600 dark:text-hermes-teal');
  content = content.replace(/text-zinc-500(?! dark:)/g, 'text-zinc-500 dark:text-hermes-teal');

  // Background colors
  content = content.replace(/bg-zinc-50(?! dark:)/g, 'bg-zinc-50 dark:bg-hermes-darkBg');
  content = content.replace(/bg-zinc-100(?! dark:)/g, 'bg-zinc-100 dark:bg-hermes-teal/10');
  content = content.replace(/bg-zinc-200(?! dark:)/g, 'bg-zinc-200 dark:bg-hermes-teal/20');
  
  // Borders
  content = content.replace(/border-zinc-200(?! dark:)/g, 'border-zinc-200 dark:border-hermes-teal/30');
  content = content.replace(/border-zinc-100(?! dark:)/g, 'border-zinc-100 dark:border-hermes-teal/30');

  // Rounded (except hermes specific borders)
  content = content.replace(/rounded-xl/g, 'rounded-none');
  content = content.replace(/rounded-lg/g, 'rounded-none');
  content = content.replace(/rounded-md/g, 'rounded-none');
  content = content.replace(/rounded-2xl/g, 'rounded-none');
  content = content.replace(/rounded-3xl/g, 'rounded-none');

  fs.writeFileSync(fullPath, content);
  console.log(`Unified ${filePath}`);
}

const files = [
  'src/pages/artist/Conventions.tsx',
  'src/pages/artist/Accommodations.tsx',
];

files.forEach(f => unifyDarkMode(f));
