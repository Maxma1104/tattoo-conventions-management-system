const fs = require('fs');
const path = require('path');

function fixModals(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Fix parent wrapper
  content = content.replace(
    /className="fixed inset-0 bg-black\/50 flex items-center justify-center([^"]*)"/g,
    'className="fixed inset-0 bg-black/50 z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-6"'
  );

  // Remove max-h-[90vh] and overflow-y-auto from inner modal, add my-8 flex-shrink-0
  content = content.replace(
    /className="([^"]*)max-h-\[90vh\] overflow-y-auto([^"]*)"/g,
    'className="$1my-8 flex-shrink-0$2"'
  );
  
  content = content.replace(
    /className="([^"]*)max-h-\[90vh\]([^"]*)"/g,
    'className="$1my-8 flex-shrink-0$2"'
  );

  fs.writeFileSync(fullPath, content);
  console.log(`Fixed modals in ${filePath}`);
}

const files = [
  'src/pages/manager/Orders.tsx',
  'src/pages/manager/Conventions.tsx',
  'src/pages/manager/Accommodations.tsx',
  'src/pages/artist/Accommodations.tsx',
  'src/pages/artist/Schedule.tsx',
];

files.forEach(f => fixModals(f));
