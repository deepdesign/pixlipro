#!/bin/bash
# Check the suspicious /tmp/r.sh file

echo "=== Investigating /tmp/r.sh ==="
echo ""

if [ -f "/tmp/r.sh" ]; then
    echo "⚠️  SUSPICIOUS FILE FOUND: /tmp/r.sh"
    echo ""
    
    echo "1. File details:"
    ls -lah /tmp/r.sh
    echo ""
    
    echo "2. File type:"
    file /tmp/r.sh
    echo ""
    
    echo "3. File size:"
    du -h /tmp/r.sh
    echo ""
    
    echo "4. File timestamps:"
    stat /tmp/r.sh | grep -E "Modify|Change|Birth"
    echo ""
    
    echo "5. File contents (first 50 lines):"
    head -50 /tmp/r.sh
    echo ""
    
    echo "6. Checking if it's referenced in cron jobs:"
    crontab -l 2>/dev/null | grep -i r.sh
    cat /etc/crontab 2>/dev/null | grep -i r.sh
    find /etc/cron* -type f -exec grep -l "r.sh" {} \; 2>/dev/null
    echo ""
    
    echo "7. Checking if process is running:"
    ps aux | grep -i "r.sh" | grep -v grep
    echo ""
    
    echo "8. Checking file hash (MD5):"
    md5sum /tmp/r.sh 2>/dev/null || echo "md5sum not available"
    echo ""
    
    echo "⚠️  RECOMMENDATION: Review contents above, then remove if malicious:"
    echo "   sudo rm -f /tmp/r.sh"
    
else
    echo "✓ File /tmp/r.sh not found"
fi

echo ""
echo "=== Checking for other suspicious files ==="
find /tmp -type f -executable -mtime -7 -ls 2>/dev/null

echo ""
echo "=== Checking cron jobs ==="
echo "User crontab:"
crontab -l 2>/dev/null || echo "No user crontab"
echo ""
echo "System crontab:"
cat /etc/crontab 2>/dev/null | grep -v "^#" | grep -v "^$"
echo ""
echo "Cron directories:"
ls -la /etc/cron.d/ 2>/dev/null
ls -la /etc/cron.daily/ 2>/dev/null
ls -la /etc/cron.hourly/ 2>/dev/null

echo ""
echo "=== Scan complete ==="

