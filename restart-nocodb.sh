#!/bin/bash
set -e

echo "Stopping NocoDB..."
sudo docker stop nocodb || true
sudo docker rm nocodb || true

echo "Starting NocoDB with Flow Control mount..."
sudo docker run -d --name nocodb \
  -v nocodb_nocodb_data:/usr/app/data \
  -v /opt/flow-control/app/server/prisma:/usr/app/data/flow-control \
  -p 127.0.0.1:8086:8080 \
  --restart always \
  nocodb/nocodb:latest

echo "Waiting for NocoDB to start..."
sleep 10
sudo docker ps | grep nocodb
echo "Done! Database is available at /usr/app/data/flow-control/dev.db inside the container."
