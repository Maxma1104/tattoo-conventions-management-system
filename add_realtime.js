const fs = require('fs');
const path = require('path');

function addRealtimeToPage(filePath, channelName) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  if (content.includes('supabase.channel')) {
    console.log(`${filePath} already has realtime`);
    return;
  }

  // Ensure supabase is imported
  if (!content.includes('import { supabase } from')) {
    content = content.replace("import { useAuthStore }", "import { useAuthStore } from '../../store/useAuthStore';\nimport { supabase } from '../../lib/supabase';");
    if (!content.includes('import { supabase } from')) {
      content = content.replace("import { useNavigate }", "import { useNavigate } from 'react-router-dom';\nimport { supabase } from '../../lib/supabase';");
    }
  }

  // Find the useEffect that calls fetchData or fetchSchedule
  const regex = /(ifconst fs = require('fs');
const path = requiCoconst path = require('pathat
function addRealtimeToPage(filePath);\  const fullPath = path.join(__dirname, filePath);nt  let content = fs.readFileSync(fullPath, '"ut{