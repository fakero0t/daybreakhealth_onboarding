# Database to Frontend Connection Plan - GraphQL API Integration

## Overview
This document outlines the plan to connect the Daybreak Health onboarding frontend to a PostgreSQL database via a Ruby on Rails GraphQL API. The implementation will enable efficient data querying, real-time updates, and seamless integration between UI views and database tables.

## Architecture Overview

```
Frontend (Next.js/JavaScript) 
    ↓ GraphQL Queries/Mutations
Rails GraphQL API (Ruby on Rails)
    ↓ ActiveRecord ORM
PostgreSQL Database
```

## Technology Stack

### Backend
- **Framework**: Ruby on Rails (latest stable version)
- **Ruby**: Latest stable version
- **GraphQL**: graphql-ruby gem
- **Database**: PostgreSQL (as per existing schema, credentials already configured)
- **ORM**: ActiveRecord
- **API Testing**: Postman collections

### Frontend
- **GraphQL Client**: graphql-request
- **HTTP Client**: fetch API
- **State Management**: Continue using OnboardingContext with GraphQL integration and localStorage for auto-saves
- **Authentication**: JWT tokens stored in localStorage/sessionStorage
- **Data Persistence**: Use localStorage for auto-saves during onboarding flow, sync to database on completion

## Implementation Plan

### Phase 1: Rails Backend Setup

#### 1.1 Initialize Rails API Application
- Create new Rails API-only application in root directory (separate from UI folder)
- Configure PostgreSQL database connection to existing database (credentials already configured)
- Set up CORS for frontend domain (allow `http://localhost:3000` for dev, production domain for production)
- Configure GraphQL endpoint at `/api/graphql`
- Configure environment variables using `.env` file (JWT secret, S3 credentials)
- Rails API server: Run on port 3001 to avoid conflict with Next.js frontend on port 3000
- Skip JWT validation until login page is implemented (allow all requests for now)

#### 1.4 S3 Bucket Setup

**Note**: One S3 bucket per environment (dev, staging, production)

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

**Step 5: Environment Variables**
- Store bucket name in environment variable: `S3_BUCKET_NAME` (different per environment)
- Store AWS credentials: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Optionally set AWS region: `AWS_REGION`

#### 1.2 Install Required Gems
```ruby
# Gemfile additions
gem 'graphql'
gem 'graphql-batch' # For N+1 query optimization
gem 'pg' # PostgreSQL adapter
gem 'pgcrypto' # For PII encryption
gem 'rack-cors' # CORS support
gem 'jwt' # JWT authentication
gem 'aws-sdk-s3' # S3 file storage for insurance cards
gem 'bcrypt' # Password hashing (if needed for user authentication)
```

#### 1.3 Database Configuration
- Connect to existing PostgreSQL database (schema already created per `daybreak_db_prd.md`)
- Verify database connection and table structure
- Ensure database indexes are in place as specified in schema
- Verify pgcrypto extension is enabled for PII encryption

### Phase 2: ActiveRecord Models

#### 2.1 Core Models
Create ActiveRecord models matching database schema:

**Primary Models:**
- `PatientAndGuardian` (patients_and_guardians table)
- `Clinician` (clinicians table)
- `Questionnaire` (questionnaires table)
- `InsuranceCoverage` (insurance_coverages table)
- `Referral` (referrals table)
- `ReferralMember` (referral_members table)
- `PatientAvailability` (patient_availabilities table)
- `Document` (documents table - for insurance card storage)

**Supporting Models:**
- `Kinship` (kinships table)
- `Organization` (organizations table)
- `Contract` (contracts table)
- `OrgContract` (org_contracts table)
- `Membership` (memberships table)
- `ClinicianAvailability` (clinician_availabilities table)
- `ClinicianCredentialedInsurance` (clinician_credentialed_insurances table)
- `ClinicianInsuranceAffiliation` (clinician_insurance_affiliations table)

#### 2.2 Model Associations
Define relationships:
- PatientAndGuardian has_many :questionnaires (as subject)
- PatientAndGuardian has_many :insurance_coverages
- PatientAndGuardian has_many :referrals (as submitter)
- PatientAndGuardian has_many :patient_availabilities
- Questionnaire belongs_to :subject (PatientAndGuardian)
- Questionnaire belongs_to :respondent (PatientAndGuardian or Clinician)
- Referral belongs_to :submitter (PatientAndGuardian)
- Referral belongs_to :intake (Questionnaire)
- Referral has_many :referral_members
- InsuranceCoverage belongs_to :user (PatientAndGuardian)

#### 2.3 Model Validations
- Email format validation
- Required field validations
- JSONB field structure validation
- Date range validations

### Phase 3: GraphQL Schema Design

#### 3.1 GraphQL Types
Create GraphQL object types for each model:

**Core Types:**
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

type PatientAvailability {
  id: ID!
  userId: ID!
  availability: JSON!
  createdAt: DateTime!
  updatedAt: DateTime!
  user: PatientAndGuardian!
}

