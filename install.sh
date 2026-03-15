#!/bin/bash

set -e

name=$(whoami)
echo "Installing dependencies..."

echo "Checking for Bun.."

if ! command -v bun &> /dev/null; then
  echo "Bun not found. Installing now..."
  curl -fsSL https://bun.sh/install | bash
  
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
else
  echo "Bun is already installed."
fi

source ~/.bashrc || source ~/.bash_profile || true

echo ""
echo "Installing project dependencies"
bun install

echo ""
echo "Compiling the Downloads Sorter Binary"
bun build ./index.ts --compile --outfile ask 

echo ""
echo "Making the binary executable."
chmod +x ask

echo ""
echo "Moving the executable to the local bin folder. Enter password when prompted"
sudo mv ask /usr/local/bin

echo ""
echo "------------------------------------------------"
echo "✨ Setup Complete, $name!"
echo "------------------------------------------------"
