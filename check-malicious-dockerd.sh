#!/bin/bash
# Security check script for malicious dockerd file
# Run on your VPS to investigate the suspicious file

echo "=== Checking for malicious dockerd file ==="
echo ""

# 1. Check if the file exists
echo "1. Checking if /tmp/dockerd exists:"
if [ -f "/tmp/dockerd" ]; then
    echo "   ⚠️  FILE FOUND - This is suspicious!"
    echo ""
    
    # 2. Get file details
    echo "2. File information:"
    ls -lah /tmp/dockerd
    echo ""
    
    # 3. Check file type
    echo "3. File type:"
    file /tmp/dockerd
    echo ""
    
    # 4. Check if it's executable
    echo "4. File permissions:"
    stat /tmp/dockerd | grep -E "Access|Uid|Gid"
    echo ""
    
    # 5. Check file size
    echo "5. File size:"
    du -h /tmp/dockerd
    echo ""
    
    # 6. Check creation/modification time
    echo "6. File timestamps:"
    stat /tmp/dockerd | grep -E "Modify|Change|Birth"
    echo ""
    
    # 7. Check if it's currently running
    echo "7. Checking if process is running:"
    ps aux | grep -i dockerd | grep -v grep
    echo ""
    
    # 8. Check for suspicious strings (first 100 bytes)
    echo "8. First 100 bytes (hex dump):"
    head -c 100 /tmp/dockerd | xxd
    echo ""
    
    # 9. Check for other suspicious files in /tmp
    echo "9. Other suspicious files in /tmp (executable files):"
    find /tmp -type f -executable -mtime -30 -ls 2>/dev/null | head -20
    echo ""
    
    echo "⚠️  RECOMMENDATION: Remove this file if confirmed malicious"
    echo "   Command: sudo rm -f /tmp/dockerd"
    
else
    echo "   ✓ File not found (may have been removed already)"
    echo ""
    
    # Still check for other suspicious files
    echo "2. Checking for other suspicious executable files in /tmp:"
    find /tmp -type f -executable -mtime -30 -ls 2>/dev/null | head -20
fi

echo ""
echo "=== Checking for legitimate dockerd ==="
echo ""

# Check if legitimate Docker daemon is installed
if command -v dockerd &> /dev/null; then
    echo "Legitimate dockerd location:"
    which dockerd
    echo ""
    echo "Legitimate dockerd version:"
    dockerd --version 2>/dev/null || echo "Could not get version"
else
    echo "Docker daemon not installed (this is normal if you don't use Docker)"
fi

echo ""
echo "=== Checking system processes ==="
ps aux | grep -E "dockerd|docker" | grep -v grep

echo ""
echo "=== Scan complete ==="

