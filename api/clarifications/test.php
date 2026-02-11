<?php
// Simple test - just return JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode(['status' => 'ok', 'message' => 'Clarifications API is reachable']);
