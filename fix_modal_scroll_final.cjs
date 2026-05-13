const fs = require('fs');
const path = require('path');

function fixScroll(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Outer Wrapper: must have overflow-y-auto and items-start
  content = content.replace(
    /className="fixed inset-0 bg-black\/50 z-50 flex items-center justify-center p-4 sm:p-6"/g,
    'className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto"'
  );
  
  content = content.replace(
    /className="fixed inset-0 bg-black\/50 flex items-center justify-center p-4 z-50"/g,
    'className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto"'
  );

  content = content.replace(
    /className="fixed inset-0 bg-black\/50 flex items-center justify-center z-50 p-4"/g,
    'className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto"'
  );

  // Inner Modal: Must remove max-h and internal overflow, instead use margins so the whole modal scrolls
  content = content.replace(
    /max-h-\[90vh\] overflow-y-auto block/g,
    'my-8 flex-shrink-0'
  );
  
  content = content.replace(
    /max-h-\[90vh\] overflow-y-auto flex flex-col/g,
    'my-8 flex-shrink-0'
  );

  content = content.replace(
    /max-h-\[90vh\] overflow-y-auto/g,
    'my-8 flex-shrink-0'
  );

  // Fix View Reference Modal in Schedule
  content = content.replace(
    /fixed inset-0 bg-black\/50 z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-6/g,
    'fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto'
  );

  fs.writeFileSync(fullPath, content);
  console.log(`Fixed modal scroll in ${filePath}`);
}

const files = [
  'src/pages/manager/Orders.tsx',
  'src/pages/manager/Conventions.tsx',
  'src/pages/manager/Accommodations.tsx',
  'src/pages/artist/Accommodations.tsx',
  'src/pages/artist/Schedule.tsx',
  'src/pages/artist/Conventions.tsx',
];

files.forEach(f => fixScroll(f));
