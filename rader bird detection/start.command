#!/bin/bash
# BEL Problem 1606 - Quick Launch Script for macOS
# Double-click this file in Finder to open the application in your default web browser

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  BHARAT ELECTRONICS LIMITED (BEL) - PROBLEM ID 1606"
echo "  Micro-Doppler Target Discrimination Surveillance System"
echo "=========================================================="
echo ""
echo "Launching web application in your default browser..."
open "file://$DIR/index.html"

echo "Ready! You can now present your project."
