<?php
/**
 * Super Admin - Usage Tracking API
 * GET /api/admin/usage/ - Get usage stats for all firms or a specific firm
 * GET /api/admin/usage/?firm_id=X - Get usage for specific firm
 * GET /api/admin/usage/?summary=1 - Get summary across all firms
 */

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../helpers/jwt.php';

setCorsHeaders();
$user = requireSuperAdmin();
$db = getDB();

try {
    $firmId = $_GET['firm_id'] ?? null;
    $summary = isset($_GET['summary']);
    $period = $_GET['period'] ?? 'current_month';
    
    // Determine date range
    switch ($period) {
        case 'last_month':
            $startDate = date('Y-m-01', strtotime('-1 month'));
            $endDate = date('Y-m-t', strtotime('-1 month'));
            break;
        case 'last_3_months':
            $startDate = date('Y-m-01', strtotime('-3 months'));
            $endDate = date('Y-m-d');
            break;
        case 'last_year':
            $startDate = date('Y-01-01');
            $endDate = date('Y-m-d');
            break;
        default: // current_month
            $startDate = date('Y-m-01');
            $endDate = date('Y-m-d');
    }
    
    if ($firmId) {
        // Single firm usage detail
        $stmt = $db->prepare("
            SELECT f.id, f.name, f.plan, f.status, f.max_clients, f.max_accountants, f.max_documents_per_month, f.max_storage_mb,
                   (SELECT COUNT(*) FROM clients c WHERE c.firm_id = f.id) as current_clients,
                   (SELECT COUNT(*) FROM firm_accountants fa WHERE fa.firm_id = f.id) as current_accountants,
                   (SELECT COUNT(*) FROM documents d JOIN clients c2 ON d.client_id = c2.id WHERE c2.firm_id = f.id) as total_documents,
                   (SELECT COUNT(*) FROM documents d3 JOIN clients c4 ON d3.client_id = c4.id WHERE c4.firm_id = f.id AND d3.uploaded_at >= ?) as documents_this_period,
                   (SELECT COALESCE(SUM(d2.file_size), 0) FROM documents d2 JOIN clients c3 ON d2.client_id = c3.id WHERE c3.firm_id = f.id) as storage_bytes
            FROM firms f
            WHERE f.id = ?
        ");
        $stmt->execute([$startDate, $firmId]);
        $firmUsage = $stmt->fetch();
        
        if (!$firmUsage) {
            http_response_code(404);
            echo json_encode(['error' => 'Firm not found']);
            exit;
        }
        
        // Get usage events for this firm in the period
        $stmt = $db->prepare("
            SELECT event_type, COUNT(*) as count, SUM(delta_value) as total_value
            FROM usage_events
            WHERE firm_id = ? AND created_at >= ? AND created_at <= ?
            GROUP BY event_type
        ");
        $stmt->execute([$firmId, $startDate, $endDate . ' 23:59:59']);
        $events = $stmt->fetchAll();
        
        // Monthly document trend (last 12 months)
        $stmt = $db->prepare("
            SELECT DATE_FORMAT(d.uploaded_at, '%Y-%m') as month, COUNT(*) as count
            FROM documents d
            JOIN clients c ON d.client_id = c.id
            WHERE c.firm_id = ?
            AND d.uploaded_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month
            ORDER BY month ASC
        ");
        $stmt->execute([$firmId]);
        $monthlyTrend = $stmt->fetchAll();
        
        // Billing estimate
        $planStmt = $db->prepare("SELECT * FROM plans WHERE slug = ?");
        $planStmt->execute([$firmUsage['plan'] ?: 'free']);
        $planInfo = $planStmt->fetch();
        
        $billingEstimate = null;
        if ($planInfo) {
            $clientCharge = $firmUsage['current_clients'] * (float)$planInfo['price_per_client'];
            $docCharge = $firmUsage['documents_this_period'] * (float)$planInfo['price_per_document'];
            $billingEstimate = [
                'base_price' => (float)$planInfo['base_price'],
                'client_charge' => round($clientCharge, 2),
                'document_charge' => round($docCharge, 2),
                'estimated_total' => round((float)$planInfo['base_price'] + $clientCharge + $docCharge, 2),
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'firm' => $firmUsage,
                'events' => $events,
                'monthly_trend' => $monthlyTrend,
                'billing_estimate' => $billingEstimate,
                'period' => ['start' => $startDate, 'end' => $endDate],
            ]
        ]);
        
    } else {
        // All firms usage overview
        $stmt = $db->prepare("
            SELECT f.id, f.name, f.plan, f.status, f.created_at,
                   (SELECT COUNT(*) FROM clients c WHERE c.firm_id = f.id) as clients_count,
                   (SELECT COUNT(*) FROM firm_accountants fa WHERE fa.firm_id = f.id) as accountants_count,
                   (SELECT COUNT(*) FROM documents d JOIN clients c2 ON d.client_id = c2.id WHERE c2.firm_id = f.id) as total_documents,
                   (SELECT COUNT(*) FROM documents d3 JOIN clients c4 ON d3.client_id = c4.id WHERE c4.firm_id = f.id AND d3.uploaded_at >= ?) as documents_this_period,
                   (SELECT COALESCE(SUM(d2.file_size), 0) FROM documents d2 JOIN clients c3 ON d2.client_id = c3.id WHERE c3.firm_id = f.id) as storage_bytes
            FROM firms f
            ORDER BY clients_count DESC
        ");
        $stmt->execute([$startDate]);
        $firmsUsage = $stmt->fetchAll();
        
        // Calculate billing estimates for each firm
        $plansStmt = $db->query("SELECT * FROM plans WHERE is_active = 1");
        $plans = [];
        foreach ($plansStmt->fetchAll() as $p) {
            $plans[$p['slug']] = $p;
        }
        
        foreach ($firmsUsage as &$fu) {
            $planSlug = $fu['plan'] ?: 'free';
            if (isset($plans[$planSlug])) {
                $p = $plans[$planSlug];
                $clientCharge = $fu['clients_count'] * (float)$p['price_per_client'];
                $docCharge = $fu['documents_this_period'] * (float)$p['price_per_document'];
                $fu['estimated_bill'] = round((float)$p['base_price'] + $clientCharge + $docCharge, 2);
            } else {
                $fu['estimated_bill'] = 0;
            }
            $fu['storage_mb'] = round($fu['storage_bytes'] / 1048576, 2);
        }
        
        // Platform totals
        $totalClients = array_sum(array_column($firmsUsage, 'clients_count'));
        $totalDocs = array_sum(array_column($firmsUsage, 'total_documents'));
        $totalDocsThisPeriod = array_sum(array_column($firmsUsage, 'documents_this_period'));
        $totalRevenue = array_sum(array_column($firmsUsage, 'estimated_bill'));
        $totalStorage = array_sum(array_column($firmsUsage, 'storage_bytes'));
        
        echo json_encode([
            'success' => true,
            'data' => [
                'firms' => $firmsUsage,
                'totals' => [
                    'total_clients' => $totalClients,
                    'total_documents' => $totalDocs,
                    'documents_this_period' => $totalDocsThisPeriod,
                    'estimated_revenue' => round($totalRevenue, 2),
                    'total_storage_bytes' => $totalStorage,
                    'total_storage_mb' => round($totalStorage / 1048576, 2),
                ],
                'period' => ['start' => $startDate, 'end' => $endDate],
            ]
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
