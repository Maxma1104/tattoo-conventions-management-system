const fs = require('fs');
const path = require('path');

function replaceSafe(content, oldStr, newStr) {
  // Only replace if it's inside JSX text or quotes, but simple string replace is safer if we just match exactly
  // Actually, we can use split/join for exact matches.
  return content.split(oldStr).join(newStr);
}

function processFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Inject useTranslation
  if (!content.includes('useTranslation')) {
    content = content.replace("import React", "import { useTranslation } from 'react-i18next';\nimport React");
    content = content.replace(/(export const \w+ = \([^)]*\) => {)/, "$1\n  const { t } = useTranslation();");
  }

  // First apply the structural fixes that were lost
  if (filePath === 'src/pages/artist/Dashboard.tsx') {
    content = replaceSafe(contentconst f  "let myOrders = orders.filter(o => o.artist_id ===const path = require('pathai
function replaceSafe(content, oldSters  // Only replace if it'"s inside JSX text tu // Actually, we can use split/join for exact matches.