# Connection PRD Implementation Task List

This document breaks down the Connection PRD into actionable pull requests that can be executed in order to fully implement the GraphQL API integration between the frontend and database.

## Pull Request Overview

| PR # | Title | Description | Dependencies |
|------|-------|-------------|--------------|
| 1 | Backend Infrastructure Setup | Initialize Rails API, configure database, install gems, set up CORS | None |
| 2 | ActiveRecord Models & Associations | Create all models, validations, associations, PII encryption | PR #1 |
| 3 | GraphQL Schema Foundation | Define GraphQL types, queries, input types, payload types | PR #2 |
| 4 | Core Mutations - Patient & Questionnaire | Implement patient and questionnaire mutations | PR #3 |
| 5 | File Upload & S3 Integration | Implement document upload with S3 storage | PR #3 |
| 6 | Insurance & Referral Mutations | Implement insurance, kinship, and referral mutations | PR #4, PR #5 |
| 7 | Backend Logging Implementation | Add comprehensive logging for all backend operations | PR #4, PR #5, PR #6 |
| 8 | Frontend GraphQL Client Setup | Set up GraphQL client, hooks, error handling | PR #4, PR #5, PR #6 |
| 9 | Frontend Component Integration | Integrate components with GraphQL API | PR #8 |
| 10 | Frontend Logging & Testing | Add frontend logging, Postman collections, documentation | PR #9 |

---

## PR #1: Backend Infrastructure Setup

**Goal:** Set up the Rails API application with basic configuration and infrastructure.

### Tasks

#### Rails API Application
- [ ] Create new Rails API-only application in `api/` folder (root directory)
  - Use Rails API-only mode: `rails new api --api`
  - Place in root directory, separate from UI folder
- [ ] Configure Rails to run on port 3001 (avoid conflict with Next.js on 3000)
  - Update `config/puma.rb` or `config/application.rb` to set default port
  - Document port configuration in README
- [ ] Set up `.env` file for environment variable management
  - Use `dotenv-rails` gem or Rails credentials
  - Create `.env.example` template file
- [ ] Add `.env` to `.gitignore`
  - Ensure sensitive credentials are never committed

#### Database Configuration
- [ ] Configure PostgreSQL connection to existing database (credentials already configured)
  - Update `config/database.yml` with existing database credentials
  - Use existing database schema (no migrations needed)
- [ ] Verify database connection works
  - Run `rails db:version` or `rails console` to test connection
- [ ] Verify database schema matches requirements (per `daybreak_db_prd.md`)
  - Check all required tables exist: `patients_and_guardians`, `questionnaires`, `insurance_coverages`, `referrals`, `kinships`, `documents`, etc.
  - Verify column types match expectations (JSONB, UUID, TIMESTAMPTZ, etc.)
- [ ] Verify database indexes are in place
  - Check for indexes on foreign keys, email fields, etc.
- [ ] Verify pgcrypto extension is enabled for PII encryption
  - Run SQL: `SELECT * FROM pg_extension WHERE extname = 'pgcrypto';`
  - If not enabled, enable it: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

#### Gem Installation
- [ ] Add required gems to Gemfile:
  ```ruby
  gem 'graphql'
  gem 'graphql-batch' # For N+1 query optimization
  gem 'pg' # PostgreSQL adapter
  gem 'pgcrypto' # For PII encryption (if needed as gem, otherwise use SQL extension)
  gem 'rack-cors' # CORS support
  gem 'jwt' # JWT authentication - for future use
  gem 'aws-sdk-s3' # S3 file storage for insurance cards
  gem 'bcrypt' # Password hashing - for future use
  gem 'dotenv-rails' # Environment variable management (if using .env file)
  ```
- [ ] Run `bundle install`
  - Verify all gems install successfully
  - Check for version conflicts

#### CORS Configuration
- [ ] Configure CORS to allow `http://localhost:3000` for development
  - Use `rack-cors` gem
  - Configure in `config/initializers/cors.rb`:
    ```ruby
    Rails.application.config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins 'http://localhost:3000'
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head]
      end
    end
    ```
- [ ] Configure CORS for production domain (placeholder for now)
  - Add production origin to CORS configuration
  - Use environment variable for production domain
- [ ] Test CORS configuration
  - Send test request from frontend to verify CORS headers are present
  - Verify preflight OPTIONS requests work

#### GraphQL Endpoint
- [ ] Configure GraphQL endpoint at `/api/graphql`
  - Add route: `post '/api/graphql', to: 'graphql#execute'`
  - Create `GraphqlController` in `app/controllers/graphql_controller.rb`
- [ ] Set up basic GraphQL controller
  ```ruby
  class GraphqlController < ApplicationController
    def execute
      # Basic GraphQL execution logic
      # Skip JWT validation for now
    end
  end
  ```
- [ ] Skip JWT validation (disabled until login page is implemented)
  - Do not add authentication middleware
  - Allow all requests for now
  - Document that authentication will be added later
- [ ] Test GraphQL endpoint responds (can return empty schema for now)
  - Send test POST request to `/api/graphql`
  - Verify endpoint returns valid response (even if empty)

#### Environment Variables
- [ ] Document required environment variables in `.env.example`:
  ```
  # JWT Authentication (for future use)
  JWT_SECRET=your-secret-key-here
  
  # AWS S3 Configuration
  AWS_ACCESS_KEY_ID=your-access-key-id
  AWS_SECRET_ACCESS_KEY=your-secret-access-key
  S3_BUCKET_NAME=daybreak-insurance-cards-dev
  AWS_REGION=us-east-1
  
  # Database (if not using Rails credentials)
  DATABASE_URL=postgresql://user:password@localhost:5432/dbname
  ```
- [ ] Document that `S3_BUCKET_NAME` should be different per environment (dev, staging, production)

