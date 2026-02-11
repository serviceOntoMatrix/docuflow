<?php
require_once 'config/database.php';

try {
    $pdo = getDB();
    echo "Connected to database successfully\n";

    // Get all existing documents
    $stmt = $pdo->query("SELECT id, client_id FROM documents");
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($documents) . " documents to process\n";

    foreach ($documents as $doc) {
        echo "Processing document: {$doc['id']}\n";

        // Get client user_id
        $stmt = $pdo->prepare("SELECT user_id FROM clients WHERE id = ?");
        $stmt->execute([$doc['client_id']]);
        $clientUserId = $stmt->fetchColumn();

        // Get firm owner_id
        $stmt = $pdo->prepare("SELECT owner_id FROM firms WHERE id = (SELECT firm_id FROM clients WHERE id = ?)");
        $stmt->execute([$doc['client_id']]);
        $firmOwnerId = $stmt->fetchColumn();

        // Get assigned accountant if exists
        $stmt = $pdo->prepare("SELECT assigned_accountant_id FROM clients WHERE id = ?");
        $stmt->execute([$doc['client_id']]);
        $accountantId = $stmt->fetchColumn();

        // Add participants
        if ($clientUserId) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO chat_participants (id, document_id, user_id, user_role) VALUES (UUID(), ?, ?, 'client')");
            $stmt->execute([$doc['id'], $clientUserId]);
            echo "  ✓ Added client participant\n";
        }

        if ($firmOwnerId) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO chat_participants (id, document_id, user_id, user_role) VALUES (UUID(), ?, ?, 'firm')");
            $stmt->execute([$doc['id'], $firmOwnerId]);
            echo "  ✓ Added firm participant\n";
        }

        if ($accountantId) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO chat_participants (id, document_id, user_id, user_role) VALUES (UUID(), ?, ?, 'accountant')");
            $stmt->execute([$doc['id'], $accountantId]);
            echo "  ✓ Added accountant participant\n";
        }
    }

    echo "Chat participants populated successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
