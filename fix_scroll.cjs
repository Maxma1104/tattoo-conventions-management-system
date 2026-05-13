const fs = require('fs');
const path = require('path');

function fixScroll(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Revert to center
  content = content.replace(
    /className="fixed inset-0 bg-black\/50 z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-6"/g,
    'className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6"'
  );

  // Add scroll to inner modal
  content = content.replace(
    /className="([^"]*)my-8 flex-shrink-0([^"]*)"/g,
    'className="$1max-h-[90vh] overflow-y-auto flex flex-col$2"'
  );

  fs.writeFileSync(fullPath, content);
  console.log(`Fixed scroll in ${filePath}`);
}

const files = [
  'src/pages/manager/Orders.tsx',
  'src/pages/manager/Conventions.tsx',
  'src/pages/manager/Accommodations.tsx',
  'src/pages/artist/Accommodations.tsx',
  'src/pages/artist/Schedule.tsx',
];

files.forEach(f => fixScroll(f));
