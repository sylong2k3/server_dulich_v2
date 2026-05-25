const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/routes');
const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js') && file !== 'index.js');

let report = '# Static RBAC Audit Report\n\n';
report += 'This report contains an automated static analysis of all Express route endpoints in the project to verify that Role-Based Access Control (RBAC) is implemented consistently and securely.\n\n';
report += '## Route Analysis\n\n';
report += '| File | Method | Path | Auth? | Permission / Role / Custom | Status |\n';
report += '| --- | --- | --- | --- | --- | --- |\n';

let highRiskCount = 0;
let authOnlyCount = 0;
let rbacCount = 0;
let publicCount = 0;

const rows = [];

for (const file of routeFiles) {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line matches router.METHOD(...)
    const routeStartMatch = line.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/i);
    if (routeStartMatch) {
      const method = routeStartMatch[1].toUpperCase();
      const routePath = routeStartMatch[2];
      
      // Gather the full route declaration
      let fullDeclaration = line;
      let tempIndex = i;
      while (!fullDeclaration.includes(');') && tempIndex < lines.length - 1) {
        tempIndex++;
        fullDeclaration += ' ' + lines[tempIndex].trim();
      }
      
      const hasAuthToken = fullDeclaration.includes('authenticateToken');
      const hasOptionalAuth = fullDeclaration.includes('optionalAuth');
      const hasApiKey = fullDeclaration.includes('authenticateApiKey') || fullDeclaration.includes('requireApiAccess');
      const hasHealthToken = fullDeclaration.includes('requireHealthToken');
      
      // Check permissions or roles
      const permissionMatch = fullDeclaration.match(/checkPermission\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/);
      const roleMatch = fullDeclaration.match(/requireRole\s*\(\s*\[([^\]]+)\]\s*\)/);
      
      let protection = 'Public';
      let authStatus = '🔴 No Auth';
      let status = '⚠️ Check';
      
      if (hasAuthToken) {
        authStatus = '🔒 Authenticated';
        status = '✅ Protected (Auth)';
      } else if (hasOptionalAuth) {
        authStatus = '🔓 Optional Auth';
        status = 'ℹ️ Public / Opt-Auth';
      } else if (hasApiKey) {
        authStatus = '🔑 API Key';
        status = '✅ Protected (API)';
      } else if (hasHealthToken) {
        authStatus = '❇️ Health Token';
        status = '✅ Protected (Token)';
      }
      
      if (permissionMatch) {
        protection = `Permission: \`${permissionMatch[1]}:${permissionMatch[2]}\``;
        status = '🛡️ Full RBAC';
        rbacCount++;
      } else if (roleMatch) {
        const roles = roleMatch[1].replace(/['"`\s]/g, '');
        protection = `Role: \`${roles}\``;
        status = '🛡️ Role RBAC';
        rbacCount++;
      } else if (hasAuthToken) {
        protection = 'Auth Token Only';
        status = '⚠️ Auth Only (No RBAC)';
        authOnlyCount++;
      } else {
        publicCount++;
      }
      
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !hasAuthToken && !hasApiKey && !hasHealthToken) {
        status = '🚨 HIGH RISK (Public Write)';
        highRiskCount++;
      }
      
      rows.push({ file, method, routePath, authStatus, protection, status });
    }
  }
}

// Sort rows for cleaner presentation (by file, then by path)
rows.sort((a, b) => a.file.localeCompare(b.file) || a.routePath.localeCompare(b.routePath));

for (const r of rows) {
  report += `| ${r.file} | ${r.method} | ${r.routePath} | ${r.authStatus} | ${r.protection} | ${r.status} |\n`;
}

report += '\n## Summary Statistics\n\n';
report += `- **🛡️ RBAC / Role Enforced Endpoints:** ${rbacCount}\n`;
report += `- **⚠️ Auth-Only (No RBAC checks):** ${authOnlyCount}\n`;
report += `- **ℹ️ Public / Optional-Auth Endpoints:** ${publicCount}\n`;
report += `- **🚨 High Risk (Public Write Endpoints):** ${highRiskCount}\n\n`;

report += '## Findings and Recommendations\n\n';
report += '### 🚨 High Risk public write endpoints:\n';
const highRisks = rows.filter(r => r.status.includes('HIGH RISK'));
if (highRisks.length > 0) {
  for (const hr of highRisks) {
    report += `- **${hr.file}**: \`${hr.method} ${hr.routePath}\` is public and modifies state! Needs immediate attention.\n`;
  }
} else {
  report += '- None found. Good job!\n';
}

report += '\n### ⚠️ Auth-only endpoints without permission checks:\n';
const authOnly = rows.filter(r => r.status.includes('Auth Only'));
if (authOnly.length > 0) {
  for (const ao of authOnly) {
    report += `- **${ao.file}**: \`${ao.method} ${ao.routePath}\` requires authentication but has no RBAC roles or permission checks.\n`;
  }
} else {
  report += '- None found. All authenticated endpoints enforce RBAC!\n';
}

fs.writeFileSync(path.join(__dirname, '../rbac_audit_report.md'), report, 'utf8');
console.log('RBAC Audit completed. Report written to rbac_audit_report.md');
