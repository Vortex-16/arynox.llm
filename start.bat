@echo off
echo Starting both Frontend (Client) and Backend (Server)...
start cmd.exe /k "cd server && npm run dev"
start cmd.exe /k "cd client && npm run dev"
echo Both servers are starting in separate windows!