#### S3 Bucket Setup (Manual Steps - Document Only)
- [ ] Document S3 bucket creation steps (one bucket per environment)
  **Step 1: Create S3 Bucket**
  1. Log in to AWS Console and navigate to S3
  2. Click "Create bucket"
  3. Choose bucket name (user preference, e.g., `daybreak-insurance-cards-dev`, `daybreak-insurance-cards-prod`)
  4. Select AWS region (user preference)
  5. Choose "Block all public access" (private bucket)
  6. Enable versioning if needed (optional)
  7. Click "Create bucket"
  8. Repeat for each environment (dev, staging, production)
  
  **Step 2: Configure CORS Policy**
  1. Select the created bucket
  2. Go to "Permissions" tab
  3. Scroll to "Cross-origin resource sharing (CORS)"
  4. Click "Edit" and add the following CORS configuration:
  ```json
  [
    {
      "AllowedHeaders": [
        "Content-Type",
        "Authorization"
      ],
      "AllowedMethods": [
        "GET",
        "PUT",
        "POST",
        "DELETE"
      ],
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://your-production-domain.com"
      ],
      "ExposeHeaders": [],
      "MaxAgeSeconds": 3000
    }
  ]
  ```
  5. Replace `https://your-production-domain.com` with actual production domain
  6. Click "Save changes"
  
  **Step 3: Configure Bucket Permissions**
  1. Go to "Permissions" tab
  2. Under "Bucket policy", ensure bucket is private
  3. Access will be controlled via IAM credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  
  **Step 4: Set Up IAM User (if needed)**
  1. Create IAM user with S3 access permissions
  2. Attach policy with S3 read/write permissions for the bucket
  3. Generate access keys (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  4. Store credentials in environment variables

### Acceptance Criteria
- Rails API application runs on port 3001
- Database connection successful
- All required gems installed
- CORS configured correctly
- GraphQL endpoint accessible at `/api/graphql`
- Environment variables documented

### Testing
- [ ] Verify Rails server starts without errors
- [ ] Verify database connection works
- [ ] Verify CORS allows requests from `localhost:3000`
- [ ] Verify GraphQL endpoint is accessible

---

## PR #2: ActiveRecord Models & Associations

**Goal:** Create all ActiveRecord models with validations, associations, and PII encryption.

### Tasks

#### Core Models
- [ ] Create `PatientAndGuardian` model (patients_and_guardians table)
- [ ] Create `Clinician` model (clinicians table)
- [ ] Create `Questionnaire` model (questionnaires table)
- [ ] Create `InsuranceCoverage` model (insurance_coverages table)
- [ ] Create `Referral` model (referrals table)
- [ ] Create `ReferralMember` model (referral_members table)
- [ ] Create `PatientAvailability` model (patient_availabilities table)
- [ ] Create `Document` model (documents table)

#### Supporting Models
- [ ] Create `Kinship` model (kinships table)
- [ ] Create `Organization` model (organizations table)
- [ ] Create `Contract` model (contracts table)
- [ ] Create `OrgContract` model (org_contracts table)
- [ ] Create `Membership` model (memberships table)
- [ ] Create `ClinicianAvailability` model (clinician_availabilities table)
- [ ] Create `ClinicianCredentialedInsurance` model (clinician_credentialed_insurances table)
- [ ] Create `ClinicianInsuranceAffiliation` model (clinician_insurance_affiliations table)

#### Model Associations
- [ ] PatientAndGuardian:
  - `has_many :questionnaires, foreign_key: :subject_id`
  - `has_many :insurance_coverages, foreign_key: :user_id`
  - `has_many :referrals, foreign_key: :submitter_id`
  - `has_many :patient_availabilities, foreign_key: :user_id`
- [ ] Questionnaire:
  - `belongs_to :subject, class_name: 'PatientAndGuardian', foreign_key: :subject_id`
  - `belongs_to :respondent, polymorphic: true` (PatientAndGuardian or Clinician)
- [ ] Referral:
  - `belongs_to :submitter, class_name: 'PatientAndGuardian', foreign_key: :submitter_id`
  - `belongs_to :intake, class_name: 'Questionnaire', foreign_key: :intake_id, optional: true`
  - `has_many :referral_members`
- [ ] InsuranceCoverage:
  - `belongs_to :user, class_name: 'PatientAndGuardian', foreign_key: :user_id`

#### Model Validations
- [ ] PatientAndGuardian:
  - Email format validation: Use Rails email format validator or regex
  - Unique email constraint: 
    - Database level: Ensure unique index exists on `email` column
    - Application level: Add `validates :email, uniqueness: true` (case-insensitive)
  - Required field validations: `validates :first_name, :last_name, :email, presence: true`
  - Address JSONB validation: Validate structure matches `{city, state, zip_code, street_address_1, street_address_2}` (all fields optional)
- [ ] Questionnaire:
  - Validate respondentId equals subjectId (custom validation):
    ```ruby
    validate :respondent_must_equal_subject
    def respondent_must_equal_subject
      errors.add(:respondent_id, "must equal subject_id") if respondent_id != subject_id
    end
    ```
  - Required field validations: `validates :subject_id, :respondent_id, :type, :question_answers, presence: true`
  - JSONB field structure validation for question_answers: Validate it's a hash/object
- [ ] InsuranceCoverage:
  - Required field validations: `validates :user_id, :kind, :eligibility, presence: true`
  - Enum validations for kind and eligibility:
    - `kind`: 0 (non-insurance), 2 (insurance)
    - `eligibility`: 2 (submitted), 4 (eligible), 6 (expired)
- [ ] All models: Date range validations where applicable
  - Validate `started_at` <= `completed_at` for Questionnaire
  - Validate date fields are valid dates

#### PII Encryption
- [ ] Implement pgcrypto encryption for PatientAndGuardian:
  - Email field (encrypted): Use `pgp_sym_encrypt` and `pgp_sym_decrypt` functions
  - Phone field (encrypted): Use `pgp_sym_encrypt` and `pgp_sym_decrypt` functions
  - Address JSONB field (encrypted): Encrypt entire JSONB object
  - Store encryption key in environment variable (e.g., `PII_ENCRYPTION_KEY`)
- [ ] Add encryption/decryption methods at model level:
  ```ruby
  # Example encryption method
  def encrypt_pii(value)
    return nil if value.blank?
    connection.execute("SELECT pgp_sym_encrypt('#{value}', '#{ENV['PII_ENCRYPTION_KEY']}')").first['pgp_sym_encrypt']
  end
  
  # Example decryption method
  def decrypt_pii(encrypted_value)
    return nil if encrypted_value.blank?
    connection.execute("SELECT pgp_sym_decrypt('#{encrypted_value}', '#{ENV['PII_ENCRYPTION_KEY']}')").first['pgp_sym_decrypt']
  end
  ```
- [ ] Test encryption/decryption works correctly
  - Test that encrypted values are stored in database
  - Test that decrypted values match original values
  - Test that encrypted values cannot be read without decryption

#### Soft Delete Filtering
- [ ] Add default scope to all models to filter `_fivetran_deleted = true`
  ```ruby
  default_scope { where(_fivetran_deleted: [nil, false]) }
  ```
- [ ] Ensure queries exclude soft-deleted records by default
  - Test that queries don't return records where `_fivetran_deleted = true`
  - Document how to access soft-deleted records if needed (using `unscoped`)

#### Default Scopes & Callbacks
- [ ] Set default values in models:
  - PatientAndGuardian: 
    - `role: 1` (patient/guardian) - set in `before_validation` callback
    - `preferred_language: "eng"` if not provided - set in `before_validation` callback
  - Questionnaire: 
    - `type: 3` (standard) - set in `before_validation` callback
    - Matching database enum values
  - InsuranceCoverage: 
    - `kind: 2` (insurance) - set in `before_validation` callback
    - `eligibility: 2` (submitted) initially - set in `before_validation` callback
    - Matching database enum values
  - Referral: 
    - `serviceKind: 2` (family) - set in `before_validation` callback
    - `marketId: 1` (integer, not UUID) - set in `before_validation` callback
    - Matching database enum values
  - Kinship: 
    - `kind: 1` (relationship type) - set in `before_validation` callback

### Acceptance Criteria
- All models created and match database schema
- All associations defined correctly
- Validations in place (email format, unique email, required fields)
- PII encryption working for email, phone, address
- Soft-deleted records filtered by default
- Default values applied correctly

### Testing
- [ ] Test model associations (can create records and access related records)
- [ ] Test validations (email format, unique email, required fields)
- [ ] Test PII encryption (encrypt/decrypt works)
- [ ] Test soft delete filtering (deleted records not returned)
- [ ] Test default values are applied

---

## PR #3: GraphQL Schema Foundation

**Goal:** Define the complete GraphQL schema structure including types, queries, input types, and payload types.

### Tasks

#### GraphQL Types
- [ ] Create `PatientAndGuardianType` with all fields:
  ```graphql
  type PatientAndGuardian {
    id: ID!
    email: String
    firstName: String
    lastName: String
    phone: String
    role: Int
    profileData: JSON
    address: JSON
    systemLabels: [String!]
    createdAt: DateTime!
    updatedAt: DateTime!
    questionnaires: [Questionnaire!]
    insuranceCoverages: [InsuranceCoverage!]
    referrals: [Referral!]
    availabilities: [PatientAvailability!]
  }
  ```
- [ ] Create `QuestionnaireType` with all fields:
  ```graphql
  type Questionnaire {
    id: ID!
    subjectId: ID!
    respondentId: ID!
    score: Int
    type: Int
    questionAnswers: JSON!
    startedAt: DateTime
    completedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    subject: PatientAndGuardian!
    respondent: RespondentUnion!
  }
  ```
- [ ] Create `InsuranceCoverageType` with all fields:
  ```graphql
  type InsuranceCoverage {
    id: ID!
    userId: ID!
    insuranceCompanyName: String
    kind: Int
    eligibility: Int
    systemLabels: [String!]
    profileData: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    user: PatientAndGuardian!
  }
  ```
- [ ] Create `ReferralType` with all fields:
  ```graphql
  type Referral {
    id: ID!
    submitterId: ID!
    organizationId: ID
    contractId: ID
    serviceKind: Int
    intakeId: ID
    careProviderId: ID
    systemLabels: [String!]
    onboardingCompletedAt: DateTime
    enrolledAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    submitter: PatientAndGuardian!
    intake: Questionnaire
    referralMembers: [ReferralMember!]
  }
  ```
- [ ] Create `KinshipType` with all fields:
  ```graphql
  type Kinship {
    id: ID!
    user0Id: ID!
    user1Id: ID!
    kind: Int!
    user0Label: Int!
    user1Label: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  ```
- [ ] Create `PatientAvailabilityType` with all fields:
  ```graphql
  type PatientAvailability {
    id: ID!
    userId: ID!
    availability: JSON!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: PatientAndGuardian!
  }
  ```
- [ ] Create `DocumentType` with all fields:
  ```graphql
  type Document {
    id: ID!
    userId: ID
    kind: Int
    url: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  ```
- [ ] Create `AuthPayloadType` (for future login):
  ```graphql
  type AuthPayload {
    token: String!
    user: PatientAndGuardian!
  }
  ```
- [ ] Create `RespondentUnion` type: `union RespondentUnion = PatientAndGuardian | Clinician`
  - Implement union type resolver to determine which type to return

#### Payload Types
- [ ] Create `PatientAndGuardianPayload` with structure: `{ patientAndGuardian: PatientAndGuardian, errors: [String!] }`
- [ ] Create `QuestionnairePayload` with structure: `{ questionnaire: Questionnaire, errors: [String!] }`
- [ ] Create `InsuranceCoveragePayload` with structure: `{ insuranceCoverage: InsuranceCoverage, errors: [String!] }`
- [ ] Create `ReferralPayload` with structure: `{ referral: Referral, errors: [String!] }`
- [ ] Create `KinshipPayload` with structure: `{ kinship: Kinship, errors: [String!] }`
- [ ] Create `PatientAvailabilityPayload` with structure: `{ patientAvailability: PatientAvailability, errors: [String!] }`
- [ ] Create `DocumentPayload` with structure: `{ document: Document, errors: [String!] }`
- [ ] Create `DeletePayload` with structure: `{ success: Boolean!, errors: [String!] }`
- [ ] Create `CompleteOnboardingPayload` with structure: `{ kinship: Kinship, referral: Referral, errors: [String!] }`

#### Input Types
- [ ] Create `PatientAndGuardianInput` with all fields:
  ```graphql
  input PatientAndGuardianInput {
    email: String
    firstName: String
    lastName: String
    phone: String
    preferredName: String
    preferredLanguage: String # eng, spa, yue, cmn, por, vie - defaults to "eng" if not provided
    preferredPronoun: String
    role: Int # Always set to 1 (patient/guardian) in backend
    profileData: JSON
    address: JSON # Format: {city: String, state: String, zip_code: String, street_address_1: String, street_address_2: String} - all fields optional
  }
  ```
- [ ] Create `QuestionnaireInput` with all fields:
  ```graphql
  input QuestionnaireInput {
    subjectId: ID!
    respondentId: ID! # Should be same as subjectId (parent answering about child)
    type: Int! # Always set to 3 (standard) in backend - matching database enum values
    questionAnswers: JSON! # Format: {question_1_answer: 'value', question_2_answer: 'value', ...}
    startedAt: DateTime
  }
  ```
- [ ] Create `InsuranceCoverageInput` with all fields:
  ```graphql
  input InsuranceCoverageInput {
    userId: ID!
    insuranceCompanyName: String
    kind: Int # Set to 2 (insurance) - matching database enum values (0=non-insurance, 2=insurance)
    eligibility: Int # Set to 2 (submitted) initially, then 4 (eligible) or 6 (expired) after verification
    frontCardUrl: String # Set from documents table URL (from uploaded front card)
    backCardUrl: String # Set from documents table URL (from uploaded back card)
    profileData: JSON
    # Note: Leave extracted insurance card fields empty (member_id, group_id, plan_holder_*, etc.)
  }
  ```
- [ ] Create `ReferralInput` with all fields:
  ```graphql
  input ReferralInput {
    submitterId: ID!
    organizationId: ID! # Required - provided by frontend (contract handling not implemented)
    contractId: ID! # Required - provided by frontend (contract handling not implemented)
    intakeId: ID
    serviceKind: Int! # Always set to 2 (family) in backend - matching database enum values
    concerns: String # Populated from survey answers (mapping handled by frontend)
    data: JSON # Accept any JSON structure (default to empty object {} if not provided)
    marketId: Int # Always set to integer 1 (not UUID) in backend
  }
  ```
- [ ] Create `KinshipInput` with all fields:
  ```graphql
  input KinshipInput {
    user0Id: ID!
    user1Id: ID!
    kind: Int! # Always set to 1 (relationship type)
    user0Label: Int! # 1 = guardian
    user1Label: Int! # 2 = child
  }
  ```
- [ ] Create `PatientAvailabilityInput` with all fields:
  ```graphql
  input PatientAvailabilityInput {
    userId: ID!
    availability: JSON!
  }
  ```
- [ ] Create `DocumentInput` with base64 file upload fields:
  ```graphql
  input DocumentInput {
    userId: ID
    kind: Int! # 1 = front of insurance card, 2 = back of insurance card
    file: String! # Base64-encoded file data
    fileName: String!
    contentType: String! # e.g., "image/jpeg", "image/png", "application/pdf"
  }
  ```
- [ ] Create `CompleteOnboardingInput` with kinship and referral inputs:
  ```graphql
  input CompleteOnboardingInput {
    kinship: KinshipInput!
    referral: ReferralInput!
  }
  ```

#### Query Type
- [ ] Define `Query` type with all queries:
  - `patientAndGuardian(id: ID!): PatientAndGuardian`
  - `patientAndGuardianByEmail(email: String!): PatientAndGuardian`
  - `questionnaire(id: ID!): Questionnaire`
  - `questionnairesBySubject(subjectId: ID!): [Questionnaire!]`
  - `questionnairesByRespondent(respondentId: ID!): [Questionnaire!]`
  - `insuranceCoverage(id: ID!): InsuranceCoverage`
  - `insuranceCoveragesByUser(userId: ID!): [InsuranceCoverage!]`
  - `referral(id: ID!): Referral`
  - `referralsBySubmitter(submitterId: ID!): [Referral!]`
  - `patientAvailability(id: ID!): PatientAvailability`
  - `patientAvailabilitiesByUser(userId: ID!): [PatientAvailability!]`
  - `document(id: ID!): Document`
  - `documentsByUser(userId: ID!): [Document!]`

#### Mutation Type (Structure Only)
- [ ] Define `Mutation` type with all mutation signatures (implementations in later PRs):
  - Patient/Guardian mutations
  - Questionnaire mutations
  - Insurance mutations
  - Referral mutations
  - Kinship mutations
  - Availability mutations
  - Document mutations
  - Onboarding completion mutation

#### GraphQL Schema Configuration
- [ ] Create main GraphQL schema file
- [ ] Configure DateTime scalar (ISO 8601 format)
- [ ] Configure JSON scalar (parsed JSON objects)
- [ ] Set up graphql-batch for N+1 prevention
- [ ] Configure error handling format

### Acceptance Criteria
- All GraphQL types defined
- All payload types defined with correct structure
- All input types defined
- Query type defined with all queries
- Mutation type defined with all mutation signatures
- Schema compiles without errors
- DateTime and JSON scalars configured

### Testing
- [ ] Verify GraphQL schema loads without errors
- [ ] Test query structure in GraphQL playground/console
- [ ] Verify all types are accessible
- [ ] Verify input types validate correctly

---

## PR #4: Core Mutations - Patient & Questionnaire

**Goal:** Implement mutations for patient/guardian and questionnaire operations.

### Tasks

#### Query Resolvers
- [ ] Implement `patientAndGuardian` resolver
- [ ] Implement `patientAndGuardianByEmail` resolver
- [ ] Implement `questionnaire` resolver
- [ ] Implement `questionnairesBySubject` resolver
- [ ] Implement `questionnairesByRespondent` resolver
- [ ] Ensure all queries filter soft-deleted records
- [ ] Use graphql-batch for N+1 prevention

#### Patient/Guardian Mutations
- [ ] Implement `createPatientAndGuardian` mutation:
  - Accept `PatientAndGuardianInput`
  - Set `role: 1` automatically in backend (patient/guardian)
  - Set `preferred_language: "eng"` if not provided (default value)
  - Transform address JSONB format:
    - Accept address as JSON object: `{city, state, zip_code, street_address_1, street_address_2}`
    - All address fields are optional
    - Store as JSONB in database
  - Encrypt PII fields (email, phone, address) using pgcrypto:
    - Email: Encrypt before saving
    - Phone: Encrypt before saving
    - Address: Encrypt entire JSONB object before saving
  - Validate unique email (database + application level):
    - Check database unique constraint
    - Check application-level validation
    - Return error in payload if email already exists
  - Create PatientAndGuardian record
  - Return `PatientAndGuardianPayload`:
    - Include created PatientAndGuardian object (with decrypted PII for response)
    - Include errors array (empty if successful)
  - Handle errors:
    - Validation errors → return in payload errors
    - Database constraint violations → return in payload errors
    - Log all errors with context
- [ ] Implement `updatePatientAndGuardian` mutation:
  - Accept `id` (UUID) and `PatientAndGuardianInput`
  - Find PatientAndGuardian by ID (raise error if not found)
  - Update only provided fields (partial update):
    - Only update fields that are present in input
    - Use `update_attributes` or `assign_attributes` with only provided fields
  - Encrypt PII fields if updated:
    - Re-encrypt email if provided
    - Re-encrypt phone if provided
    - Re-encrypt address if provided
  - Validate unique email if email is being updated
  - Save record
  - Return `PatientAndGuardianPayload`:
    - Include updated PatientAndGuardian object (with decrypted PII for response)
    - Include errors array (empty if successful)
  - Handle errors:
    - Record not found → return error in payload
    - Validation errors → return in payload errors
    - Log all errors with context
- [ ] Implement `createChildRecord` mutation:
  - Accept `PatientAndGuardianInput` (child information)
    - Frontend extracts child information from questionnaire answers
    - Frontend provides: first_name, last_name, birthdate/age, etc.
  - Set `role: 1` automatically (patient/guardian)
  - Set `preferred_language: "eng"` if not provided
  - Encrypt PII fields if provided (email, phone, address)
  - Create PatientAndGuardian record for child
  - Return `PatientAndGuardianPayload` with child ID:
    - Include created PatientAndGuardian object (child record)
    - Include errors array (empty if successful)
  - Note: This is separate from parent record creation

#### Questionnaire Mutations
- [ ] Implement `createQuestionnaire` mutation:
  - Accept `QuestionnaireInput`
  - Validate `respondentId` equals `subjectId` (backend validation):
    - Custom validation in model or mutation
    - Return error in payload if validation fails: "respondentId must equal subjectId"
  - Set `type: 3` (standard) automatically in backend:
    - Override input value, always set to 3
    - Matching database enum values
  - Accept `questionAnswers` in database format (transformation handled by frontend):
    - Frontend provides: `{question_1_answer: 'value', question_2_answer: 'value', ...}`
    - Store as JSONB in database
    - Validate it's a hash/object structure
  - Set `started_at` if provided:
    - Use DateTime from input if provided
    - Otherwise set to current timestamp
  - Create Questionnaire record
  - Return `QuestionnairePayload`:
    - Include created Questionnaire object
    - Include errors array (empty if successful)
  - Handle errors:
    - Validation errors (respondentId ≠ subjectId) → return in payload errors
    - Database errors → return in payload errors
    - Log all errors with context
- [ ] Implement `updateQuestionnaire` mutation:
  - Accept `id` (UUID) and `QuestionnaireInput`
  - Find Questionnaire by ID (raise error if not found)
  - Update `question_answers` JSONB field:
    - Accept updated questionAnswers in database format
    - Merge with existing or replace entirely (document behavior)
    - Validate it's a hash/object structure
  - Update other fields if provided (started_at, etc.)
  - Save record
  - Return `QuestionnairePayload`:
    - Include updated Questionnaire object
    - Include errors array (empty if successful)
  - Handle errors:
    - Record not found → return error in payload
    - Validation errors → return in payload errors
    - Log all errors with context
- [ ] Implement `completeQuestionnaire` mutation:
  - Accept `id` (UUID)
  - Find Questionnaire by ID (raise error if not found)
  - Set `completed_at` timestamp:
    - Set to current timestamp (DateTime.now or Time.current)
    - Use TIMESTAMPTZ format
  - Save record
  - Return `QuestionnairePayload`:
    - Include updated Questionnaire object
    - Include errors array (empty if successful)
  - Handle errors:
    - Record not found → return error in payload
    - Database errors → return in payload errors
    - Log all errors with context

#### Error Handling
- [ ] Implement standard error response format
- [ ] Return errors in payload `errors` field for validation errors
- [ ] Use GraphQL errors array for system errors
- [ ] Create user-friendly error messages

#### Default Value Application
- [ ] Ensure all default values applied in backend:
  - `preferred_language: "eng"` for PatientAndGuardian
  - `role: 1` for PatientAndGuardian
  - `type: 3` for Questionnaire

### Acceptance Criteria
- All patient/guardian mutations work correctly
- All questionnaire mutations work correctly
- Validations enforce business rules (respondentId = subjectId)
- Default values applied automatically
- PII encryption working
- Unique email constraint enforced
- Error handling returns appropriate errors

### Testing
- [ ] Test `createPatientAndGuardian` with valid input
- [ ] Test `createPatientAndGuardian` with duplicate email (should fail)
- [ ] Test `createQuestionnaire` with respondentId = subjectId (should succeed)
- [ ] Test `createQuestionnaire` with respondentId ≠ subjectId (should fail)
- [ ] Test `updateQuestionnaire` updates question_answers
- [ ] Test `completeQuestionnaire` sets completed_at
- [ ] Test error responses for validation failures

---

## PR #5: File Upload & S3 Integration

**Goal:** Implement document upload functionality with S3 storage and signed URL generation.

### Tasks

#### S3 Service
- [ ] Create `S3Service` class for S3 operations
  - Place in `app/services/s3_service.rb`
  - Use `aws-sdk-s3` gem
  - Initialize S3 client with credentials from environment variables
- [ ] Implement `upload_file` method:
  - Accept parameters: file data (binary), user ID (UUID), kind (integer), file name (string), content type (string)
  - Generate S3 object key: `{userId}/{kind}/{uuid}.{ext}`
    - Example: `"user-123/1/abc-def-ghi.jpeg"`
    - Use SecureRandom.uuid for UUID generation
    - Extract file extension from `fileName`
  - Upload to S3 bucket (bucket name from `ENV['S3_BUCKET_NAME']`)
  - Set content type metadata on S3 object
  - Return S3 object key (string)
  - Handle S3 upload errors and raise exceptions
- [ ] Implement `generate_signed_url` method:
  - Accept S3 object key (string)
  - Generate presigned URL using S3 client
  - Set expiration to 1 hour (3600 seconds)
  - Return signed URL (string)
  - Handle errors and raise exceptions

#### Document Mutations
- [ ] Implement `uploadDocument` mutation:
  - Accept `DocumentInput` with base64-encoded file
  - Decode base64 file data:
    ```ruby
    file_data = Base64.decode64(input[:file])
    ```
  - Validate file type (image/jpeg, image/png, application/pdf):
    - Check `contentType` matches allowed types
    - Reject if not in allowed list
  - Calculate original file size using formula: `(base64_length * 3) / 4 - padding`
    ```ruby
    base64_length = input[:file].length
    padding = input[:file].count('=')
    original_size = (base64_length * 3) / 4 - padding
    ```
  - Enforce 10MB max size (reject if exceeds):
    - 10MB = 10 * 1024 * 1024 bytes = 10,485,760 bytes
    - Return error in payload if file size exceeds limit
  - Upload to S3 via S3Service:
    - Call `S3Service.upload_file(file_data, user_id, kind, file_name, content_type)`
    - Get S3 object key from return value
  - Generate signed URL (1 hour expiration):
    - Call `S3Service.generate_signed_url(s3_object_key)`
    - Store signed URL in database
  - Create Document record with:
    - `user_id`: From input
    - `kind`: From input (1 = front, 2 = back)
    - `url`: Signed URL from S3Service
    - Store S3 object key in metadata if needed (optional)
  - Return `DocumentPayload`:
    - Include created Document object
    - Include errors array (empty if successful)
  - Handle errors:
    - File size validation errors → return in payload errors
    - File type validation errors → return in payload errors
    - S3 upload failures → return in payload errors
    - Log all errors with context
- [ ] Implement `deleteDocument` mutation:
  - Accept `id`
  - Delete from S3 (optional - or just mark as deleted)
  - Delete Document record
  - Return `DeletePayload`

#### Error Handling
- [ ] Handle file size validation errors
- [ ] Handle file type validation errors
- [ ] Handle S3 upload failures
- [ ] Return appropriate error messages

### Acceptance Criteria
- Files can be uploaded via GraphQL mutation
- Files stored in S3 with correct naming convention
- Signed URLs generated with 1 hour expiration
- Document records created in database
- File size validation works (10MB max)
- File type validation works (JPEG, PNG, PDF only)
- Error handling for upload failures

### Testing
- [ ] Test uploading valid file (JPEG, PNG, PDF)
- [ ] Test uploading file exceeding 10MB (should fail)
- [ ] Test uploading invalid file type (should fail)
- [ ] Test signed URL generation and expiration
- [ ] Test S3 object key naming format
- [ ] Test error handling for S3 failures

---

## PR #6: Insurance & Referral Mutations

**Goal:** Implement mutations for insurance coverage, kinship, and referral operations, including transaction handling.

### Tasks

#### Insurance Mutations
- [ ] Implement `createInsuranceCoverage` mutation:
  - Accept `InsuranceCoverageInput`
  - Set `kind: 2` (insurance) automatically in backend:
    - Override input value, always set to 2
    - Matching database enum values (0=non-insurance, 2=insurance)
  - Set `eligibility: 2` (submitted) initially in backend:
    - Override input value, always set to 2 initially
    - Matching database enum values (2=submitted, 4=eligible, 6=expired)
  - Set `front_card_url` and `back_card_url` from documents table signed URLs:
    - Accept `frontCardUrl` and `backCardUrl` from input
    - These should be signed URLs from `documents` table (from uploaded insurance cards)
    - Store as strings in `insurance_coverages` table
  - Leave extracted fields empty (member_id, group_id, plan_holder_*, etc.):
    - Do not populate extracted insurance card fields
    - No OCR/extraction implemented at this time
  - Leave `insurance_company_name` empty for now:
    - Do not populate from input or extraction
    - Can be updated later if needed
  - Create InsuranceCoverage record
  - Return `InsuranceCoveragePayload`:
    - Include created InsuranceCoverage object
    - Include errors array (empty if successful)
  - Handle errors:
    - Validation errors → return in payload errors
    - Database errors → return in payload errors
    - Log all errors with context
- [ ] Implement `updateInsuranceCoverage` mutation:
  - Accept `id` (UUID) and `InsuranceCoverageInput`
  - Find InsuranceCoverage by ID (raise error if not found)
  - Update eligibility (4 = eligible, 6 = expired) after verification:
    - Accept updated eligibility value from input
    - Validate it's a valid enum value (2, 4, or 6)
    - Update eligibility field
  - Update other fields if provided (front_card_url, back_card_url, etc.)
  - Save record
  - Return `InsuranceCoveragePayload`:
    - Include updated InsuranceCoverage object
    - Include errors array (empty if successful)
  - Handle errors:
    - Record not found → return error in payload
    - Validation errors → return in payload errors
    - Log all errors with context
- [ ] Implement `verifyInsuranceCoverage` mutation:
  - Accept `id` (UUID)
  - Find InsuranceCoverage by ID (raise error if not found)
  - Route only - no verification logic (verification handled separately):
    - This is a placeholder route
    - No actual verification/OCR logic implemented
    - Can return success immediately or trigger async verification
  - Return `InsuranceCoveragePayload`:
    - Include InsuranceCoverage object (unchanged or with status update)
    - Include errors array (empty if successful)
  - Handle errors:
    - Record not found → return error in payload
    - Log all errors with context

#### Kinship Mutations
- [ ] Implement `createKinship` mutation:
  - Accept `KinshipInput`
  - Set `kind: 1` (relationship type) automatically in backend
  - Create kinship record linking parent to child
  - Return `KinshipPayload`

#### Referral Mutations
- [ ] Implement `createReferral` mutation:
  - Accept `ReferralInput`
  - Set `serviceKind: 2` (family) automatically in backend
  - Set `marketId: 1` (integer, not UUID) automatically in backend
  - Accept `organizationId` and `contractId` from input (no backend lookup)
  - Accept `concerns` as string (mapping handled by frontend)
  - Accept `data` as any JSON structure (default to `{}` if not provided)
  - Return `ReferralPayload`
- [ ] Implement `updateReferral` mutation:
  - Accept `id` and `ReferralInput`
  - Update referral fields
  - Return `ReferralPayload`

#### Onboarding Completion Mutation
- [ ] Implement `completeOnboarding` mutation:
  - Accept `CompleteOnboardingInput` with both `KinshipInput` and `ReferralInput`
  - Execute in database transaction:
    ```ruby
    ActiveRecord::Base.transaction do
      # Create kinship record
      kinship = create_kinship(input[:kinship])
      
      # Create referral record
      referral = create_referral(input[:referral])
      
      # If either fails, transaction will rollback automatically
    end
    ```
  - Create kinship record:
    - Extract `KinshipInput` from input
    - Set `kind: 1` (relationship type) automatically in backend (override input)
    - Set `user_0_label: 1` (guardian) from input
    - Set `user_1_label: 2` (child) from input
    - Create Kinship record
    - Raise exception if creation fails
  - Create referral record:
    - Extract `ReferralInput` from input
    - Set `serviceKind: 2` (family) automatically in backend (override input)
    - Set `marketId: 1` (integer, not UUID) automatically in backend (override input)
    - Accept `organizationId` and `contractId` from input (no backend lookup - contract handling not implemented)
    - Accept `concerns` as string (mapping handled by frontend)
    - Accept `data` as any JSON structure (default to empty object `{}` if not provided)
    - Create Referral record
    - Raise exception if creation fails
  - If either fails, rollback entire transaction:
    - Use ActiveRecord transaction with automatic rollback on exception
    - Both records must be created successfully or neither is created
  - Return error to user if transaction fails:
    - Catch transaction errors
    - Return errors in `CompleteOnboardingPayload.errors` array
    - Include descriptive error message
  - Return `CompleteOnboardingPayload` with both records:
    - Include created Kinship object
    - Include created Referral object
    - Include errors array (empty if successful)
  - Handle errors:
    - Transaction rollback → return error in payload
    - Validation errors → return in payload errors
    - Database errors → return in payload errors
    - Log all errors with context (transaction start, commit, rollback)

#### Query Resolvers
- [ ] Implement `insuranceCoverage` resolver
- [ ] Implement `insuranceCoveragesByUser` resolver
- [ ] Implement `referral` resolver
- [ ] Implement `referralsBySubmitter` resolver
- [ ] Ensure all queries filter soft-deleted records

### Acceptance Criteria
- Insurance coverage mutations work correctly
- Kinship mutations work correctly
- Referral mutations work correctly
- `completeOnboarding` executes both operations in transaction
- Transaction rollback works if either operation fails
- Default values applied (kind: 2, eligibility: 2, serviceKind: 2, marketId: 1)
- Error handling returns appropriate errors

### Testing
- [ ] Test `createInsuranceCoverage` with document URLs
- [ ] Test `updateInsuranceCoverage` updates eligibility
- [ ] Test `createKinship` creates relationship
- [ ] Test `createReferral` creates referral
- [ ] Test `completeOnboarding` creates both kinship and referral
- [ ] Test `completeOnboarding` rollback if kinship creation fails
- [ ] Test `completeOnboarding` rollback if referral creation fails
- [ ] Test default values are applied correctly

---

## PR #7: Backend Logging Implementation

**Goal:** Add comprehensive logging for all backend operations.

### Tasks

#### Logging Infrastructure
- [ ] Set up structured JSON logging format
- [ ] Implement request ID generation and tracking middleware
- [ ] Configure log levels (DEBUG, INFO, WARN, ERROR)
- [ ] Set up log retention (30 days dev, 90 days production)

#### GraphQL Request/Response Logging
- [ ] Log every GraphQL request with:
  - Timestamp (ISO 8601)
  - Request ID
  - Operation name
  - Operation type (query/mutation)
  - User ID (if available)
  - Request variables (sanitized - exclude base64 content, show metadata only)
  - IP address
  - User agent
- [ ] Log every GraphQL response with:
  - Request ID (for correlation)
  - Response status (success/error)
  - Response time (milliseconds)
  - Error details (if any)
  - Data returned (summary only - IDs and counts)

#### Mutation-Specific Logging
- [ ] Log `createPatientAndGuardian`: patient ID, email (hashed), role, creation status
- [ ] Log `createQuestionnaire`: questionnaire ID, subject ID, respondent ID, type, question count, creation status
- [ ] Log `updateQuestionnaire`: questionnaire ID, fields updated, completion status
- [ ] Log `completeQuestionnaire`: questionnaire ID, completion timestamp
- [ ] Log `createChildRecord`: child ID, parent ID, role, creation status
- [ ] Log `uploadDocument`: document ID, user ID, file kind, file size, S3 key, upload status, upload duration
- [ ] Log `createInsuranceCoverage`: insurance coverage ID, user ID, kind, eligibility status, document URLs
- [ ] Log `verifyInsuranceCoverage`: insurance coverage ID, verification status, verification duration
- [ ] Log `createKinship`: kinship ID, user_0_id, user_1_id, kind, labels, creation status
- [ ] Log `createReferral`: referral ID, submitter ID, organization ID, contract ID, service kind, intake ID, creation status
- [ ] Log `completeOnboarding`: transaction start, kinship creation status, referral creation status, transaction commit/rollback, total duration

#### Database Operation Logging
- [ ] Log all database queries with:
  - Query type (SELECT, INSERT, UPDATE, DELETE)
  - Table name
  - Query duration (milliseconds)
  - Rows affected
  - Query parameters (sanitized)
- [ ] Log transaction events:
  - Transaction start (with transaction ID)
  - Transaction commit (with duration, records created/updated)
  - Transaction rollback (with reason, records affected)

#### S3 Operation Logging
- [ ] Log all S3 operations with:
  - Operation type (upload, generate_signed_url)
  - Bucket name
  - Object key
  - File size
  - Content type
  - Operation duration (milliseconds)
  - Success/failure status
  - Error details (if any)

#### Error Logging
- [ ] Log all errors with:
  - Error type (validation, database, network, S3, business logic)
  - Error message
  - Stack trace (for exceptions)
  - Request context (request ID, user ID, operation)
  - Error severity
  - Retry attempts (if applicable)

#### Performance Logging
- [ ] Log slow operations (threshold: > 1 second):
  - Operation name
  - Duration
  - Components involved (database, S3, external services)
  - Performance breakdown

### Acceptance Criteria
- All operations logged with appropriate detail
- Request IDs generated and tracked
- Logs in structured JSON format
- Sensitive data sanitized (emails hashed, base64 content excluded)
- Log levels configured correctly
- Log retention set up

### Testing
- [ ] Verify logs are written to correct files
- [ ] Verify request IDs are generated and tracked
- [ ] Verify sensitive data is sanitized
- [ ] Verify log format is valid JSON
- [ ] Verify performance logging triggers for slow operations

---

## PR #8: Frontend GraphQL Client Setup

**Goal:** Set up GraphQL client infrastructure, hooks, and error handling in the frontend.

### Tasks

#### GraphQL Client Installation
- [ ] Install `graphql-request` package
- [ ] Install `graphql` package

#### GraphQL Client Configuration
- [ ] Create GraphQL client configuration file
- [ ] Set API endpoint: `http://localhost:3001/api/graphql` for dev
- [ ] Configure production endpoint (environment variable)
- [ ] Skip JWT authentication headers (validation disabled)
- [ ] Set up request ID generation for correlation with backend

#### Error Handling
- [ ] Implement error handling with user-friendly messages
  - Create error handler utility
  - Map GraphQL errors to user-friendly messages
  - Display errors in UI components
  - Handle validation errors, network errors, server errors separately
- [ ] Implement retry logic: 3 retry attempts with exponential backoff (1s, 2s, 4s intervals)
  - Create retry utility function
  - Retry intervals: 1000ms (1s), 2000ms (2s), 4000ms (4s)
  - Maximum 3 retry attempts
  - Only retry on network errors and S3 upload failures
  - Do not retry on validation errors or user errors
- [ ] Retry only for network errors and S3 upload failures
  - Network errors: Connection timeout, network unavailable, etc.
  - S3 upload failures: S3 service errors, upload timeouts
  - Do not retry on: validation errors, authentication errors, business logic errors
- [ ] No automatic retry for user-initiated actions
  - User-initiated actions: form submissions, button clicks
  - Show error message and allow user to manually retry
  - Do not automatically retry user actions
- [ ] Add request/response logging to console
  - Log all GraphQL requests:
    - Request ID (for correlation with backend)
    - Mutation/query name
    - Request timestamp
    - Request variables (sanitized - exclude base64 content)
  - Log all GraphQL responses:
    - Request ID (for correlation)
    - Response status (success/error)
    - Response duration
    - Error details (if any)
  - Use structured logging format (JSON)
  - Sanitize sensitive data (hash emails, exclude full base64 content)

#### GraphQL Query Hooks
- [ ] Create `usePatientAndGuardian(id)` hook
- [ ] Create `useQuestionnaires(subjectId)` hook
- [ ] Create `useInsuranceCoverages(userId)` hook
- [ ] Create `useReferral(id)` hook
- [ ] Create `usePatientAvailability(userId)` hook
- [ ] Create `useDocument(id)` hook

#### GraphQL Mutation Hooks
- [ ] Create `useCreatePatientAndGuardian()` hook
- [ ] Create `useUpdatePatientAndGuardian()` hook
- [ ] Create `useCreateQuestionnaire()` hook
- [ ] Create `useUpdateQuestionnaire()` hook
- [ ] Create `useCompleteQuestionnaire()` hook
- [ ] Create `useCreateChildRecord()` hook
- [ ] Create `useUploadDocument()` hook
- [ ] Create `useCreateInsuranceCoverage()` hook
- [ ] Create `useUpdateInsuranceCoverage()` hook
- [ ] Create `useVerifyInsuranceCoverage()` hook
- [ ] Create `useCreateKinship()` hook
- [ ] Create `useCreateReferral()` hook
- [ ] Create `useCompleteOnboarding()` hook

#### Data Transformation Utilities
- [ ] Create utility to transform survey answers: `{q1: 'value'}` → `{question_1_answer: 'value'}`
  - Create function: `transformSurveyAnswersToDatabaseFormat(frontendAnswers)`
  - Transform keys: `q1` → `question_1_answer`, `q2` → `question_2_answer`, etc.
  - Example:
    ```javascript
    // Frontend format
    { q1: 'value1', q2: 'value2' }
    
    // Database format
    { question_1_answer: 'value1', question_2_answer: 'value2' }
    ```
  - Handle all question numbers (q1, q2, q3, ..., qN)
- [ ] Create utility to transform address form fields to JSONB format
  - Create function: `transformAddressToJSONB(formFields)`
  - Accept form fields: `{ city, state, zipCode, streetAddress1, streetAddress2 }`
  - Transform to JSONB: `{ city, state, zip_code, street_address_1, street_address_2 }`
  - All fields are optional
  - Example:
    ```javascript
    // Frontend format
    { city: 'San Francisco', state: 'CA', zipCode: '94102' }
    
    // Database format
    { city: 'San Francisco', state: 'CA', zip_code: '94102' }
    ```
- [ ] Create utility to transform availability UI selection to JSONB array format
  - Create function: `transformAvailabilityToJSONB(uiSelection)`
  - Transform UI selection to JSONB array format
  - Example format: `[{day: "Monday", time_blocks: [...]}]`
  - Note: Scheduling feature not implemented, but utility should be ready

### Acceptance Criteria
- GraphQL client configured and working
- All hooks created and functional
- Error handling works with retry logic
- Request IDs generated for correlation
- Data transformation utilities ready

### Testing
- [ ] Test GraphQL client connects to backend
- [ ] Test query hooks fetch data correctly
- [ ] Test mutation hooks execute mutations
- [ ] Test error handling and retry logic
- [ ] Test data transformation utilities

---

## PR #9: Frontend Component Integration

**Goal:** Integrate all frontend components with the GraphQL API.

### Tasks

#### OnboardingContext Updates
- [ ] Keep localStorage for auto-saves (do not remove existing functionality)
- [ ] Add `patientId` tracking (store UUID from `createPatientAndGuardian`)
- [ ] Add `childId` tracking (store UUID from `createChildRecord`)
- [ ] Add data transformation utilities (survey answers, address, availability)
- [ ] Add last saved indicator (display relative time format: "Saved 5 minutes ago")
- [ ] Implement auto-save debounce (500ms after user stops typing)
- [ ] Add per-mutation loading states (only during database sync operations)
- [ ] Sync to database on step completion or final submission
- [ ] Keep partial data in localStorage if user abandons onboarding mid-flow

#### New Component: ParentDataEntry (Step 1)
- [ ] Create `ParentDataEntry` component
  - Place in `components/onboarding/ParentDataEntry.jsx`
  - This is the new Step 1 of onboarding flow
- [ ] Frontend handles field collection and mapping to GraphQL input format
  - Collect all form fields
  - Map to `PatientAndGuardianInput` format
- [ ] Form fields: email, first_name, last_name, phone, preferred_name, preferred_language, preferred_pronoun, address
  - Email: required, validate format
  - First name: required
  - Last name: required
  - Phone: optional
  - Preferred name: optional
  - Preferred language: optional (defaults to "eng" in backend if not provided)
  - Preferred pronoun: optional
  - Address: optional, includes:
    - City (optional)
    - State (optional)
    - Zip code (optional)
    - Street address 1 (optional)
    - Street address 2 (optional)
- [ ] Auto-save to localStorage as user types (500ms debounce)
  - Use debounce utility (500ms delay)
  - Save form data to localStorage key: `parentDataEntry`
  - Save on every field change (debounced)
- [ ] Transform address form fields to JSONB format
  - Use `transformAddressToJSONB` utility
  - Transform: `{city, state, zipCode, streetAddress1, streetAddress2}` → `{city, state, zip_code, street_address_1, street_address_2}`
  - All fields optional
- [ ] Call `createPatientAndGuardian` mutation on submit
  - Use `useCreatePatientAndGuardian` hook
  - Pass transformed input to mutation
  - Handle success: store patientId and navigate to next step
  - Handle errors: display validation errors
- [ ] Store `patientId` in localStorage and OnboardingContext
  - Store UUID from mutation response
  - localStorage key: `patientId`
  - Update OnboardingContext with patientId
  - Use patientId for all subsequent operations
- [ ] Implement client-side validation (email format, required fields)
  - Email: validate format with regex
  - First name, last name: required validation
  - Show validation errors immediately
- [ ] Display server-side validation errors
  - Display errors from mutation payload
  - Show errors below relevant form fields
  - Handle unique email error specifically
- [ ] Add loading state during mutation
  - Show loading spinner/indicator during mutation
  - Disable submit button during mutation
  - Use loading state from mutation hook

#### Update Step Flow
- [ ] Add `ParentDataEntry` as Step 1
- [ ] Adjust other steps accordingly (LandingPage becomes Step 2, etc.)
- [ ] Update progress indicators

#### InsuranceUpload Component Integration
- [ ] Base64 encode files before sending
- [ ] Validate 10MB max file size (client-side)
- [ ] Call `uploadDocument` mutation for front card (kind: 1)
- [ ] Call `uploadDocument` mutation for back card (kind: 2)
- [ ] Store document IDs in context/localStorage
- [ ] Add loading states during upload
- [ ] Handle upload errors with retry logic

#### InsuranceResults Component Integration
- [ ] Call `verifyInsuranceCoverage` mutation (route only)
- [ ] Call `createInsuranceCoverage` mutation after verification completes
- [ ] Set `kind: 2`, `eligibility: 2` initially
- [ ] Set `front_card_url` and `back_card_url` from documents table signed URLs
- [ ] Leave extracted fields empty
- [ ] Display insurance coverage status
- [ ] Add loading states

#### IntakeSurvey Component Integration
- [ ] Add questions to collect child information (first_name, last_name, birthdate/age)
  - Add questions to existing survey
  - Map child information from questionnaire answers
  - Extract: first_name, last_name, birthdate/age
- [ ] Call `createQuestionnaire` when user clicks "Begin Survey" button
  - Trigger on button click (not automatically when survey starts)
  - Use `useCreateQuestionnaire` hook
  - Set `type: 3` (standard) - backend will override, but include in input
  - Set `respondentId = subjectId` (both use `patientId` from localStorage - parent)
    - Get `patientId` from localStorage/OnboardingContext
    - Use same value for both `respondentId` and `subjectId`
  - Provide `questionAnswers` in database format (transformation handled by frontend):
    - Initially provide empty object `{}` or initial answers
    - Use `transformSurveyAnswersToDatabaseFormat` utility
    - Transform: `{q1: 'value'}` → `{question_1_answer: 'value'}`
  - Store questionnaire ID in localStorage/context for updates
- [ ] Frontend handles survey answer transformation: `{q1: 'value'}` → `{question_1_answer: 'value'}`
  - Use `transformSurveyAnswersToDatabaseFormat` utility
  - Transform all question keys before sending to backend
  - Keep frontend format in localStorage for UI
  - Transform to database format only when syncing to database
- [ ] Auto-save to localStorage as user progresses (existing OnboardingContext)
  - Continue using existing OnboardingContext auto-save functionality
  - Save answers in frontend format: `{q1: 'value', q2: 'value', ...}`
  - Debounce saves to 500ms after user stops typing
  - Store in localStorage key: `intakeSurvey`
- [ ] Call `updateQuestionnaire` mutation on completion (sync localStorage to database)
  - When user completes survey, sync all answers to database
  - Transform answers to database format before sending
  - Use questionnaire ID from `createQuestionnaire` response
  - Update `question_answers` JSONB field
- [ ] Call `completeQuestionnaire` mutation (sets `completed_at`)
  - After `updateQuestionnaire` succeeds
  - Use questionnaire ID
  - Sets `completed_at` timestamp in database
- [ ] Frontend extracts child information from questionnaire answers
  - Extract from survey answers:
    - First name: from questionnaire answer (e.g., `q_child_first_name`)
    - Last name: from questionnaire answer (e.g., `q_child_last_name`)
    - Birthdate/age: from questionnaire answer (e.g., `q_child_birthdate`)
  - Map to `PatientAndGuardianInput` format
  - Prepare input for `createChildRecord` mutation
- [ ] Call `createChildRecord` mutation after questionnaire completion
  - After `completeQuestionnaire` succeeds
  - Use `useCreateChildRecord` hook
  - Pass child information in `PatientAndGuardianInput` format
  - Set `role: 1` (backend will set automatically)
  - Handle success: store childId
  - Handle errors: display errors
- [ ] Store `childId` in localStorage and OnboardingContext
  - Store UUID from `createChildRecord` response
  - localStorage key: `childId`
  - Update OnboardingContext with childId
  - Use childId for kinship creation in Step 6
- [ ] Add loading states
  - Show loading during `createQuestionnaire` mutation
  - Show loading during `updateQuestionnaire` mutation
  - Show loading during `completeQuestionnaire` mutation
  - Show loading during `createChildRecord` mutation
  - Disable form during mutations

#### SchedulingAssistant Component Integration
- [ ] Skip scheduling/availability feature (not implemented)
  - Do not collect availability data
  - Skip availability-related UI
  - Note: Availability feature will be implemented separately
- [ ] Call `completeOnboarding` mutation when onboarding is completed
  - Use `useCompleteOnboarding` hook
  - Accepts both `KinshipInput` and `ReferralInput` in single mutation
  - Frontend provides `CompleteOnboardingInput`:
    - Kinship input:
      - `user0Id`: Get `patientId` from localStorage/OnboardingContext (parent/guardian)
      - `user1Id`: Get `childId` from localStorage/OnboardingContext (child)
      - `kind`: Set to `1` (backend will override, but include in input)
      - `user0Label`: Set to `1` (guardian)
      - `user1Label`: Set to `2` (child)
    - Referral input:
      - `submitterId`: Get `patientId` from localStorage/OnboardingContext (parent)
      - `organizationId`: Required - provided by frontend (contract handling not implemented)
        - Use hardcoded value or from configuration for now
      - `contractId`: Required - provided by frontend (contract handling not implemented)
        - Use hardcoded value or from configuration for now
      - `intakeId`: Get questionnaire ID from localStorage/context (from `createQuestionnaire` response)
      - `serviceKind`: Set to `2` (backend will override, but include in input - family)
      - `concerns`: Populate from survey answers (mapping handled by frontend)
        - Extract concerns from questionnaire answers
        - Map to string format
        - Frontend handles mapping/extraction
      - `data`: Accept any JSON structure (default to empty object `{}` if not provided)
        - Can be populated with additional metadata if needed
      - `marketId`: Set to `1` (backend will override, but include in input - integer, not UUID)
  - Execute mutation (backend handles transaction)
- [ ] Handle transaction success/failure
  - Success:
    - Display success message
    - Show completion confirmation
    - Navigate to completion/success page
    - Clear onboarding data from localStorage (optional - or keep for reference)
  - Failure:
    - Display error message from payload
    - Show which operation failed (kinship or referral)
    - Allow user to retry
    - Keep all data in localStorage for retry
- [ ] Display completion status
  - Show loading indicator during mutation
  - Show success message after completion
  - Show error message if transaction fails
  - Display last saved indicator (relative time format)
- [ ] Add loading states
  - Show loading spinner during `completeOnboarding` mutation
  - Disable completion button during mutation
  - Show progress indicator
  - Use loading state from mutation hook

#### Error Handling
- [ ] Create error boundary components
- [ ] Display user-friendly error messages
- [ ] Show error messages and allow user to retry (no automatic retry for user-initiated actions)
- [ ] Add error logging to console
- [ ] Handle network errors gracefully

#### Form Validation
- [ ] Implement client-side validation for immediate feedback
- [ ] Display server-side validation errors
- [ ] Validate email format, required fields, file sizes, etc.

### Acceptance Criteria
- All components integrated with GraphQL API
- ParentDataEntry component works end-to-end
- Insurance upload and results work correctly
- Intake survey creates questionnaire and child record
- Onboarding completion creates kinship and referral in transaction
- Auto-save works with debounce
- Loading states displayed during operations
- Error handling works correctly
- Form validation works (client and server side)

### Testing
- [ ] Test complete onboarding flow end-to-end
- [ ] Test auto-save functionality
- [ ] Test error handling and retry
- [ ] Test form validations
- [ ] Test loading states
- [ ] Test localStorage persistence
- [ ] Test database sync on step completion

---

## PR #10: Frontend Logging & Testing

**Goal:** Add comprehensive frontend logging, create Postman collections, and complete documentation.

### Tasks

#### Frontend Logging
- [ ] Set up structured logging format
- [ ] Log all user actions:
  - Action type (form_submit, file_upload, step_navigation, button_click)
  - Component name
  - Step number
  - Timestamp
  - User ID (from context/localStorage)
  - Action data (sanitized - exclude sensitive information)
- [ ] Log all GraphQL API calls:
  - Request ID (correlate with backend)
  - Mutation/query name
  - Request timestamp
  - Request duration
  - Success/error status
  - Error details (if any)
  - Retry attempts (if applicable)
- [ ] Log localStorage operations:
  - Operation type (save, load, clear)
  - Key name
  - Data size (bytes)
  - Timestamp
- [ ] Log context updates:
  - Context field updated
  - Previous value (summary)
  - New value (summary)
  - Timestamp
- [ ] Log all frontend errors:
  - Error type (network, validation, runtime, GraphQL)
  - Error message
  - Component where error occurred
  - Stack trace (development only)
  - User action that triggered error
  - Request ID (if applicable)
- [ ] Log auto-save operations:
  - Step number
  - Data keys saved
  - Save duration
  - Success/failure status
  - Timestamp
- [ ] Log database sync operations:
  - Step number
  - Sync type (step_completion, final_submission)
  - Records created/updated
  - Sync duration
  - Success/failure status
  - Error details (if any)
- [ ] Correlate frontend logs with backend using request IDs
- [ ] Sanitize sensitive data in logs (hash emails, exclude full base64 content)

#### Postman Collection
- [ ] Create comprehensive Postman collection
- [ ] Organize requests by feature area:
  - Authentication (JWT - basic structure)
  - Patient/Guardian Queries
  - Questionnaire Queries
  - Insurance Queries
  - Referral Queries
  - Patient/Guardian Mutations
  - Questionnaire Mutations
  - Insurance Mutations
  - Referral Mutations
  - Document Upload Mutations
- [ ] Add sample queries with variables
- [ ] Add sample mutations with variables
- [ ] Add file upload examples (base64 encoding)
- [ ] Set up Postman environments:
  - Development: `http://localhost:3001/api/graphql`
  - Production: `https://api.daybreakhealth.com/api/graphql` (or configured URL)
- [ ] Add Postman test scripts:
  - Validate response status codes
  - Check response structure
  - Verify data types
  - Test error scenarios

#### Documentation
- [ ] Document GraphQL schema (types, queries, mutations)
- [ ] Create API documentation with examples
- [ ] Document authentication flow (for future implementation)
- [ ] Create developer guide:
  - Setup instructions
  - Environment variables
  - Running the application
  - Testing procedures
  - Logging guidelines

### Acceptance Criteria
- Frontend logging implemented for all operations
- Logs correlate with backend using request IDs
- Sensitive data sanitized in logs
- Postman collection complete with all queries and mutations
- Postman environments configured
- Documentation complete

### Testing
- [ ] Verify frontend logs are written to console
- [ ] Verify logs correlate with backend logs using request IDs
- [ ] Verify sensitive data is sanitized
- [ ] Test all Postman requests work correctly
- [ ] Verify documentation is accurate and complete

---

## Implementation Order Summary

1. **PR #1**: Backend Infrastructure Setup
2. **PR #2**: ActiveRecord Models & Associations
3. **PR #3**: GraphQL Schema Foundation
4. **PR #4**: Core Mutations - Patient & Questionnaire
5. **PR #5**: File Upload & S3 Integration
6. **PR #6**: Insurance & Referral Mutations
7. **PR #7**: Backend Logging Implementation
8. **PR #8**: Frontend GraphQL Client Setup
9. **PR #9**: Frontend Component Integration
10. **PR #10**: Frontend Logging & Testing

## Notes

- Each PR should be tested independently before moving to the next
- PRs are designed to be non-breaking to existing UI and database
- Backend PRs (#1-7) can be developed in parallel with frontend preparation
- Frontend PRs (#8-10) depend on backend PRs being complete
- All PRs should maintain backward compatibility with existing functionality
- No changes to existing database schema (only using existing tables)
- No changes to existing UI components unless explicitly stated

