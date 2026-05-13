const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Fix Glassmorphism for hermes-card
  content = content.replace(/className="([^"]*)hermes-card([^"]*)"/g, (match, p1, p2) => {
    let classes = (p1 + p2).replace(/\s+/g, ' ');
    classes = classes.replace(/bg-white\/[0-9]+|bg-zinc-[0-9]+|dark:bg-hermes-darkBg(\/[0-9]+)?/g, '');
    classes = classes.replace(/border-zinc-[0-9]+/g, 'border-white/30');
    classes = classes.replace(/backdrop-blur-[a-z]+/g, '');
    return `className="${p1}hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg${p2}"`.replace(/\s+/g, ' ');
  });

  // Fix literal i18n keys outputted in UI
  content = content.replace(/>common\.welcome, /g, ">{t('common.welcome')}, ");
  content = content.replace(/\{t\('common\.welcome'\)\}, /g, "{t('common.welcome')}, ");
  content = content.replace(/>dashboard\.managerTitle</g, ">{t('dashboard.managerTitle')}<");
  
  content = content.replace(/>dashboard\.completedOrders/g, ">{t('dashboard.completedOrders')}");
  content = content.replace(/>dashboard\.earnings/g, ">{t('dashboard.earnings')}");
  content = content.replace(/>dashboard\.upcomingConventions/g, ">{t('dashboard.upcomingConventions')}");
  content = content.replace(/>dashboard\.viewAll</g, ">{t('dashboard.viewAll')}<");
  content = content.replace(/>dashboard\.applied</g, ">{t('dashboard.applied')}<");
  content = content.replace(/>dashboard\.applyNow</g, ">{t('dashboard.applyNow')}<");
  content = content.replace(/>dashboard\.myRecentAppts/g, ">{t('dashboard.myRecentAppts')}");
  content = content.replace(/>dashboard\.schedule</g, ">{t('dashboard.schedule')}<");
  content = content.replace(/>dashboard\.noUpcomingAppts</g, ">{t('dashboard.noUpcomingAppts')}<");
  content = content.replace(/>dashboard\.noUpcomingConvs</g, ">{t('dashboard.noUpcomingConvs')}<");

  fs.writeFileSync(fullPath, content);
  console.log(`Processed ${filePath}`);
}

const files = [
  'src/pages/manager/Dashboard.tsx',
  'src/pages/manager/Orders.tsx',
  'src/pages/manager/Conventions.tsx',
  'src/pages/manager/ConventionDetails.tsx',
  'src/pages/manager/Finances.tsx',
  'src/pages/manager/Appointments.tsx',
  'src/pages/manager/Accommodations.tsx',
  'src/pages/artist/Dashboard.tsx',
  'src/pages/artist/Schedule.tsx',
  'src/pages/artist/Conventions.tsx',
  'src/pages/artist/ConventionDetails.tsx',
  'src/pages/artist/Accommodations.tsx',
];

files.forEach(f => processFile(f));
