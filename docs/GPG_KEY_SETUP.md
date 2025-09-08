# GPG Key Setup Guide for Package Signing

## Overview
This guide walks through setting up GPG keys for signing npm packages, ensuring package integrity and authenticity.

## Prerequisites
- GPG installed on your system
- GitHub repository access
- GitHub CLI (`gh`) installed and authenticated

## Step 1: Install GPG

### Windows
```bash
# Using winget
winget install GnuPG.GnuPG

# Or download from https://gnupg.org/download/
```

### macOS
```bash
brew install gnupg
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get install gnupg

# Fedora
sudo dnf install gnupg
```

## Step 2: Generate GPG Key

### Generate Master Key
```bash
# Start key generation
gpg --full-generate-key

# Select the following options:
# 1. Type: (1) RSA and RSA
# 2. Key size: 4096
# 3. Validity: 2y (2 years)
# 4. Real name: Vextrus Release Bot
# 5. Email: releases@vextrus.com
# 6. Comment: Package Signing Key
```

### Verify Key Creation
```bash
# List your keys
gpg --list-secret-keys --keyid-format=long

# Output example:
# sec   rsa4096/ABCD1234EFGH5678 2025-09-08 [SC] [expires: 2027-09-08]
#       Key fingerprint = XXXX XXXX XXXX XXXX XXXX  XXXX XXXX XXXX XXXX XXXX
# uid                 [ultimate] Vextrus Release Bot <releases@vextrus.com>
```

## Step 3: Export Keys

### Export Public Key
```bash
# Export public key (share this publicly)
gpg --armor --export releases@vextrus.com > vextrus-public.asc

# Publish to key servers (optional)
gpg --keyserver hkps://keys.openpgp.org --send-keys ABCD1234EFGH5678
```

### Export Private Key (KEEP SECURE!)
```bash
# Export private key for CI/CD
gpg --armor --export-secret-keys releases@vextrus.com > vextrus-private.asc

# IMPORTANT: Store this file securely and delete local copy after configuring GitHub
```

## Step 4: Configure GitHub Secrets

### Add Secrets to Repository
```bash
# Set GPG private key
gh secret set GPG_PRIVATE_KEY < vextrus-private.asc

# Set GPG key ID (use the ID from step 2)
gh secret set GPG_KEY_ID --body="ABCD1234EFGH5678"

# Set GPG passphrase (if you set one)
gh secret set GPG_PASSPHRASE --body="your-secure-passphrase"

# Clean up local private key file
rm vextrus-private.asc
```

## Step 5: Configure npm for Signing

### Local Configuration
```bash
# Configure git to use GPG
git config --global user.signingkey ABCD1234EFGH5678
git config --global commit.gpgsign true

# Configure npm (optional for local signing)
npm config set sign-git-tag true
```

## Step 6: Update GitHub Actions Workflow

The workflow is already configured in `.github/workflows/release-packages-prod.yml`:

```yaml
- name: Setup GPG Key
  if: github.ref == 'refs/heads/main'
  run: |
    if [ -n "${{ secrets.GPG_PRIVATE_KEY }}" ]; then
      echo "${{ secrets.GPG_PRIVATE_KEY }}" | gpg --batch --import
      git config --global user.signingkey ${{ secrets.GPG_KEY_ID }}
      git config --global commit.gpgsign true
    else
      echo "GPG signing skipped - no GPG_PRIVATE_KEY secret configured"
    fi
```

## Step 7: Verify Package Signatures

### Manual Verification
```bash
# Download package
npm pack @vextrus/kernel

# Verify signature (after implementing signing)
gpg --verify vextrus-kernel-1.0.0.tgz.asc vextrus-kernel-1.0.0.tgz
```

### Automated Verification
```bash
# In CI/CD pipeline
npm audit signatures
```

## Security Best Practices

### Key Management
1. **Never commit private keys** to repository
2. **Use strong passphrases** for key protection
3. **Rotate keys annually** or bi-annually
4. **Backup keys securely** (encrypted USB, hardware security module)
5. **Revoke compromised keys** immediately

### Key Storage Options
- **Development:** Local GPG keyring
- **CI/CD:** GitHub Secrets (current setup)
- **Production (future):** AWS KMS, HashiCorp Vault, or HSM

### Access Control
- Limit GPG key access to release managers only
- Use separate keys for development and production
- Audit key usage through GitHub Actions logs

## Backup and Recovery

### Backup Commands
```bash
# Backup entire GPG directory
tar -czf gpg-backup-$(date +%Y%m%d).tar.gz ~/.gnupg/

# Backup specific key
gpg --export-secret-keys ABCD1234EFGH5678 > backup-secret.asc
gpg --export ABCD1234EFGH5678 > backup-public.asc

# Encrypt backup with password
gpg --symmetric --cipher-algo AES256 backup-secret.asc
```

### Recovery Commands
```bash
# Restore from backup
gpg --import backup-public.asc
gpg --import backup-secret.asc

# Trust the key
gpg --edit-key ABCD1234EFGH5678
# Type: trust
# Select: 5 (ultimate trust)
# Type: quit
```

## Troubleshooting

### Common Issues

1. **"No secret key" error**
   ```bash
   # Check if key is imported
   gpg --list-secret-keys
   
   # Re-import if needed
   gpg --import vextrus-private.asc
   ```

2. **"Inappropriate ioctl for device" error**
   ```bash
   # Fix GPG terminal issue
   export GPG_TTY=$(tty)
   echo "export GPG_TTY=$(tty)" >> ~/.bashrc
   ```

3. **GitHub Actions failing**
   - Verify secrets are set: `gh secret list`
   - Check secret names match workflow
   - Ensure key hasn't expired

## Key Rotation Schedule

| Task | Frequency | Next Due |
|------|-----------|----------|
| Review key expiration | Quarterly | Jan 2026 |
| Rotate signing keys | Bi-annually | Sep 2027 |
| Audit key usage | Monthly | Oct 2025 |
| Backup verification | Quarterly | Jan 2026 |

## Additional Resources

- [GnuPG Documentation](https://gnupg.org/documentation/)
- [npm Package Signing RFC](https://github.com/npm/rfcs/blob/main/implemented/0003-package-signatures.md)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Contact

For GPG key issues or security concerns:
- Create an issue in the repository
- Contact: security@vextrus.com (future)

---

*Last Updated: 2025-09-08*
*Version: 1.0.0*