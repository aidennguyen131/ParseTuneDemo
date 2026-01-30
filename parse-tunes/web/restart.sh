#!/bin/bash
echo "Stopping server..."
pkill -f "node server.js" 2>/dev/null || true
sleep 2
echo "Starting server..."
node server.js