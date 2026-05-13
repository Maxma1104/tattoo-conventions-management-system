const fs = require('fs');
const path = require('path');

function fixFlexCol(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove flex flex-col from hermes-card where we added max-h
  content = content.replace(
    /max-h-\[90vh\] overflow-y-auto flex flex-col/g,
    'max-h-[90vh] overflow-y-auto block'
  );

  fs.writeFileSync(fullPath, content);
  console.log(`Fixed flex in ${filePath}`);
}

const files = [
  'src/pages/manager/Orders.tsx',
  'src/pages/manager/Conventions.tsx',
  'src/pages/manager/Accommodations.tsx',
  'src/pages/artist/Accommodations.tsx',
  'src/pages/artist/Schedule.tsx',
];

files.forEach(f => fixFlexCol(f));
