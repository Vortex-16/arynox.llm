#!/bin/sh

# 1. Start ChromaDB in the background
echo "Starting ChromaDB..."
chroma run --path ./chroma_data --host 0.0.0.0 --port 8000 &

# 2. Give ChromaDB a few seconds to initialize
sleep 5

# 3. Start the Node.js Backend Server
echo "Starting ARYNOX Backend..."
node dist/index.js
