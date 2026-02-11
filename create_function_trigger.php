<?php
require_once 'config/database.php';

try {
    $pdo = getDB();
    echo "Connected to database successfully\n";

    // Create the function
    echo "Creating can_send_message_to_role function...\n";
    $pdo->exec("
        CREATE FUNCTION `can_send_message_to_role`(
          sender_role VARCHAR(20),
          recipient_role VARCHAR(20)
        ) RETURNS BOOLEAN
        READS SQL DATA
        DETERMINISTIC
        BEGIN
          -- Client can only send to Firm
          IF sender_role = 'client' AND recipient_role = 'firm' THEN
            RETURN TRUE;
          END IF;

          -- Firm can send to Client and Accountant
          IF sender_role = 'firm' AND (recipient_role = 'client' OR recipient_role = 'accountant') THEN
            RETURN TRUE;
          END IF;

          -- Accountant can only send to Firm
          IF sender_role = 'accountant' AND recipient_role = 'firm' THEN
            RETURN TRUE;
          END IF;

          RETURN FALSE;
        END
    ");
    echo "✓ can_send_message_to_role function created\n";

    // Create the trigger
    echo "Creating add_chat_participants_on_document_create trigger...\n";
    $pdo->exec("
        CREATE TRIGGER `add_chat_participants_on_document_create`
        AFTER INSERT ON `documents`
        FOR EACH ROW
        BEGIN
          DECLARE client_user_id VARCHAR(36);
          DECLARE firm_owner_id VARCHAR(36);
          DECLARE assigned_accountant_id VARCHAR(36);

          -- Get the client's user_id
          SELECT user_id INTO client_user_id FROM clients WHERE id = NEW.client_id;

          -- Get the firm owner_id
          SELECT owner_id INTO firm_owner_id FROM firms WHERE id = (SELECT firm_id FROM clients WHERE id = NEW.client_id);

          -- Get assigned accountant if exists
          SELECT assigned_accountant_id INTO assigned_accountant_id FROM clients WHERE id = NEW.client_id;

          -- Add client as participant
          IF client_user_id IS NOT NULL THEN
            INSERT INTO chat_participants (id, document_id, user_id, user_role)
            VALUES (UUID(), NEW.id, client_user_id, 'client');
          END IF;

          -- Add firm owner as participant
          IF firm_owner_id IS NOT NULL THEN
            INSERT INTO chat_participants (id, document_id, user_id, user_role)
            VALUES (UUID(), NEW.id, firm_owner_id, 'firm');
          END IF;

          -- Add assigned accountant as participant if exists
          IF assigned_accountant_id IS NOT NULL THEN
            INSERT INTO chat_participants (id, document_id, user_id, user_role)
            VALUES (UUID(), NEW.id, assigned_accountant_id, 'accountant');
          END IF;
        END
    ");
    echo "✓ add_chat_participants_on_document_create trigger created\n";

    echo "Function and trigger setup complete!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
