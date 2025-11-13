# Demographics Backend Implementation

## Overview

This is the backend infrastructure for the patient demographics intake form. It provides database schema, API endpoints, business logic, and validation for collecting and managing demographic data during patient onboarding.

## Architecture

```
┌─────────────────┐
│   API Routes    │  Next.js App Router endpoints
│  /api/demographics  │
└────────┬────────┘
         │
┌────────▼────────┐
│   Service Layer │  Business logic and validation
│ demographics-   │
│   service.js    │
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │  PostgreSQL
│  demographics   │
│     table       │
└─────────────────┘
```

## Components

### 1. Database Layer

**File:** `migrations/010_create_demographics_table.sql`

Creates the `demographics` table with:
- All demographic fields from the PRD
- Character limit constraints
- Indexes for performance
- Triggers for automatic timestamp updates
- HIPAA-compliant audit fields

**To run migration:**
```bash
psql -U daybreak_app -d daybreak_health -f migrations/010_create_demographics_table.sql
```

### 2. Database Client

**File:** `lib/db/client.js`

Provides PostgreSQL connection pooling and query utilities:
- Connection pool management
- Transaction support
- Query logging
- Health checks
- Error handling

**Environment Variables Required:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=daybreak_health
DB_USER=daybreak_app
DB_PASSWORD=your_password
DB_SSL=false
```

### 3. Service Layer

**File:** `lib/services/demographics-service.js`

Business logic for demographics management:

**Functions:**
- `createDemographics(patientId, data, userId)` - Create new record
- `getDemographics(patientId)` - Retrieve record
- `updateDemographics(patientId, data, isPartial, userId)` - Update record
- `getCompletionState(patientId)` - Get completion status
- `calculateSectionsCompleted(demographics)` - Calculate completed sections

**Features:**
- Input validation
- Data sanitization
- Audit logging
- Error handling
- Automatic section tracking

### 4. Validation

**File:** `lib/utils/demographics-validation.js`

Validates all demographics data:
- Character limits (100, 200, 500)
- Enum value constraints
- Data type validation
- Array validation
- Completeness checking

**Functions:**
- `validateDemographics(data, isPartial)` - Validate demographics data
- `isComplete(data)` - Check if form is complete

### 5. Sanitization

**File:** `lib/utils/sanitization.js`

Prevents XSS and injection attacks:
- Removes control characters
- Enforces length limits
- HTML escaping
- UUID validation
- Email validation

**Functions:**
- `sanitizeInput(input, maxLength)` - Sanitize short text
- `sanitizeTextArea(input, maxLength)` - Sanitize long text
- `escapeHtml(input)` - Escape HTML special characters
- `sanitizeUuid(uuid)` - Validate and sanitize UUIDs
- `sanitizeEmail(email)` - Validate and sanitize emails

### 6. API Routes

**Files:**
- `app/api/demographics/route.js` - Main CRUD endpoints
- `app/api/demographics/completion/route.js` - Completion state endpoint

**Endpoints:**
- `POST /api/demographics` - Create demographics
- `GET /api/demographics?patientId={id}` - Get demographics
- `PUT /api/demographics?patientId={id}` - Full update
- `PATCH /api/demographics?patientId={id}` - Partial update (auto-save)
- `GET /api/demographics/completion?patientId={id}` - Get completion state

See `docs/demographics-api.md` for full API documentation.

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install the `pg` (PostgreSQL client) dependency added to `package.json`.

### 2. Setup Environment Variables

Create a `.env.local` file:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=daybreak_health
DB_USER=daybreak_app
DB_PASSWORD=your_secure_password
DB_SSL=false

# Application
NODE_ENV=development
```

### 3. Run Database Migration

```bash
psql -U daybreak_app -d daybreak_health -f migrations/010_create_demographics_table.sql
```

**Verify migration:**
```sql
SELECT * FROM schema_migrations WHERE version = '010_create_demographics_table';
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/demographics`.

## Testing

### Run Unit Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Manual API Testing

Use curl or Postman to test the endpoints:

```bash
# Create demographics
curl -X POST http://localhost:3000/api/demographics \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "123e4567-e89b-12d3-a456-426614174000",
    "data": {
      "legal_name": "John Doe",
      "preferred_name": "Johnny",
      "gender_assigned_at_birth": "male",
      "pronouns": "he/his"
    }
  }'

# Get demographics
curl http://localhost:3000/api/demographics?patientId=123e4567-e89b-12d3-a456-426614174000

# Auto-save (partial update)
curl -X PATCH http://localhost:3000/api/demographics?patientId=123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "school_name": "Lincoln Elementary",
      "sections_completed": ["basic_information", "education"]
    }
  }'

# Check completion
curl http://localhost:3000/api/demographics/completion?patientId=123e4567-e89b-12d3-a456-426614174000
```

## Data Model

### Demographics Table Schema

