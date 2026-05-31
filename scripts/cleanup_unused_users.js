const { query } = require('../src/configs/database');

async function run() {
  const dryRun = process.env.DRY_RUN !== 'false'; // Default to dry-run unless explicitly set to false
  console.log(`=== RUNNING CLEANUP SCRIPT (DRY_RUN: ${dryRun}) ===\n`);
  
  try {
    // 1. Fetch all roles
    const rolesRes = await query("SELECT id, code FROM auth.roles");
    const rolesMap = {};
    rolesRes.rows.forEach(r => {
      rolesMap[r.id] = r.code;
    });

    // 2. Fetch all foreign keys referencing auth.users(id) dynamically
    const fkQuery = `
      SELECT
          ns_src.nspname AS src_schema,
          tbl_src.relname AS src_table,
          a_src.attname AS src_column
      FROM
          pg_constraint c
          JOIN pg_class tbl_src ON tbl_src.oid = c.conrelid
          JOIN pg_namespace ns_src ON ns_src.oid = tbl_src.relnamespace
          JOIN pg_attribute a_src ON a_src.attrelid = tbl_src.oid AND a_src.attnum = ANY(c.conkey)
          JOIN pg_class tbl_tgt ON tbl_tgt.oid = c.confrelid
          JOIN pg_namespace ns_tgt ON ns_tgt.oid = tbl_tgt.relnamespace
      WHERE
          c.contype = 'f'
          AND tbl_tgt.relname = 'users'
          AND ns_tgt.nspname = 'auth';
    `;
    const fkRes = await query(fkQuery);
    
    // We ignore auth-only / token tables when checking for "active data" references
    const ignoredTables = [
      'refresh_tokens',
      'blacklist_tokens',
      'password_reset_tokens',
      'email_verification_tokens',
      'user_two_factor',
      'role_permissions'
    ];

    const tablesToCheck = fkRes.rows.filter(row => {
      return !ignoredTables.includes(row.src_table);
    });

    console.log("Checking references in the following business/log tables:");
    console.table(tablesToCheck);

    // 3. Fetch all users
    const usersRes = await query("SELECT id, email, full_name, role_id, is_active FROM auth.users");
    const users = usersRes.rows;
    console.log(`Total users in auth.users: ${users.length}\n`);

    const orphanedUsers = [];
    const excludedUsers = [];
    const activeUsers = [];

    for (const user of users) {
      const roleCode = rolesMap[user.role_id] || '';
      const email = (user.email || '').toLowerCase();
      
      const isQA = email.includes('qa');
      const isAdminEmail = email.includes('admin');
      const isAdminRole = ['system_admin', 'ministry_manager', 'department_manager'].includes(roleCode);
      
      if (isQA || isAdminEmail || isAdminRole) {
        excludedUsers.push({
          user,
          reason: isQA ? 'QA' : (isAdminEmail ? 'Admin Email' : 'Admin Role')
        });
        continue;
      }

      // Check references in all selected tables
      let totalRefs = 0;
      const refDetails = {};

      for (const t of tablesToCheck) {
        const countRes = await query(
          `SELECT COUNT(*) FROM ${t.src_schema}.${t.src_table} WHERE "${t.src_column}" = $1`,
          [user.id]
        );
        const count = parseInt(countRes.rows[0].count, 10);
        if (count > 0) {
          totalRefs += count;
          refDetails[`${t.src_schema}.${t.src_table}.${t.src_column}`] = count;
        }
      }

      if (totalRefs === 0) {
        orphanedUsers.push({ user, roleCode });
      } else {
        activeUsers.push({ user, roleCode, totalRefs, refDetails });
      }
    }

    console.log("=== EXCLUDED USERS (ADMIN/QA) ===");
    console.table(excludedUsers.map(eu => ({
      id: eu.user.id,
      email: eu.user.email,
      full_name: eu.user.full_name,
      reason: eu.reason
    })));

    console.log("\n=== ACTIVE USERS (HAVE REFERENCES) ===");
    console.table(activeUsers.map(au => ({
      id: au.user.id,
      email: au.user.email,
      full_name: au.user.full_name,
      role: au.roleCode,
      totalRefs: au.totalRefs
    })));

    console.log("\n=== ORPHANED USERS (TO BE DELETED) ===");
    if (orphanedUsers.length === 0) {
      console.log("No orphaned users found.");
    } else {
      console.table(orphanedUsers.map(ou => ({
        id: ou.user.id,
        email: ou.user.email,
        full_name: ou.user.full_name,
        role: ou.roleCode
      })));
    }

    if (orphanedUsers.length > 0) {
      if (dryRun) {
        console.log(`\n[DRY RUN] Would have deleted ${orphanedUsers.length} users. Run with DRY_RUN=false to perform deletion.`);
      } else {
        console.log(`\nDeleting ${orphanedUsers.length} orphaned users...`);
        for (const ou of orphanedUsers) {
          // Set role_permissions.granted_by to NULL if referenced
          await query("UPDATE auth.role_permissions SET granted_by = NULL WHERE granted_by = $1", [ou.user.id]);
          
          // Clear any email verification tokens
          try {
            await query("DELETE FROM public.email_verification_tokens WHERE user_id = $1", [ou.user.id]);
          } catch (e) {}
          try {
            await query("DELETE FROM auth.email_verification_tokens WHERE user_id = $1", [ou.user.id]);
          } catch (e) {}

          // Delete from auth.users (cascades automatically to refresh_tokens, password_reset_tokens, user_two_factor)
          await query("DELETE FROM auth.users WHERE id = $1", [ou.user.id]);
          console.log(`Deleted user: ${ou.user.email} (${ou.user.id})`);
        }
        console.log("Cleanup completed successfully.");
      }
    }

  } catch (error) {
    console.error("Cleanup failed with error:", error);
  } finally {
    process.exit();
  }
}

run();
