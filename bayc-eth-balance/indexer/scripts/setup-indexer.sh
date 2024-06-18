#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Function to print an error message and exit
function error_exit {
    echo "$1" 1>&2
    exit 1
}

echo "Installing dependencies..."
npm install || error_exit "Failed to install dependencies"

echo "Generating code..."
npm run codegen || error_exit "Code generation failed"

echo "Building the project..."
npm run build || error_exit "Build failed"

echo "Starting Docker containers..."
docker-compose up -d --build || error_exit "Failed to start Docker containers"

sleep 10

echo "Checking if the Graph Node is ready..."
echo "Checking if the Graph Node is ready..."
# Wait for the Graph Node to be healthy
until curl -s http://127.0.0.1:8030 | grep -q 'OK'; do
  echo "Graph Node is not ready yet. Retrying in 5 seconds..."
  sleep 5
done

echo "Graph Node is ready. Creating and deploying the subgraph..."

echo "Creating the subgraph..."
npm run create-local || error_exit "Failed to create the subgraph"

  sleep 2

echo "Deploying the subgraph..."
npm run deploy-local   || error_exit "Failed to deploy the subgraph"

echo "The Graph indexer is set up and running. Waiting for it to sync to the latest block..."
