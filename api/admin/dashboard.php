<?php
/**
 * Super Admin Dashboard API
 * GET /api/admin/dashboard.php - Platform-wide statistics
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/jwt.php';

setCorsHeaders();
$user = requireSuperAdmin();
$db = getDB();

try {
    // Total firms
    $stmt = $db->query("SELECT COUNT(*) as count FROM firms");
    $totalFirms = (int)$stmt->fetch()['count'];
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM firms WHERE status = 'active'");
    $activeFirms = (int)$stmt->fetch()['count'];
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM firms WHERE status = 'suspended'");
    $suspendedFirms = (int)$stmt->fetch()['count'];

    // Total users by role
    $stmt = $db->query("SELECT ur.role, COUNT(*) as count FROM user_roles ur GROUP BY ur.role");
    $roleCountsRaw = $stmt->fetchAll();
    $roleCounts = [];
    foreach ($roleCountsRaw as $r) {
        $roleCounts[$r['role']] = (int)$r['count'];
    }
    $totalUsers = array_sum($roleCounts);

    // Total documents
    $stmt = $db->query("SELECT COUNT(*) as count FROM documents");
    $totalDocuments = (int)$stmt->fetch()['count'];
    
    // Documents by status
    $stmt = $db->query("SELECT status, COUNT(*) as count FROM documents GROUP BY status");
    $docStatusRaw = $stmt->fetchAll();
    $docsByStatus = [];
    foreach ($docStatusRaw as $d) {
        $docsByStatus[$d['status']] = (int)$d['count'];
    }

    // Total storage used (bytes)
    $stmt = $db->query("SELECT COALESCE(SUM(file_size), 0) as total FROM documents");
    $totalStorageBytes = (int)$stmt->fetch()['total'];

    // Active sessions
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()");
    $stmt->execute();
    $activeSessions = (int)$stmt->fetch()['count'];

    // Documents this month
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM documents WHERE uploaded_at >= DATE_FORMAT(NOW(), '%Y-%m-01')");
    $stmt->execute();
    $docsThisMonth = (int)$stmt->fetch()['count'];

    // New firms this month
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM firms WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')");
    $stmt->execute();
    $newFirmsThisMonth = (int)$stmt->fetch()['count'];

    // New users this month
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')");
    $stmt->execute();
    $newUsersThisMonth = (int)$stmt->fetch()['count'];

    // Firms by plan
    $stmt = $db->query("SELECT COALESCE(plan, 'free') as plan, COUNT(*) as count FROM firms GROUP BY plan");
    $firmsByPlanRaw = $stmt->fetchAll();
    $firmsByPlan = [];
    foreach ($firmsByPlanRaw as $p) {
        $firmsByPlan[$p['plan']] = (int)$p['count'];
    }

    // Top 10 firms by client count
    $stmt = $db->query("
        SELECT f.id, f.name, f.plan, f.status, f.created_at,
               COUNT(DISTINCT c.id) as client_count,
               COUNT(DISTINCT fa.id) as accountant_count,
               COUNT(DISTINCT d.id) as document_count,
               COALESCE(SUM(d.file_size), 0) as storage_bytes
        FROM firms f
        LEFT JOIN clients c ON c.firm_id = f.id
        LEFT JOIN firm_accountants fa ON fa.firm_id = f.id
        LEFT JOIN documents d ON d.client_id = c.id
        GROUP BY f.id
        ORDER BY client_count DESC
        LIMIT 10
    ");
    $topFirms = $stmt->fetchAll();

    // Recent activity (last 20 audit logs)
    $stmt = $db->query("
        SELECT al.*, u.email as user_email, u.full_name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 20
    ");
    $recentActivity = $stmt->fetchAll();

    // Monthly trends (last 12 months) for charts
    $monthlyFirms = [];
    $monthlyUsers = [];
    $monthlyDocs = [];
    
    $stmt = $db->query("
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
        FROM firms WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY month ORDER BY month ASC
    ");
    foreach ($stmt->fetchAll() as $r) { $monthlyFirms[$r['month']] = (int)$r['count']; }
    
    $stmt = $db->query("
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
        FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY month ORDER BY month ASC
    ");
    foreach ($stmt->fetchAll() as $r) { $monthlyUsers[$r['month']] = (int)$r['count']; }
    
    $stmt = $db->query("
        SELECT DATE_FORMAT(uploaded_at, '%Y-%m') as month, COUNT(*) as count
        FROM documents WHERE uploaded_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY month ORDER BY month ASC
    ");
    foreach ($stmt->fetchAll() as $r) { $monthlyDocs[$r['month']] = (int)$r['count']; }

    // Build unified monthly_trends array
    $monthlyTrends = [];
    for ($i = 11; $i >= 0; $i--) {
        $m = date('Y-m', strtotime("-$i months"));
        $monthlyTrends[] = [
            'month' => $m,
            'label' => date('M Y', strtotime("-$i months")),
            'firms' => $monthlyFirms[$m] ?? 0,
            'users' => $monthlyUsers[$m] ?? 0,
            'documents' => $monthlyDocs[$m] ?? 0,
        ];
    }

    // Firm onboarding stages
    $stmt = $db->query("
        SELECT f.id, f.name, f.created_at, f.status, f.plan,
               (SELECT COUNT(*) FROM firm_accountants fa WHERE fa.firm_id = f.id) as has_accountant,
               (SELECT COUNT(*) FROM clients c WHERE c.firm_id = f.id) as has_client,
               (SELECT COUNT(*) FROM documents d JOIN clients c2 ON d.client_id = c2.id WHERE c2.firm_id = f.id) as has_document
        FROM firms f
        ORDER BY f.created_at DESC
    ");
    $firmOnboarding = [];
    foreach ($stmt->fetchAll() as $f) {
        $stage = 'registered';
        if ((int)$f['has_accountant'] > 0) $stage = 'accountant_added';
        if ((int)$f['has_client'] > 0) $stage = 'client_invited';
        if ((int)$f['has_document'] > 0) $stage = 'active';
        $firmOnboarding[] = [
            'id' => $f['id'],
            'name' => $f['name'],
            'plan' => $f['plan'],
            'status' => $f['status'],
            'stage' => $stage,
            'created_at' => $f['created_at'],
            'accountants' => (int)$f['has_accountant'],
            'clients' => (int)$f['has_client'],
            'documents' => (int)$f['has_document'],
        ];
    }

    // Stage counts
    $stageCounts = ['registered' => 0, 'accountant_added' => 0, 'client_invited' => 0, 'active' => 0];
    foreach ($firmOnboarding as $fo) { $stageCounts[$fo['stage']] = ($stageCounts[$fo['stage']] ?? 0) + 1; }

    echo json_encode([
        'success' => true,
        'data' => [
            'firms' => [
                'total' => $totalFirms,
                'active' => $activeFirms,
                'suspended' => $suspendedFirms,
                'new_this_month' => $newFirmsThisMonth,
                'by_plan' => $firmsByPlan,
            ],
            'users' => [
                'total' => $totalUsers,
                'by_role' => $roleCounts,
                'new_this_month' => $newUsersThisMonth,
            ],
            'documents' => [
                'total' => $totalDocuments,
                'this_month' => $docsThisMonth,
                'by_status' => $docsByStatus,
            ],
            'storage' => [
                'total_bytes' => $totalStorageBytes,
                'total_mb' => round($totalStorageBytes / 1048576, 2),
            ],
            'sessions' => [
                'active' => $activeSessions,
            ],
            'top_firms' => $topFirms,
            'recent_activity' => $recentActivity,
            'monthly_trends' => $monthlyTrends,
            'onboarding' => [
                'stages' => $stageCounts,
                'firms' => $firmOnboarding,
            ],
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load dashboard: ' . $e->getMessage()]);
}
