const fs = require('fs');
const path = require('path');

function processPage(filePath, channelName) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  if (content.includes('supabase.channel')) {
    console.log(`${filePath} already has realtime`);
    return;
  }

  // Ensure supabase is imported
  if (!content.includes('import { supabase } from')) {
    if (content.includes("import { useAuthStore } from '../../store/useAuthStore';")) {
      content = content.replace("import { useAuthStore } from '../../store/useAuthStore';", "import { useAuthStore } from '../../store/useAuthStore';\nimport { supabase } from '../../lib/supabase';");
    } else if (content.includes("import { useNavigate } from 'react-router-dom';")) {
      content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';\nimport { supabase } from '../../lib/supabase';");
    } else {
      content = content.replace("import React", "import { supabase } from '../../lib/supabase';\nimport React");
    }
  }

  // Determine function name
  const funcNameMatch = content.match(/const (fetch\w+) = async \(\) => {/);
  if (!funcNameMatch) {
    console.log(`Could not find fetch function in ${filePath}`);
    return;
  }
  const funcName = funcNameMatch[1];

  // We find where the function is called inside useEffect
  const callRegex = new RegExp(`if \\(user\\?\\.id\\) {\\s*${funcName}\\(\\);\\s*}`);
  if (callRegex.test(content)) {
    content = content.replace(callRegex, `if (user?.id) {
      ${funcName}();

      const channel = supabase.channel('${channelName}')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          ${funcName}();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }`);
  } else {
    // maybe it's called like `fetchData();` at the end of useEffect
    const callRegex2 = new RegExp(`${funcName}\\(\\);\\s*}\\s*,\\s*\\[`);
    if (callRegex2.test(content)) {
      content = content.replace(callRegex2, `${funcName}();

      const channel = supabase.channel('${channelName}')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          ${funcName}();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [`);
    }
  }

  fs.writeFileSync(fullPath, content);
  console.log(`Added realtime to ${filePath}`);
}

const files = [
  'src/pages/artist/Schedule.tsx',
  'src/pages/manager/Dashboard.tsx',
  'src/pages/manager/Orders.tsx',
  'src/pages/manager/Appointments.tsx',
  'src/pages/manager/Conventions.tsx',
  'src/pages/manager/Finances.tsx',
  'src/pages/manager/Accommodations.tsx',
  'src/pages/artist/Accommodations.tsx',
  'src/pages/artist/Conventions.tsx',
  'src/pages/artist/ConventionDetails.tsx',
  'src/pages/manager/ConventionDetails.tsx'
];

files.forEach(f => {
  try {
    processPage(f, `sync-${path.basename(f, '.tsx').toLowerCase()}`);
  } catch(e) {
    console.log(`Error in ${f}: ${e.message}`);
  }
});