| Field | Type | Max Length | Constraints |
|-------|------|------------|-------------|
| id | UUID | - | Primary key |
| patient_id | UUID | - | Foreign key, unique |
| legal_name | VARCHAR | 100 | Nullable |
| preferred_name | VARCHAR | 100 | Nullable |
| gender_assigned_at_birth | VARCHAR | 50 | Enum values |
| gender_other_text | VARCHAR | 100 | Nullable |
| pronouns | VARCHAR | 50 | Enum values |
| guardian_name | VARCHAR | 100 | Nullable |
| shared_parenting_agreement | VARCHAR | 50 | Enum values |
| shared_parenting_details | TEXT | 500 | Check constraint |
| custody_concerns | VARCHAR | 50 | Enum values |
| custody_concerns_details | TEXT | 500 | Check constraint |
| school_name | VARCHAR | 200 | Nullable |
| current_grade | VARCHAR | 50 | Enum values |
| has_iep_504 | VARCHAR | 50 | Enum values |
| iep_504_details | TEXT | 500 | Check constraint |
| behavioral_academic_concerns | VARCHAR | 50 | Enum values |
| behavioral_academic_details | TEXT | 500 | Check constraint |
| complications_prior_birth | VARCHAR | 50 | Enum values |
| complications_prior_details | TEXT | 500 | Check constraint |
| complications_at_birth | VARCHAR | 50 | Enum values |
| complications_birth_details | TEXT | 500 | Check constraint |
| milestones_met | VARCHAR | 50 | Enum values |
| milestones_details | TEXT | 500 | Check constraint |
| life_changes | JSONB | - | Array |
| life_changes_other_text | TEXT | 500 | Check constraint |
| has_part_time_job | BOOLEAN | - | Nullable |
| has_extracurriculars | BOOLEAN | - | Nullable |
| extracurriculars_details | TEXT | 500 | Check constraint |
| fun_activities | TEXT | 500 | Check constraint |
| spirituality | VARCHAR | 50 | Enum values |
| completed | BOOLEAN | - | Default false |
| sections_completed | JSONB | - | Array |
| created_at | TIMESTAMPTZ | - | Auto-generated |
| updated_at | TIMESTAMPTZ | - | Auto-updated |
| created_by | UUID | - | Nullable |
| updated_by | UUID | - | Nullable |

### Indexes

- `idx_demographics_patient_id` - Fast lookups by patient
- `idx_demographics_completed` - Filter by completion status
- `idx_demographics_updated_at` - Sort by recency
- `idx_demographics_life_changes` - JSON queries
- `idx_demographics_sections_completed` - JSON queries
- `idx_demographics_patient_unique` - Enforce one record per patient

## Security & HIPAA Compliance

### Data Protection

1. **Encryption at Rest** - Database encryption enabled
2. **Encryption in Transit** - HTTPS/TLS for all API calls
3. **Input Sanitization** - All user input sanitized before storage
4. **SQL Injection Prevention** - Parameterized queries only
5. **XSS Prevention** - HTML escaping for output

### Audit Logging

All operations are logged with:
- Timestamp
- Action (create, update, view)
- User ID
- Patient ID
- Modified fields

Logs are written to console (implement permanent storage as needed).

### Access Control

TODO: Implement authentication and authorization
- Users can only access their authorized patients
- Role-based permissions (patient, guardian, clinician, admin)
- Session management
- Token-based authentication

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

### Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (not authorized)
- `404` - Not Found (demographics not found)
- `409` - Conflict (demographics already exists)
- `500` - Internal Server Error

### Validation Errors

```json
{
  "error": "Invalid demographics data",
  "errors": [
    {
      "field": "legal_name",
      "message": "Legal Name must not exceed 100 characters"
    }
  ]
}
```

## Performance Considerations

### Database Indexes

- Patient ID index for fast lookups (most common query)
- Completion status index for filtering
- JSON indexes for array queries

### Connection Pooling

- Maximum 20 connections
- 30-second idle timeout
- 2-second connection timeout

### Query Optimization

- Parameterized queries prevent SQL injection and improve performance
- Slow query logging (>1 second)
- Efficient UPDATE queries with only changed fields

## Monitoring & Observability

### Logging

All database operations are logged with:
- Query text (truncated)
- Duration
- Row count
- Errors

### Health Checks

```javascript
import { db } from '@/lib/db/client';

const isHealthy = await db.healthCheck();
```

### Metrics to Track

- Average response time per endpoint
- Database connection pool usage
- Error rates
- Validation failure rates
- Completion rates

## TODO / Future Enhancements

### Authentication & Authorization
- [ ] Implement user session management
- [ ] Add JWT or session-based authentication
- [ ] Implement role-based access control (RBAC)
- [ ] Add OAuth2 integration if needed

### Audit Logging
- [ ] Create audit_log table
- [ ] Persist audit events to database
- [ ] Add audit log query API
- [ ] Implement log retention policies

### Testing
- [ ] Add integration tests with test database
- [ ] Add API endpoint tests
- [ ] Add performance/load tests
- [ ] Achieve >80% code coverage

### Monitoring
- [ ] Integrate with monitoring service (e.g., DataDog, New Relic)
- [ ] Set up alerts for errors and slow queries
- [ ] Dashboard for demographics completion rates
- [ ] Track user flow through form sections

### Additional Features
- [ ] Soft delete support
- [ ] Version history for demographics changes
- [ ] Bulk export for reporting
- [ ] Data migration tools
- [ ] Rate limiting on API endpoints

## Troubleshooting

### Database Connection Issues

**Error:** `Connection refused`
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check credentials
psql -U daybreak_app -d daybreak_health -c "SELECT 1"
```

### Migration Fails

**Error:** `schema_migrations table does not exist`
```bash
# Run earlier migrations first
psql -U daybreak_app -d daybreak_health -f migrations/001_initialize_database.sql
```

### Validation Errors

Check the error response for field-specific validation messages. Common issues:
- Character limits exceeded
- Invalid enum values
- Wrong data types

### API Returns 500 Error

Check server logs for detailed error information:
```bash
# If running with npm run dev
# Errors will appear in terminal
```

## Support

For questions or issues:
1. Check the API documentation: `docs/demographics-api.md`
2. Review the PRD: `demographics_prd.md`
3. Check test files for usage examples
4. Review database schema comments

## License

Copyright © 2024 Daybreak Health. All rights reserved.