type Document {
  id: ID!
  userId: ID
  kind: Int
  url: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AuthPayload {
  token: String!
  user: PatientAndGuardian!
}
```

#### 3.2 GraphQL Queries
Define queries for data fetching:

```graphql
type Query {
  # Patient/Guardian queries
  patientAndGuardian(id: ID!): PatientAndGuardian
  patientAndGuardianByEmail(email: String!): PatientAndGuardian
  
  # Questionnaire queries
  questionnaire(id: ID!): Questionnaire
  questionnairesBySubject(subjectId: ID!): [Questionnaire!]
  questionnairesByRespondent(respondentId: ID!): [Questionnaire!]
  
  # Insurance queries
  insuranceCoverage(id: ID!): InsuranceCoverage
  insuranceCoveragesByUser(userId: ID!): [InsuranceCoverage!]
  
  # Referral queries
  referral(id: ID!): Referral
  referralsBySubmitter(submitterId: ID!): [Referral!]
  
  # Availability queries
  patientAvailability(id: ID!): PatientAvailability
  patientAvailabilitiesByUser(userId: ID!): [PatientAvailability!]
  
  # Document queries
  document(id: ID!): Document
  documentsByUser(userId: ID!): [Document!]
}
```

#### 3.3 GraphQL Mutations
Define mutations for data creation/updates:

```graphql
type Mutation {
  # Patient/Guardian mutations
  createPatientAndGuardian(input: PatientAndGuardianInput!): PatientAndGuardianPayload!
  updatePatientAndGuardian(id: ID!, input: PatientAndGuardianInput!): PatientAndGuardianPayload!
  createChildRecord(input: PatientAndGuardianInput!): PatientAndGuardianPayload! # Create child record from questionnaire data
  # Authentication mutations (to be implemented when login page is added)
  login(email: String!, password: String!): AuthPayload!
  logout: Boolean!
  
  # Questionnaire mutations
  createQuestionnaire(input: QuestionnaireInput!): QuestionnairePayload!
  updateQuestionnaire(id: ID!, input: QuestionnaireInput!): QuestionnairePayload!
  completeQuestionnaire(id: ID!): QuestionnairePayload!
  
  # Insurance mutations
  createInsuranceCoverage(input: InsuranceCoverageInput!): InsuranceCoveragePayload!
  updateInsuranceCoverage(id: ID!, input: InsuranceCoverageInput!): InsuranceCoveragePayload!
  verifyInsuranceCoverage(id: ID!): InsuranceCoveragePayload! # Mock/placeholder verification for now
  
  # Referral mutations
  createReferral(input: ReferralInput!): ReferralPayload!
  updateReferral(id: ID!, input: ReferralInput!): ReferralPayload!
  
  # Kinship mutations
  createKinship(input: KinshipInput!): KinshipPayload!
  
  # Onboarding completion (transaction mutation)
  completeOnboarding(input: CompleteOnboardingInput!): CompleteOnboardingPayload!
  
  # Availability mutations
  createPatientAvailability(input: PatientAvailabilityInput!): PatientAvailabilityPayload!
  updatePatientAvailability(id: ID!, input: PatientAvailabilityInput!): PatientAvailabilityPayload!
  
  # Document mutations
  uploadDocument(input: DocumentInput!): DocumentPayload!
  deleteDocument(id: ID!): DeletePayload!
}
```

#### 3.4 Input Types
Define input types for mutations:

```graphql
input PatientAndGuardianInput {
  email: String
  firstName: String
  lastName: String
  phone: String
  preferredName: String
  preferredLanguage: String # eng, spa, yue, cmn, por, vie - defaults to "eng" if not provided
  preferredPronoun: String
  role: Int # Always set to 1 (patient/guardian)
  profileData: JSON
  address: JSON # Format: {city: String, state: String, zip_code: String, street_address_1: String, street_address_2: String} - all fields optional
}

input QuestionnaireInput {
  subjectId: ID!
  respondentId: ID! # Should be same as subjectId (parent answering about child)
  type: Int! # Always set to 3 (standard) - matching database enum values
  questionAnswers: JSON! # Format: {question_1_answer: 'value', question_2_answer: 'value', ...}
  startedAt: DateTime
}

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

input PatientAvailabilityInput {
  userId: ID!
  availability: JSON!
}

input DocumentInput {
  userId: ID
  kind: Int!
  file: String! # Base64-encoded file data
  fileName: String!
  contentType: String! # e.g., "image/jpeg", "image/png", "application/pdf"
}

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

input CompleteOnboardingInput {
  kinship: KinshipInput!
  referral: ReferralInput!
}

input KinshipInput {
  user0Id: ID!
  user1Id: ID!
  kind: Int! # Always set to 1 (relationship type)
  user0Label: Int! # 1 = guardian
  user1Label: Int! # 2 = child
}
```

#### 3.5 Payload Types
Define payload types for mutations (standard GraphQL pattern with data and errors):

```graphql
type PatientAndGuardianPayload {
  patientAndGuardian: PatientAndGuardian
  errors: [String!]
}

type QuestionnairePayload {
  questionnaire: Questionnaire
  errors: [String!]
}

type InsuranceCoveragePayload {
  insuranceCoverage: InsuranceCoverage
  errors: [String!]
}

type ReferralPayload {
  referral: Referral
  errors: [String!]
}

type KinshipPayload {
  kinship: Kinship
  errors: [String!]
}

type PatientAvailabilityPayload {
  patientAvailability: PatientAvailability
  errors: [String!]
}

type DocumentPayload {
  document: Document
  errors: [String!]
}

type DeletePayload {
  success: Boolean!
  errors: [String!]
}

type CompleteOnboardingPayload {
  kinship: Kinship
  referral: Referral
  errors: [String!]
}

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

**Note on Error Handling:**
- Use standard GraphQL errors array format for all mutations
- Return errors in payload `errors` field for validation/business logic errors
- Use GraphQL errors array for system errors (network, database failures)
- DateTime format: ISO 8601 (e.g., "2024-01-15T14:34:00Z")
- JSON fields: Return as parsed JSON objects (GraphQL JSON scalar type)

**Note on RespondentUnion:**
- `Questionnaire.respondent` should be a union type: `union RespondentUnion = PatientAndGuardian | Clinician`

### Phase 4: GraphQL Resolvers

#### 4.1 Query Resolvers
Implement resolvers for efficient data fetching:
- Use `graphql-batch` for N+1 query prevention
- Keep queries simple (no complexity limits enforced)
- Implement pagination for list queries (optional, as needed)
- Add filtering and sorting capabilities (optional, as needed)
- Skip authorization and access control for now (JWT validation disabled until login page is implemented)
- **Soft delete filtering**: Automatically filter out records where `_fivetran_deleted = true` in all queries
- **PII encryption**: Encrypt email, phone, and address fields using pgcrypto at model level
- **Unique email constraint**: Enforce at both database level (unique index) and application level (model validation)

#### 4.2 Mutation Resolvers
Implement mutation resolvers:
- Validate input data
- Handle business logic
- Return appropriate errors
- Trigger side effects (notifications, etc.)
- For `uploadDocument`: Decode base64 file, validate file type, enforce 10MB max size (before encoding), upload to S3, store metadata in documents table
  - Document kind values: Use defaults (1 = front of insurance card, 2 = back of insurance card)
  - Base64 size calculation: Use formula `(base64_length * 3) / 4 - padding` to calculate original file size
  - S3 object key naming: `{userId}/{kind}/{uuid}.{ext}` (e.g., "user-123/1/abc-def-ghi.jpeg")
- For `verifyInsuranceCoverage`: Route only - no mock/verification logic (verification handled separately)
- For `createQuestionnaire`: 
  - Validate that respondentId equals subjectId (backend validation)
  - Always set type to `3` (standard) in backend - matching database enum values
  - Accept questionAnswers in database format (transformation handled by frontend)
- For `createInsuranceCoverage`: 
  - Set `kind: 2` (insurance) in backend - matching database enum values
  - Set `eligibility: 2` (submitted) initially in backend, update to `4` (eligible) or `6` (expired) after verification
  - Set `front_card_url` and `back_card_url` from `documents` table signed URLs (from uploaded insurance cards)
  - Leave extracted insurance card fields empty (member_id, group_id, plan_holder_*, etc.)
  - Leave `insurance_company_name` empty for now
- For `createPatientAndGuardian` (parent and child records):
  - Accept patient/guardian information in input
  - Set `role: 1` (patient/guardian) automatically in backend
  - Set `preferred_language` to "eng" if not provided (backend default)
  - Return `patientId` or `childId` for frontend to store in localStorage and OnboardingContext
- For `createKinship`:
  - Create `kinships` record linking parent to child
  - `kind`: Always set to `1` (relationship type)
  - `user_0_label`: 1 (guardian)
  - `user_1_label`: 2 (child)
- For `createReferral`:
  - `organizationId`: Required in input (no backend lookup/default - contract handling not implemented)
  - `contractId`: Required in input (no backend lookup - contract handling not implemented)
  - `concerns`: Accept as string input (mapping/extraction handled by frontend)
  - `data`: Accept any JSON structure (default to empty object `{}` if not provided)
- For `completeOnboarding` (transaction mutation):
  - Execute `createKinship` and `createReferral` in a single database transaction
  - If either fails, rollback entire transaction and return error to user
  - Accept both kinship and referral inputs in single mutation
  - Return combined payload with both records or errors

#### 4.3 File Upload Handling
- Receive file uploads through GraphQL `uploadDocument` mutation (using base64 encoding - frontend handles encoding)
- Validate file types before processing (accept: image/jpeg, image/png, application/pdf)
- Enforce maximum file size: 10MB before base64 encoding
- Calculate base64 size using formula: `(base64_length * 3) / 4 - padding` to determine original file size
- Reject if calculated original file size exceeds 10MB
- Upload insurance card images to S3 bucket via S3 service
- S3 object key naming: `{userId}/{kind}/{uuid}.{ext}` (e.g., "user-123/1/abc-def-ghi.jpeg")
- Generate signed URLs for file access/display with 1 hour expiration (store signed URLs in `documents` table)
- Store signed URLs, S3 object keys, and metadata (kind, userId) in `documents` table
- **Insurance coverage URL linking**: When creating `insurance_coverages` record, set `front_card_url` and `back_card_url` from the corresponding `documents` table signed URLs
- **Extracted insurance data**: Leave extracted insurance card fields empty for now (member_id, group_id, plan_holder_*, etc.) - no OCR/extraction implemented

### Phase 5: Frontend Integration

#### 5.1 GraphQL Client Setup
Install and configure GraphQL client:
```bash
npm install graphql-request graphql
```

Create GraphQL client configuration:
- Set API endpoint URL: `http://localhost:3001/api/graphql` for dev (Rails API on port 3001 to avoid conflict with Next.js on 3000), production URL for production
- Skip JWT authentication headers for now (validation disabled until login page is implemented)
- Set up error handling with user-friendly messages
- Implement retry logic for failed requests: 3 retry attempts with exponential backoff (1s, 2s, 4s intervals) for network errors and S3 upload failures
- Add request/response logging to console

#### 5.2 GraphQL Query Hooks
Create custom React hooks for common queries:
- `usePatientAndGuardian(id)`
- `useQuestionnaires(subjectId)`
- `useInsuranceCoverages(userId)`
- `useReferral(id)`
- `usePatientAvailability(userId)`

#### 5.3 Component Integration

**ParentDataEntry Component (NEW - Step 1):**
- **Purpose**: Collect parent/guardian information to create `patients_and_guardians` record
- **Note**: Frontend handles field collection and mapping - backend provides route only
- **Auto-save**: Store form data in localStorage as user types
- **Mutation**: `createPatientAndGuardian` (called when form is submitted)
  - Frontend handles field mapping to input format
  - Store `patientId` in localStorage and OnboardingContext for future queries
  - **Note**: Kinship record will be created later (Step 6) after child record is created from questionnaire data
- **Validation**: Client-side and server-side validation (email format, required fields)
- **GraphQL Mutation**: `createPatientAndGuardian(input: PatientAndGuardianInput!)`

**LandingPage Component (Step 2):**
- Query: Check if patient exists by email (optional)
- No mutations required
- Display welcome message

**InsuranceUpload Component (Step 3):**
- Mutation: `uploadDocument` (front and back of insurance card - base64 encoded, backend uploads to S3)
  - Front card: use `kind: 1`
  - Back card: use `kind: 2`
- Query: `insuranceCoveragesByUser` (to check existing coverage)

**InsuranceResults Component (Step 4):**
- Query: `insuranceCoverage` (to display verification status)
- Mutation: `verifyInsuranceCoverage` (route only - no verification logic in backend)
- Mutation: `createInsuranceCoverage` (called after verification completes)
  - Set `kind: 2` (insurance) and `eligibility: 2` (submitted) initially
  - After verification: update `eligibility: 4` (eligible) or `eligibility: 6` (expired) via `updateInsuranceCoverage`
  - Set `front_card_url` and `back_card_url` from `documents` table signed URLs (from uploaded insurance cards)
  - Leave extracted insurance card fields empty for now (member_id, group_id, plan_holder_*, etc.)

**IntakeSurvey Component (Step 5):**
- **Auto-save**: Store survey answers in localStorage as user progresses (using existing OnboardingContext)
- **Data transformation**: Frontend handles transformation from frontend format to database format:
  - Frontend: `{q1: 'value', q2: 'value', ...}`
  - Database: `{question_1_answer: 'value', question_2_answer: 'value', ...}`
  - Transform keys: `q1` → `question_1_answer`, `q2` → `question_2_answer`, etc.
- **Child record creation**: Frontend handles questionnaire mapping and child information extraction
- Mutation: `createQuestionnaire` (called when user clicks "Begin Survey" button)
  - Frontend provides `subjectId` and `respondentId` (both use `patientId` from localStorage - parent)
  - Frontend provides `questionAnswers` in database format (transformation handled by frontend)
  - Backend validates that `respondentId` equals `subjectId`
- Mutation: `createChildRecord` (NEW - called after questionnaire completion)
  - Frontend extracts child information from questionnaire answers and provides in input
  - Backend creates child record in `patients_and_guardians` table
  - Frontend stores `childId` in localStorage and OnboardingContext
- Mutation: `updateQuestionnaire` (called on completion, syncs localStorage to database)
- Mutation: `completeQuestionnaire` (when survey is completed, sets `completed_at`)
- Query: `questionnaire` (to load saved progress from database if needed)

**SchedulingAssistant Component (Step 6):**
- **Note**: Scheduling feature is not being implemented at this time - skip availability collection
- **Auto-save**: Store completion status in localStorage
- **When referrals are used**: Referrals are created at the end of onboarding (Step 6) when user completes the onboarding process. This is the final step that creates the referral record linking parent, child, questionnaire, and insurance coverage together.
- Mutation: `completeOnboarding` (single mutation that handles both kinship and referral in transaction)
  - Accepts both `KinshipInput` and `ReferralInput` in single mutation
  - Executes `createKinship` and `createReferral` in database transaction
  - If either fails, rollback entire transaction and return error to user
  - Kinship fields:
    - `user_0_id`: parent/guardian ID
    - `user_1_id`: child ID
    - `kind`: Always set to `1` (relationship type)
    - `user_0_label`: 1 (guardian)
    - `user_1_label`: 2 (child)
  - Referral fields:
    - `submitterId`: Use `patientId` from localStorage/context (parent)
    - `organizationId`: Frontend provides (contract handling not implemented - no backend lookup)
    - `contractId`: Frontend provides (contract handling not implemented - no backend lookup)
    - `intakeId`: Link to completed questionnaire
    - `serviceKind`: Always set to `2` (family) in backend - matching database enum values
    - `concerns`: Frontend populates from survey answers (mapping handled by frontend)
    - `data`: Accept any JSON structure (default to empty object `{}` if not provided)
    - `marketId`: Always set to integer `1` (not UUID)
- **Note**: `ReferralMember` records are not created during onboarding - handled separately

#### 5.4 State Management Updates
Update `OnboardingContext.jsx`:
- **Keep localStorage for auto-saves**: Continue using localStorage for all form data during onboarding
- **Auto-save debounce**: Debounce localStorage saves to 500ms after user stops typing (not on every keystroke)
- **Add patientId tracking**: Store `patientId` (UUID from `createPatientAndGuardian`) in context and localStorage
- **Add childId tracking**: Store `childId` (UUID from `createChildRecord`) in context and localStorage
- **Add last saved indicator**: Display relative time format (e.g., "Saved 5 minutes ago", "Saved just now") for last successful database sync
- **Sync to database on completion**: Only sync to database when user completes each major step or entire onboarding
- **Data transformation layer**: Add utility functions to transform frontend data format to database format:
  - Survey answers: `{q1: 'value'}` → `{question_1_answer: 'value'}`
  - Address: Form fields → JSONB object structure
  - Availability: UI selection → JSONB array structure
- Add loading states for API calls (per-mutation granularity, only during sync operations)
- Handle error states with user-friendly messages
- Implement retry logic for failed mutations: 3 retry attempts with exponential backoff (1s, 2s, 4s intervals)
- Add error logging for debugging
- **Auto-save strategy**: Save to localStorage immediately (debounced), sync to database on step completion or final submission

#### 5.5 Error Handling
- Create error boundary components
- Display user-friendly error messages to users
- **Error handling strategy**: Show error message and allow user to retry (no automatic retry for user-initiated actions)
- **Retry logic**: Implement automatic retry with exponential backoff for network errors and S3 upload failures
- **Form validation**: Client-side validation for immediate feedback, server-side validation for data integrity
- Log errors to console only (no external error tracking service)
- Handle network errors gracefully
- Show loading states during operations
- **Partial completion handling**: If user abandons onboarding mid-flow, keep all partial data in localStorage (do not delete)

### Phase 6: API Testing with Postman

#### 6.1 Postman Collection Structure
Create Postman collection with folders:
- **Authentication** (if needed)
- **Queries**
  - Patient/Guardian Queries
  - Questionnaire Queries
  - Insurance Queries
  - Referral Queries
  - Availability Queries
- **Mutations**
  - Patient/Guardian Mutations
  - Questionnaire Mutations
  - Insurance Mutations
  - Referral Mutations
  - Document Upload Mutations

#### 6.2 Sample Requests

**Query Example:**
```graphql
query GetQuestionnaire($id: ID!) {
  questionnaire(id: $id) {
    id
    questionAnswers
    completedAt
    subject {
      firstName
      lastName
    }
  }
}
```

**Mutation Example:**
```graphql
mutation CreateQuestionnaire($input: QuestionnaireInput!) {
  createQuestionnaire(input: $input) {
    questionnaire {
      id
      questionAnswers
    }
    errors
  }
}
```

#### 6.3 Environment Variables
Set up Postman environments:
- Development: `http://localhost:3001/api/graphql` (Rails API server - adjust port as needed)
- Production: `https://api.daybreakhealth.com/api/graphql` (or configured production URL)

#### 6.4 Test Scripts
Add Postman test scripts:
- Validate response status codes
- Check response structure
- Verify data types
- Test error scenarios

### Phase 7: UI View to Database Table Mapping

#### 7.1 ParentDataEntry → Database (NEW - Step 1)
- **Table**: `patients_and_guardians`
- **Operation**: Create parent/guardian record
- **Fields collected**:
  - `email` (required)
  - `first_name` (required)
  - `last_name` (required)
  - `phone` (optional)
  - `preferred_name` (optional)
  - `preferred_language` (optional - defaults to "eng" if not provided)
  - `preferred_pronoun` (optional)
  - `address` (JSONB: {city, state, zip_code, street_address_1, street_address_2} - all fields optional)
- **Auto-save**: Store in localStorage as user types
- **GraphQL Mutation**: `createPatientAndGuardian(input: PatientAndGuardianInput!)`
- **After creation**: 
  - Store `patientId` (UUID) in localStorage and OnboardingContext
  - **Note**: Kinship record will be created later (Step 6) after child record is created from questionnaire data

#### 7.2 LandingPage → Database (Step 2)
- **Table**: `patients_and_guardians`
- **Operation**: Optional query to check existing patient
- **GraphQL**: `patientAndGuardianByEmail(email: String!)`

#### 7.3 InsuranceUpload → Database (Step 3)
- **Tables**: 
  - `documents` (insurance card images)
- **Operations**:
  - Upload front card → `uploadDocument` mutation (kind: 1)
  - Upload back card → `uploadDocument` mutation (kind: 2)
- **GraphQL Mutations**:
  - `uploadDocument(input: DocumentInput!)`

#### 7.4 InsuranceResults → Database (Step 4)
- **Tables**: 
  - `documents` (insurance card images stored here with signed URLs)
  - `insurance_coverages` (insurance coverage record with URLs to documents)
- **Operations**:
  - Query insurance verification status
  - Trigger verification (route only - no verification logic)
  - Create insurance coverage after verification completes
  - Link insurance card signed URLs from `documents` table to `insurance_coverages` record
- **GraphQL Query**: `insuranceCoverage(id: ID!)`
- **GraphQL Mutations**: 
  - `verifyInsuranceCoverage(id: ID!)` (route only - verification handled separately)
  - `createInsuranceCoverage(input: InsuranceCoverageInput!)` (called after verification completes)
    - Set `kind: 2` (insurance)
    - Set `eligibility: 2` (submitted) initially, then `4` (eligible) or `6` (expired) after verification via `updateInsuranceCoverage`
    - Set `front_card_url` and `back_card_url` from `documents` table signed URLs
    - Leave extracted insurance card fields empty (member_id, group_id, plan_holder_*, etc.)

#### 7.5 IntakeSurvey → Database (Step 5)
- **Tables**: 
  - `questionnaires` (survey answers)
  - `patients_and_guardians` (child record creation)
- **Operations**:
  - **Auto-save**: Store answers in localStorage as user progresses (existing OnboardingContext)
  - Create questionnaire when user clicks "Begin Survey" button
  - Frontend handles answer format transformation: `{q1: 'value'}` → `{question_1_answer: 'value'}`
  - Update questionAnswers in database when user completes survey
  - Mark as completed when finished
  - **Child record creation**: Frontend extracts child information from questionnaire answers (first_name, last_name, birthdate/age)
    - Frontend provides child information in `createChildRecord` input
    - Backend creates child record in `patients_and_guardians` table with `role: 1`
    - Frontend stores `childId` in localStorage and OnboardingContext
- **Data Transformation** (handled by frontend):
  - Frontend format: `{q1: 'value', q2: 'value', ...}`
  - Database format: `{question_1_answer: 'value', question_2_answer: 'value', ...}`
  - Transform function: Map `q1` → `question_1_answer`, `q2` → `question_2_answer`, etc.
- **GraphQL Mutations**:
  - `createQuestionnaire(input: QuestionnaireInput!)` (called on "Begin Survey" click)
    - Frontend provides `questionAnswers` in database format (transformation handled by frontend)
    - Backend validates `respondentId` equals `subjectId`
  - `updateQuestionnaire(id: ID!, input: QuestionnaireInput!)` (sync localStorage to database on completion)
  - `completeQuestionnaire(id: ID!)` (sets `completed_at` timestamp)
- **GraphQL Query**: `questionnaire(id: ID!)` (to load saved progress from database if needed)

#### 7.6 SchedulingAssistant → Database (Step 6)
- **Note**: Scheduling feature is not being implemented at this time - skip availability collection
- **Tables**:
  - `referrals` (onboarding completion)
  - `kinships` (parent-child relationship)
- **Operations**:
  - Create kinship record and referral in a database transaction via single mutation
  - If either fails, rollback and return error to user
- **GraphQL Mutation**:
  - `completeOnboarding(input: CompleteOnboardingInput!)`
    - Accepts both `KinshipInput` and `ReferralInput` in single mutation
    - Executes both in database transaction
    - Kinship fields:
      - `kind`: Always set to `1` (relationship type) in backend
      - `user_0_label`: 1 (guardian)
      - `user_1_label`: 2 (child)
    - Referral fields:
      - `serviceKind`: Always set to `2` (family) in backend - matching database enum values
      - `organizationId`: Required - provided by frontend (contract handling not implemented)
      - `contractId`: Required - provided by frontend (contract handling not implemented)
      - `concerns`: Frontend populates from survey answers (mapping handled by frontend)
      - `data`: Accept any JSON structure (default to empty object `{}` if not provided)
      - `marketId`: Always set to integer `1` (not UUID) in backend
- **Note**: `ReferralMember` records are not created during onboarding - handled separately

### Phase 8: Data Flow Examples

#### 8.1 Parent Data Entry Flow (NEW - Step 1)
1. User enters parent/guardian information → Auto-save to localStorage as user types
2. User submits form → `createPatientAndGuardian` mutation → `patients_and_guardians` table created
   - Set `role: 1` (patient/guardian) automatically
   - Set `preferred_language` to "eng" if not provided
   - Transform address form fields to JSONB: `{city, state, zip_code, street_address_1, street_address_2}` (all fields optional)
3. Store `patientId` (UUID) in localStorage and OnboardingContext
4. Navigate to next step (LandingPage)
5. **Note**: Kinship record will be created later (Step 6) after child record is created from questionnaire data

#### 8.2 Insurance Upload Flow (Step 3)
1. User uploads front card → Auto-save file reference to localStorage
2. User uploads back card → Auto-save file reference to localStorage
3. User submits → Frontend base64-encodes files → `uploadDocument` mutation (base64 file, kind: 1 for front) → Backend uploads to S3 → `documents` table (stores signed URL)
4. `uploadDocument` mutation (base64 file, kind: 2 for back) → Backend uploads to S3 → `documents` table (stores signed URL)
5. Frontend triggers verification → `verifyInsuranceCoverage` mutation (route only - verification handled separately)
6. After verification completes → `createInsuranceCoverage` mutation → `insurance_coverages` table created
   - Set `kind: 2` (insurance)
   - Set `eligibility: 2` (submitted) initially, then `4` (eligible) or `6` (expired) after verification via `updateInsuranceCoverage`
   - Set `front_card_url` and `back_card_url` from `documents` table signed URLs
   - Leave extracted insurance card fields empty (member_id, group_id, plan_holder_*, etc.)
7. Display results → `insuranceCoverage` query → Display status

#### 8.3 Intake Survey Flow (Step 5)
1. User clicks "Begin Survey" button → `createQuestionnaire` mutation → `questionnaires` table
   - `type: 3` (standard) - matching database enum
   - `respondentId = subjectId` (both use `patientId` from localStorage - parent)
   - `questionAnswers`: Frontend provides in database format (transformation handled by frontend)
2. User answers questions → Auto-save to localStorage (existing OnboardingContext)
   - Frontend format: `{q1: 'value', q2: 'value', ...}`
   - **Note**: Questionnaire should include questions to collect child information (first_name, last_name, birthdate/age)
3. User completes survey → Frontend transforms answers to database format:
   - Transform: `{q1: 'value'}` → `{question_1_answer: 'value'}`
   - `updateQuestionnaire` mutation → `question_answers` JSONB field updated in database
4. `completeQuestionnaire` mutation → `completed_at` timestamp set
5. Frontend extracts child information from questionnaire → `createChildRecord` mutation → `patients_and_guardians` table
   - Frontend provides child information in input
   - Backend creates child record with `role: 1` (patient/guardian)
   - Frontend stores `childId` in localStorage and OnboardingContext
6. On page reload → Load from localStorage (primary source), optionally sync from database if needed

#### 8.4 Onboarding Completion Flow (Step 6)
1. User completes onboarding → `completeOnboarding` mutation (single mutation that handles both in transaction)
   - Accepts both `KinshipInput` and `ReferralInput` in single mutation
   - Executes `createKinship` and `createReferral` in database transaction
   - If either fails, rollback entire transaction and return error to user
2. Create kinship record → `kinships` table
   - `user_0_id`: parent/guardian ID (from localStorage)
   - `user_1_id`: child ID (from localStorage)
   - `kind`: Always set to `1` (relationship type) in backend
   - `user_0_label`: 1 (guardian)
   - `user_1_label`: 2 (child)
3. Create referral record → `referrals` table
   - `submitterId`: Use `patientId` from localStorage (parent)
   - `organizationId`: Provided by frontend (contract handling not implemented)
   - `contractId`: Provided by frontend (contract handling not implemented)
   - `intakeId`: Link to completed questionnaire ID
   - `serviceKind`: Always set to `2` (family) in backend - matching database enum values
   - `concerns`: Frontend populates from survey answers (mapping handled by frontend)
   - `data`: Accept any JSON structure (default to empty object `{}` if not provided)
   - `marketId`: Always set to integer `1` (not UUID) in backend
4. Link questionnaire → `referral.intake_id` set to questionnaire ID
5. Link insurance → `referral` associated with insurance coverage
6. **Note**: Scheduling/availability feature skipped - not implemented at this time
7. **Note**: `ReferralMember` records are not created during onboarding - handled separately
8. **When referrals are used**: Referrals are created at the end of onboarding (Step 6) when user completes the onboarding process. This is the final step that creates the referral record linking parent, child, questionnaire, and insurance coverage together.

### Phase 9: Security & Performance

#### 9.1 Authentication & Authorization
- Skip JWT validation until login page is implemented (allow all requests for now)
- Include basic login/logout mutations structure (to be implemented when login page is created)
- JWT token validation middleware: Disabled for now
- Authorization checks in GraphQL resolvers: Disabled for now
- Encrypt sensitive data (PII) using pgcrypto extension (implement at model level for fields containing PII)
- Store JWT secret in environment variables (for future use)
- Note: Full authentication flow will be implemented when login page is added

#### 9.2 Performance Optimization
- Implement GraphQL query batching
- Use DataLoader pattern for N+1 prevention
- Add database query optimization
- Implement caching strategy
- Add pagination for large datasets

#### 9.3 Error Handling
- Standardize error response format (use GraphQL error format with user-friendly messages)
- Use standard GraphQL errors array format for all mutations
- Return errors in payload `errors` field for validation/business logic errors
- Use GraphQL errors array for system errors (network, database failures)
- Implement proper HTTP status codes (200 for GraphQL responses, 400 for client errors, 500 for server errors)
- Add error logging to Rails console/logs only (no external monitoring service)
- Create user-friendly error messages for frontend
- Implement retry logic: 3 retry attempts with exponential backoff (1s, 2s, 4s intervals) for network errors and S3 upload failures
- Log all errors with context to console for debugging
- Return appropriate error responses for validation failures, database transaction failures, and file upload failures

#### 9.4 Comprehensive Logging
Implement comprehensive logging for all operations to track user actions, system events, and debugging information.

**Log Levels:**
- `DEBUG`: Detailed information for debugging (request/response payloads, intermediate steps)
- `INFO`: General informational messages (successful operations, state changes)
- `WARN`: Warning messages (validation failures, retry attempts, non-critical errors)
- `ERROR`: Error messages (failed operations, exceptions, system errors)

**Log Storage:**
- Backend: Rails log files (`log/development.log`, `log/production.log`)
- Frontend: Browser console (development), structured logging to console (production)
- Log format: JSON-structured logs for easy parsing and analysis
- Log retention: 30 days for development, 90 days for production

**Backend Logging (Rails):**

**GraphQL Request Logging:**
- Log every GraphQL query/mutation request with:
  - Timestamp (ISO 8601 format)
  - Request ID (unique identifier for request tracing)
  - Operation name (query/mutation name)
  - Operation type (query/mutation)
  - User ID (if available from context)
  - Request variables (sanitized - exclude sensitive data like base64 file content, show only metadata)
  - Request duration (milliseconds)
  - IP address
  - User agent

**GraphQL Response Logging:**
- Log every GraphQL response with:
  - Request ID (for correlation)
  - Response status (success/error)
  - Response time (milliseconds)
  - Error details (if any)
  - Data returned (summary only - IDs and counts, not full payloads)

**Mutation-Specific Logging:**
- `createPatientAndGuardian`: Log patient ID, email (hashed), role, creation status
- `createQuestionnaire`: Log questionnaire ID, subject ID, respondent ID, type, question count, creation status
- `updateQuestionnaire`: Log questionnaire ID, fields updated, completion status
- `completeQuestionnaire`: Log questionnaire ID, completion timestamp
- `createChildRecord`: Log child ID, parent ID, role, creation status
- `uploadDocument`: Log document ID, user ID, file kind, file size, S3 key, upload status, upload duration
- `createInsuranceCoverage`: Log insurance coverage ID, user ID, kind, eligibility status, document URLs
- `verifyInsuranceCoverage`: Log insurance coverage ID, verification status, verification duration
- `createKinship`: Log kinship ID, user_0_id, user_1_id, kind, labels, creation status
- `createReferral`: Log referral ID, submitter ID, organization ID, contract ID, service kind, intake ID, creation status
- `completeOnboarding`: Log transaction start, kinship creation status, referral creation status, transaction commit/rollback, total duration

**Database Operation Logging:**
- Log all database queries with:
  - Query type (SELECT, INSERT, UPDATE, DELETE)
  - Table name
  - Query duration (milliseconds)
  - Rows affected
  - Query parameters (sanitized)
- Log transaction events:
  - Transaction start (with transaction ID)
  - Transaction commit (with duration, records created/updated)
  - Transaction rollback (with reason, records affected)

**S3 Operation Logging:**
- Log all S3 operations with:
  - Operation type (upload, generate_signed_url)
  - Bucket name
  - Object key
  - File size
  - Content type
  - Operation duration (milliseconds)
  - Success/failure status
  - Error details (if any)

**Error Logging:**
- Log all errors with:
  - Error type (validation, database, network, S3, business logic)
  - Error message
  - Stack trace (for exceptions)
  - Request context (request ID, user ID, operation)
  - Error severity
  - Retry attempts (if applicable)

**Performance Logging:**
- Log slow operations (threshold: > 1 second):
  - Operation name
  - Duration
  - Components involved (database, S3, external services)
  - Performance breakdown

**Frontend Logging (Next.js/React):**

**User Action Logging:**
- Log all user interactions with:
  - Action type (form_submit, file_upload, step_navigation, button_click)
  - Component name
  - Step number (for onboarding flow)
  - Timestamp
  - User ID (from context/localStorage)
  - Action data (sanitized - exclude sensitive information)

**API Call Logging:**
- Log all GraphQL requests with:
  - Request ID (correlate with backend)
  - Mutation/query name
  - Request timestamp
  - Request duration
  - Success/error status
  - Error details (if any)
  - Retry attempts (if applicable)

**State Management Logging:**
- Log localStorage operations:
  - Operation type (save, load, clear)
  - Key name
  - Data size (bytes)
  - Timestamp
- Log context updates:
  - Context field updated
  - Previous value (summary)
  - New value (summary)
  - Timestamp

**Error Logging:**
- Log all frontend errors with:
  - Error type (network, validation, runtime, GraphQL)
  - Error message
  - Component where error occurred
  - Stack trace (development only)
  - User action that triggered error
  - Request ID (if applicable)

**Auto-Save Logging:**
- Log auto-save operations:
  - Step number
  - Data keys saved
  - Save duration
  - Success/failure status
  - Timestamp

**Database Sync Logging:**
- Log database sync operations:
  - Step number
  - Sync type (step_completion, final_submission)
  - Records created/updated
  - Sync duration
  - Success/failure status
  - Error details (if any)

**Log Format Example:**
```json
{
  "timestamp": "2024-01-15T14:34:00Z",
  "level": "INFO",
  "request_id": "req-abc123",
  "service": "rails-api",
  "operation": "createPatientAndGuardian",
  "user_id": "user-xyz789",
  "data": {
    "patient_id": "patient-123",
    "email_hash": "sha256:...",
    "role": 1,
    "status": "success"
  },
  "duration_ms": 45,
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

**Logging Best Practices:**
- Never log sensitive data (passwords, full base64 file content, PII in plain text)
- Hash or mask sensitive information (email hashes, partial phone numbers)
- Include request IDs for request tracing across services
- Log at appropriate levels (DEBUG for development, INFO/WARN/ERROR for production)
- Include context (user ID, step number, operation) in all logs
- Log timing information for performance monitoring
- Use structured logging (JSON) for easy parsing and analysis
- Correlate frontend and backend logs using request IDs

### Phase 10: Postman API Testing

#### 10.1 Postman Collection Setup
- Create comprehensive Postman collection
- Organize requests by feature area
- Add authentication requests (JWT token generation - basic structure for now)
- Include sample queries and mutations
- Include file upload examples (base64 encoding)

#### 10.2 Manual Testing
- Test all GraphQL queries
- Test all GraphQL mutations
- Test file upload to S3
- Test JWT authentication flow
- Test error scenarios
- Verify data persistence

## File Structure

### Backend (Rails)
```
daybreakhealth_onboarding/
├── api/                    # Rails API application
│   ├── app/
│   │   ├── graphql/
│   │   │   ├── daybreak_health_schema.rb
│   │   │   ├── types/
│   │   │   │   ├── base_object.rb
│   │   │   │   ├── patient_and_guardian_type.rb
│   │   │   │   ├── questionnaire_type.rb
│   │   │   │   ├── insurance_coverage_type.rb
│   │   │   │   └── ...
│   │   │   ├── mutations/
│   │   │   │   ├── base_mutation.rb
│   │   │   │   ├── create_questionnaire.rb
│   │   │   │   ├── update_questionnaire.rb
│   │   │   │   └── ...
│   │   │   └── resolvers/
│   │   │       ├── questionnaire_resolver.rb
│   │   │       └── ...
│   │   ├── models/
│   │   │   ├── patient_and_guardian.rb
│   │   │   ├── questionnaire.rb
│   │   │   └── ...
│   │   ├── controllers/
│   │   │   ├── graphql_controller.rb
│   │   │   └── auth_controller.rb
│   │   └── services/
│   │       ├── jwt_service.rb
│   │       └── s3_service.rb
│   ├── config/
│   │   ├── database.yml
│   │   └── routes.rb
│   └── db/
│       └── schema.rb
└── [existing UI folder structure]
```

### Frontend (existing structure)
```
[existing UI folder]/
├── lib/
│   ├── graphql/
│   │   ├── client.js          # graphql-request client with JWT auth
│   │   ├── queries/
│   │   │   ├── questionnaire.js
│   │   │   └── insurance.js
│   │   ├── mutations/
│   │   │   ├── questionnaire.js
│   │   │   └── insurance.js
│   │   ├── hooks/
│   │   │   ├── useQuestionnaire.js
│   │   │   └── useInsurance.js
│   │   └── utils/
│   │       ├── auth.js        # JWT token management
│   │       └── errorHandler.js # Error handling with retry logic
```

## Implementation Checklist

### Backend Setup
- [ ] Initialize Rails API application in root directory (api/ folder)
- [ ] Configure PostgreSQL connection to existing database (credentials already configured)
- [ ] Set up `.env` file for environment variable management
- [ ] Configure Rails API server to run on port 3001 (to avoid conflict with Next.js on 3000)
- [ ] Install required gems (graphql, jwt, aws-sdk-s3, etc.)
- [ ] Verify database schema matches requirements
- [ ] Create ActiveRecord models
- [ ] Define model associations
- [ ] Create S3 bucket (choose region and name)
- [ ] Configure S3 bucket CORS policy
- [ ] Set up S3 service for file uploads
- [ ] Configure CORS (allow localhost:3000 for dev)
- [ ] Configure GraphQL endpoint at /api/graphql
- [ ] Skip JWT validation (disabled until login page is implemented)

### GraphQL Implementation
- [ ] Install and configure graphql-ruby
- [ ] Create GraphQL schema
- [ ] Define GraphQL types
- [ ] Define payload types (PatientAndGuardianPayload, QuestionnairePayload, etc.) with standard structure: `{ type: Type, errors: [String!] }`
- [ ] Define RespondentUnion type: `union RespondentUnion = PatientAndGuardian | Clinician`
- [ ] Define CompleteOnboardingPayload type
- [ ] Implement query resolvers (skip JWT auth for now)
- [ ] Implement mutation resolvers (skip JWT auth for now)
- [ ] Add input types (including base64 file upload for DocumentInput)
- [ ] Add login/logout mutations (basic structure - full implementation later)
- [ ] Add completeOnboarding mutation (single mutation that handles both kinship and referral in transaction)
- [ ] Set up error handling with console logging
- [ ] Implement S3 file upload handling (receive base64, validate 10MB max using formula `(base64_length * 3) / 4 - padding`, upload to S3, generate and store signed URLs with 1 hour expiration)
- [ ] Implement S3 object key naming: `{userId}/{kind}/{uuid}.{ext}`
- [ ] Create insurance verification route (no verification logic - handled separately)
- [ ] Set questionnaire type to always be `3` (standard) - matching database enum values
- [ ] Validate respondentId equals subjectId in backend for createQuestionnaire
- [ ] Set insurance coverage kind to `2` (insurance) and eligibility to `2` (submitted) initially, then `4` (eligible) or `6` (expired) after verification - matching database enum values
- [ ] Link insurance card URLs from documents table to insurance_coverages (set front_card_url and back_card_url)
- [ ] Leave extracted insurance card fields empty (member_id, group_id, plan_holder_*, etc.)
- [ ] Leave insurance_company_name empty for now
- [ ] Create child record route (accept child information in input - extraction handled by frontend)
- [ ] Apply default values in backend (preferred_language: "eng", role: 1, type: 3, serviceKind: 2, kind: 2, eligibility: 2, marketId: 1)
- [ ] Enforce unique email at both database level (unique index) and application level (model validation)
- [ ] Filter out soft-deleted records (_fivetran_deleted = true) in all queries
- [ ] Encrypt PII fields (email, phone, address) using pgcrypto at model level
- [ ] Create kinships record linking parent to child (kind always set to 1 in backend)
- [ ] Create referral with concerns from input (mapping handled by frontend), data accepts any JSON structure
- [ ] Accept organizationId and contractId in referral input (contract handling not implemented - no backend lookup)
- [ ] Implement `completeOnboarding` mutation that executes createKinship and createReferral in database transaction (rollback on failure, return error to user)
- [ ] Set marketId to integer 1 (not UUID) in backend
- [ ] Use default document kind values (1 = front, 2 = back)
- [ ] **Implement comprehensive backend logging**
  - [ ] Set up structured JSON logging format
  - [ ] Implement request ID generation and tracking
  - [ ] Log all GraphQL requests (operation name, variables sanitized, duration, IP, user agent)
  - [ ] Log all GraphQL responses (status, duration, error details)
  - [ ] Log mutation-specific details (patient ID, questionnaire ID, document ID, etc.)
  - [ ] Log database operations (query type, table, duration, rows affected)
  - [ ] Log transaction events (start, commit, rollback with reasons)
  - [ ] Log S3 operations (operation type, bucket, key, file size, duration)
  - [ ] Log all errors with context (error type, message, stack trace, request ID)
  - [ ] Log slow operations (> 1 second threshold)
  - [ ] Configure log levels (DEBUG, INFO, WARN, ERROR)
  - [ ] Set up log retention (30 days dev, 90 days production)

### Frontend Integration
- [ ] Install graphql-request
- [ ] Configure GraphQL client (endpoint: /api/graphql)
- [ ] Skip JWT auth headers (validation disabled until login page)
- [ ] Create query hooks
- [ ] Create mutation hooks
- [ ] **Create ParentDataEntry component (NEW - Step 1)**
  - [ ] Frontend handles field collection and mapping to GraphQL input format
  - [ ] Auto-save to localStorage as user types
  - [ ] Transform address form fields to JSONB format
  - [ ] Call createPatientAndGuardian mutation on submit
  - [ ] Store patientId in localStorage and OnboardingContext
  - [ ] Implement client-side and server-side validation
- [ ] **Update OnboardingContext**
  - [ ] Keep localStorage for auto-saves (do not remove)
  - [ ] Add patientId tracking (store UUID from createPatientAndGuardian)
  - [ ] Add childId tracking (store UUID from createChildRecord)
  - [ ] Add data transformation utilities (survey answers, address, availability)
  - [ ] Sync to database on step completion or final submission
- [ ] **Update step flow**: Add ParentDataEntry as Step 1, adjust other steps accordingly
- [ ] Integrate with InsuranceUpload component (base64 encode files, validate 10MB max, send via GraphQL mutation, use kind: 1 for front, kind: 2 for back)
- [ ] Integrate with InsuranceResults component (call createInsuranceCoverage after verification completes, set kind: 2, eligibility: 2 initially, set front_card_url and back_card_url from documents table, leave extracted fields empty)
- [ ] Integrate with IntakeSurvey component
  - [ ] Add questions to collect child information (first_name, last_name, birthdate/age)
  - [ ] Call createQuestionnaire when user clicks "Begin Survey" (type: 3, respondentId = subjectId)
  - [ ] Frontend handles survey answer transformation: {q1: 'value'} → {question_1_answer: 'value'}
  - [ ] Auto-save to localStorage, sync to database on completion
  - [ ] Frontend extracts child information from questionnaire and calls createChildRecord mutation
  - [ ] Store childId in localStorage and OnboardingContext
- [ ] Integrate with SchedulingAssistant component
  - [ ] Skip scheduling/availability feature (not implemented at this time)
  - [ ] Call `completeOnboarding` mutation (single mutation that handles both kinship and referral in transaction)
  - [ ] Create kinship record with kind always set to 1 (in backend)
  - [ ] Create referral on completion with serviceKind always set to 2 (family) in backend
  - [ ] Frontend populates referrals.concerns from survey answers (mapping handled by frontend)
  - [ ] Accept any JSON structure for referrals.data (default to empty object {} if not provided)
  - [ ] Frontend provides organizationId and contractId (contract handling not implemented)
  - [ ] Set marketId to integer 1 (not UUID) in backend
  - [ ] Note: ReferralMember records not created during onboarding
- [ ] Add error handling with user-friendly messages
- [ ] Show error messages and allow user to retry (no automatic retry for user-initiated actions)
- [ ] Implement automatic retry with 3 attempts and exponential backoff (1s, 2s, 4s intervals) for network errors and S3 upload failures
- [ ] Add error logging to console
- [ ] Add loading states (only during database sync operations)
- [ ] Add last saved indicator (display relative time format, e.g., "Saved 5 minutes ago")
- [ ] Implement auto-save debounce (500ms after user stops typing)
- [ ] Implement per-mutation loading states (only during database sync operations)
- [ ] Keep partial data in localStorage if user abandons onboarding mid-flow (do not delete)
- [ ] Implement client-side and server-side form validation
- [ ] **Implement comprehensive frontend logging**
  - [ ] Set up structured logging format
  - [ ] Log all user actions (form_submit, file_upload, step_navigation, button_click)
  - [ ] Log all GraphQL API calls (request ID, mutation/query name, duration, status, errors)
  - [ ] Log localStorage operations (operation type, key, data size)
  - [ ] Log context updates (field updated, value summaries)
  - [ ] Log all frontend errors (error type, message, component, stack trace in dev)
  - [ ] Log auto-save operations (step number, data keys, duration, status)
  - [ ] Log database sync operations (step number, sync type, records, duration, status)
  - [ ] Correlate frontend logs with backend using request IDs
  - [ ] Sanitize sensitive data in logs (hash emails, exclude full base64 content)

### Postman Testing
- [ ] Create Postman collection
- [ ] Add authentication requests (JWT)
- [ ] Add sample queries
- [ ] Add sample mutations
- [ ] Add file upload requests
- [ ] Set up Postman environments (dev, production)

### Documentation
- [ ] Document GraphQL schema
- [ ] Create API documentation
- [ ] Document authentication flow
- [ ] Create developer guide

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Initialize Rails backend
4. Begin Phase 1 implementation
5. Iterate through phases sequentially
6. Test each phase before moving to next
7. Deploy to staging environment
8. Conduct thorough testing
9. Deploy to production

## Notes

- All dates should be standardized to TIMESTAMPTZ in database
- PII encryption using pgcrypto extension
- Market ID can always be set to 1
- GraphQL endpoint: `/api/graphql` (on Rails API server)
- Rails API server: Runs on port 3001 for development (to avoid conflict with Next.js on port 3000)
- Frontend (Next.js): Runs on port 3000 for development
- CORS origins: `http://localhost:3000` for development (frontend origin), production domain for production
- JWT validation: Disabled until login page is implemented (all requests allowed for now)
- S3 bucket: One bucket per environment (dev, staging, production) - needs to be created with user-chosen region and name, CORS policy configured
- File uploads: Frontend base64-encodes files and sends via GraphQL mutation, backend uploads to S3
- File size limit: Maximum 10MB before base64 encoding (enforced on both frontend and backend)
- Base64 size calculation: Use formula `(base64_length * 3) / 4 - padding` to calculate original file size
- S3 object key naming: `{userId}/{kind}/{uuid}.{ext}` (e.g., "user-123/1/abc-def-ghi.jpeg")
- Document kind values: Use defaults (1 = front of insurance card, 2 = back of insurance card)
- Signed URLs: Generate and store signed URLs in documents table for file access (1 hour expiration)
- Insurance verification: Route only - no verification logic (verification handled separately)
- Insurance coverage creation: Called after verification completes (not during upload)
- **Parent Data Entry**: New screen (Step 1) collects parent/guardian information before onboarding flow
- **PatientAndGuardian creation**: Created at start of onboarding (Step 1) via ParentDataEntry component
- **Auto-save strategy**: Use localStorage for all form data during onboarding, sync to database on step completion or final submission
- **Data transformation**: Transform frontend data formats to match database JSONB structures:
  - Survey answers: `{q1: 'value'}` → `{question_1_answer: 'value'}`
  - Address: Form fields → JSONB object `{city, state, zip_code, street_address_1, street_address_2}`
  - Availability: UI selection → JSONB array `[{day: "Monday", time_blocks: [...]}]`
- Questionnaire creation: Called when user clicks "Begin Survey" button (not when survey starts automatically)
- Questionnaire: respondentId must equal subjectId (backend validation), type always set to `3` (standard) - matching database enum
- Insurance coverage: kind set to `2` (insurance), eligibility set to `2` (submitted) initially, then `4` (eligible) or `6` (expired) after verification
- Insurance card storage: Store insurance card images in `documents` table with signed URLs, set `front_card_url` and `back_card_url` in `insurance_coverages` table from documents signed URLs
- Insurance card extraction: Leave extracted insurance card fields empty for now (member_id, group_id, plan_holder_*, etc.) - no OCR/extraction implemented
- Insurance company name: Leave `insurance_company_name` empty for now
- Child record creation: Frontend extracts child information from questionnaire data and provides in input, backend creates child record in `patients_and_guardians` table
- Kinships: Create `kinships` record linking parent to child - `kind` always set to `1` (relationship type)
- Referrals: Created at end of onboarding (Step 6) when user completes onboarding process - links parent, child, questionnaire, and insurance coverage
- Service kind: Always set to `2` (family) for referrals - matching database enum values
- Referrals concerns: Frontend populates `referrals.concerns` from survey answers (mapping handled by frontend)
- Referrals data: Accept any JSON structure (default to empty object `{}` if not provided)
- Organization/Contract lookup: Contract handling not implemented - frontend provides `organizationId` and `contractId` in input (no backend lookup)
- Transaction handling: `completeOnboarding` mutation executes `createKinship` and `createReferral` in database transaction - rollback on failure and return error to user
- Market ID: Always set to integer `1` (not UUID) in backend
- ReferralMember: Not created during onboarding - handled separately
- Scheduling: Skip scheduling/availability feature - not implemented at this time
- Preferred language: Default to "eng" if not provided
- Address fields: All address fields are optional
- Error handling: Show error message and allow user to retry (no automatic retry for user-initiated actions)
- Retry logic: Automatic retry with 3 attempts and exponential backoff (1s, 2s, 4s intervals) for network errors and S3 upload failures
- Form validation: Client-side validation for immediate feedback, server-side validation for data integrity
- Last saved indicator: Display relative time format (e.g., "Saved 5 minutes ago") for last successful database sync
- Auto-save debounce: Debounce localStorage saves to 500ms after user stops typing
- Loading states: Per-mutation granularity (only during database sync operations)
- Default values: Applied in backend (preferred_language: "eng", role: 1, type: 3, serviceKind: 2, kind: 2, eligibility: 2, marketId: 1)
- Unique email: Enforced at both database level (unique index) and application level (model validation)
- Soft deletes: Automatically filter out records where `_fivetran_deleted = true` in all queries
- PII encryption: Encrypt email, phone, and address fields using pgcrypto at model level
- DateTime format: ISO 8601 (e.g., "2024-01-15T14:34:00Z")
- JSON fields: Return as parsed JSON objects (GraphQL JSON scalar type)
- RespondentUnion: Union type `PatientAndGuardian | Clinician` for Questionnaire.respondent
- Partial completion: Keep partial data in localStorage if user abandons onboarding mid-flow (do not delete)
- Data relationships: A parent can have multiple questionnaires for the same child and multiple insurance coverages. Only one email address per user (enforce unique email constraint)
- Authentication: Basic login/logout mutations included, but full login page implementation will be done later
- Database credentials: Already configured, no setup needed
- Ruby/Rails: Use latest stable versions
- Environment variables: Use `.env` file for environment variable management
- Environment variables needed: JWT_SECRET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME (different per environment)
- API endpoint URLs: Configure dev and production URLs in frontend environment variables
- Error logging: Console logs only (no external monitoring service)
- Consider implementing rate limiting for API
- Consider implementing GraphQL subscriptions for real-time updates (future enhancement)

