# HIPAA Compliance Guide for Full Stack Healthcare Application

## HIPAA Compliance Requirements

### 1. Administrative Safeguards
- **Security Officer**: Designate a HIPAA Security Officer
- **Workforce Training**: Regular HIPAA and security training for all staff
- **Access Management**: Role-based access controls (RBAC)
- **Business Associate Agreements (BAAs)**: Signed BAAs with all vendors (hosting, S3, etc.)
- **Incident Response Plan**: Documented breach response procedures

### 2. Physical Safeguards
- **Server Security**: Use HIPAA-compliant hosting providers (AWS, Azure with BAA)
- **Workstation Security**: Encrypted devices, auto-lock policies
- **Facility Access**: Controlled access to physical infrastructure

### 3. Technical Safeguards

#### Access Control
```javascript
// Frontend: Implement role-based access
// Backend: Validate JWT tokens and enforce permissions
// Database: Row-level security (RLS) policies
```

#### Audit Controls
- Log all PHI access (who, what, when, where)
- Log authentication attempts
- Log data modifications
- Retain logs for 6+ years

#### Integrity Controls
- Prevent unauthorized PHI alteration
- Use database transactions
- Version control for critical data

#### Transmission Security
- HTTPS/TLS 1.2+ for all communications
- Encrypt data in transit
- Validate SSL certificates

## Implementation Checklist

### Frontend (Next.js)

1. **Data Handling**
   - Never log PHI/PII to console in production
   - Clear sensitive data from memory when done
   - Use secure storage (encrypted localStorage or sessionStorage)
   - Implement auto-logout after inactivity

2. **Transmission**
   - All API calls over HTTPS
   - Validate SSL certificates
   - Use secure headers (CSP, HSTS, etc.)

3. **Authentication**
   - Secure JWT storage (httpOnly cookies preferred over localStorage)
   - Implement session timeout
   - Multi-factor authentication (MFA) for sensitive operations

4. **Error Handling**
   - Don't expose PHI in error messages
   - Generic error messages to users
   - Log detailed errors server-side only

### Backend (Rails GraphQL API)

1. **Encryption at Rest**
   ```ruby
   # Use pgcrypto for PII encryption (as planned)
   # Encrypt: phone, address, SSN, insurance numbers
   # Consider: email (can be plain text for searchability, but encrypt if possible)
   ```

2. **Encryption in Transit**
   - Force HTTPS/TLS
   - Validate certificates
   - Use secure headers

3. **Access Control**
   ```ruby
   # Implement JWT validation (currently disabled - enable this!)
   # Role-based authorization
   # Principle of least privilege
   # Audit all access
   ```

4. **Database Security**
   - Encrypt sensitive columns (pgcrypto)
   - Row-level security (RLS) policies
   - Encrypted backups
   - Secure connection strings (env vars, not in code)

5. **Logging**
   - Never log PHI/PII in plain text
   - Hash or redact sensitive data in logs
   - Log access attempts and data access

### Database (PostgreSQL)

1. **Encryption**
   ```sql
   -- Enable pgcrypto extension (already planned)
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   
   -- Encrypt sensitive fields
   -- Use pgp_sym_encrypt/pgp_sym_decrypt functions
   ```

2. **Access Controls**
   - Separate database users with minimal privileges
   - Use connection pooling with credentials
   - Enable SSL for database connections

3. **Backup Security**
   - Encrypt backups
   - Secure backup storage
   - Test restore procedures

### File Storage (S3)

1. **S3 Configuration**
   - Enable S3 bucket encryption (SSE-S3 or SSE-KMS)
   - Use private buckets (no public access)
   - Enable versioning
   - Enable access logging

2. **Access Control**
   - IAM roles with least privilege
   - Presigned URLs with expiration
   - Signed BAA with AWS

### Data Handling

1. **Minimum Necessary**
   - Collect only required data
   - Don't store unnecessary PHI

2. **Data Retention**
   - Define retention policies
   - Secure deletion when no longer needed

3. **Data Sharing**
   - Only share with authorized parties
   - Use secure channels
   - Log all data sharing

## Specific Code Recommendations

### 1. Enable JWT Authentication (Currently Disabled)
```ruby
# In Rails GraphQL controller
before_action :authenticate_user!

def authenticate_user!
  token = request.headers['Authorization']&.split(' ')&.last
  # Validate JWT token
  # Return 401 if invalid
end
```

### 2. Encrypt PII at Model Level
```ruby
# In PatientAndGuardian model
def encrypt_phone
  return nil if phone.blank?
  self.phone_encrypted = ActiveRecord::Base.connection.execute(
    "SELECT pgp_sym_encrypt('#{phone}', '#{ENV['ENCRYPTION_KEY']}')"
  ).first['pgp_sym_encrypt']
end

def decrypt_phone
  return nil if phone_encrypted.blank?
  ActiveRecord::Base.connection.execute(
    "SELECT pgp_sym_decrypt('#{phone_encrypted}', '#{ENV['ENCRYPTION_KEY']}')"
  ).first['pgp_sym_decrypt']
end
```

### 3. Audit Logging
```ruby
# Log all PHI access
def log_phi_access(user_id, resource_type, resource_id, action)
  AuditLog.create(
    user_id: user_id,
    resource_type: resource_type,
    resource_id: resource_id,
    action: action,
    timestamp: Time.current,
    ip_address: request.remote_ip
  )
end
```

### 4. Frontend: Secure Storage
```javascript
// Use encrypted storage or httpOnly cookies
// Avoid localStorage for sensitive tokens
// Implement auto-logout
useEffect(() => {
  const timer = setTimeout(() => {
    // Logout after 15 minutes of inactivity
    logout();
  }, 15 * 60 * 1000);
  return () => clearTimeout(timer);
}, []);
```

### 5. Error Handling
```javascript
// Frontend: Generic error messages
catch (error) {
  // Don't expose PHI in errors
  showError("An error occurred. Please try again.");
  // Log detailed error server-side only
}

// Backend: Sanitize error responses
rescue => e
  Rails.logger.error("Error: #{e.message}") # Log full details
  render json: { error: "An error occurred" } # Generic to client
end
```

## Compliance Documentation

1. **Privacy Policy**: Clear, accessible privacy policy
2. **Notice of Privacy Practices**: HIPAA-required notice
3. **Security Policies**: Documented security procedures
4. **Risk Assessment**: Regular security audits
5. **Breach Notification Plan**: Procedures for reporting breaches

## Testing and Validation

1. **Security Testing**: Regular penetration testing
2. **Access Reviews**: Periodic review of who has access
3. **Encryption Verification**: Verify encryption is working
4. **Backup Testing**: Regular restore tests
5. **Incident Drills**: Practice breach response

## Additional Considerations

1. **State Laws**: Some states have stricter requirements
2. **International**: GDPR if serving EU users
3. **Business Associates**: All vendors need BAAs
4. **Training**: Regular HIPAA training for team
5. **Updates**: Keep security measures current

## Priority Actions

1. **Enable JWT Authentication** (currently disabled)
2. **Implement PII Encryption** (pgcrypto)
3. **Add Audit Logging** for PHI access
4. **Secure S3 Bucket** configuration
5. **Remove PHI from Logs/Errors**
6. **Implement Session Timeouts**
7. **Get BAAs** with all vendors
8. **Document Security Policies**

---

**Note**: This is a high-level guide. Consult with a healthcare compliance attorney for legal requirements specific to your situation.

