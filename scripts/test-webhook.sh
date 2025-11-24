#!/bin/bash

# Script para probar el webhook de Chatwoot manualmente
# Uso: ./scripts/test-webhook.sh [URL]

WEBHOOK_URL="${1:-https://venepos-qj2xird9dd--isaacpaezz-projects.vercel.app/api/webhooks/chatwoot}"

echo "======================================"
echo "TEST 1: Health Check (GET)"
echo "======================================"
curl -X GET "$WEBHOOK_URL" -v
echo -e "\n\n"

echo "======================================"
echo "TEST 2: Message Created (POST)"
echo "======================================"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "account": {
      "id": 1,
      "name": "VenePOS"
    },
    "conversation": {
      "id": 123,
      "inbox_id": 2,
      "status": "open"
    },
    "message": {
      "id": 456,
      "content": "Hola, me interesa reactivar",
      "message_type": 0,
      "private": false,
      "created_at": 1732500000
    },
    "sender": {
      "id": 789,
      "name": "Test Cliente",
      "phone_number": "+584121234567"
    }
  }' -v
echo -e "\n\n"

echo "======================================"
echo "TEST 3: Conversation Updated (POST)"
echo "======================================"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "conversation_updated",
    "account": {
      "id": 1,
      "name": "VenePOS"
    },
    "conversation": {
      "id": 123,
      "inbox_id": 2,
      "status": "open",
      "labels": ["VenePOS", "RECUPERADO"]
    }
  }' -v
echo -e "\n\n"

echo "======================================"
echo "Pruebas completadas"
echo "======================================"
