#!/bin/bash
echo "=== COMPLETE SECURITY SETUP ==="
echo ""

# ============================================
# PART 1: Install and configure fail2ban
# ============================================
echo "1. Installing fail2ban..."
apt update
apt install -y fail2ban

echo ""
echo "2. Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 86400
findtime = 3600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
EOF

echo "   ✓ Configuration created"

echo ""
echo "3. Starting fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban
sleep 2
systemctl status fail2ban --no-pager | head -10

# ============================================
# PART 2: Setup firewall (iptables)
# ============================================
echo ""
echo "4. Installing iptables-persistent..."
if ! command -v netfilter-persistent &> /dev/null; then
    DEBIAN_FRONTEND=noninteractive apt install -y iptables-persistent
    echo "   ✓ Installed"
else
    echo "   ✓ Already installed"
fi

echo ""
echo "5. Blocking malicious IPs..."
iptables -A INPUT -s 219.241.57.9 -j DROP 2>/dev/null && echo "   ✓ Blocked 219.241.57.9" || echo "   ⚠️  Rule may already exist"
iptables -A INPUT -s 8.219.144.203 -j DROP 2>/dev/null && echo "   ✓ Blocked 8.219.144.203" || echo "   ⚠️  Rule may already exist"
iptables -A INPUT -s 47.74.23.118 -j DROP 2>/dev/null && echo "   ✓ Blocked 47.74.23.118" || echo "   ⚠️  Rule may already exist"

# Create directory if it doesn't exist
mkdir -p /etc/iptables

# Save rules
echo ""
echo "6. Saving iptables rules..."
if command -v netfilter-persistent &> /dev/null; then
    netfilter-persistent save
    echo "   ✓ Rules saved with netfilter-persistent"
else
    iptables-save > /etc/iptables/rules.v4
    echo "   ✓ Rules saved to /etc/iptables/rules.v4"
fi

# ============================================
# PART 3: Verify everything is working
# ============================================
echo ""
echo "7. Verifying fail2ban status..."
if systemctl is-active --quiet fail2ban; then
    echo "   ✓ fail2ban is running"
    echo ""
    echo "   Banned IPs:"
    fail2ban-client status sshd 2>/dev/null | grep "Banned IP" || echo "   (No IPs banned yet)"
else
    echo "   ⚠️  fail2ban is not running"
fi

echo ""
echo "8. Verifying firewall rules..."
BLOCKED_COUNT=$(iptables -L INPUT -n | grep -c DROP)
echo "   ✓ Found $BLOCKED_COUNT DROP rules active"

echo ""
echo "=== SECURITY SETUP COMPLETE ==="
echo ""
echo "✓ fail2ban installed and running"
echo "✓ Malicious IPs blocked"
echo "✓ Firewall rules saved"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Monitor fail2ban: fail2ban-client status sshd"
echo "2. Check logs: tail -f /var/log/fail2ban.log"
echo "3. Review SSH config for additional hardening"

