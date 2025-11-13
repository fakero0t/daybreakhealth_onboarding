# Demographics API Documentation

## Overview

The Demographics API provides endpoints for managing patient demographic and background information collected during the onboarding process.

**Base URL:** `/api/demographics`

**Authentication:** All endpoints require authentication (to be implemented)

**Authorization:** Users can only access demographics for patients they are authorized to view

---

## Endpoints

### 1. Create Demographics

Create a new demographics record for a patient.

**Endpoint:** `POST /api/demographics`

**Request Body:**
```json
{
  "patientId": "uuid",
  "data": {
    "legal_name": "string (max 100 chars)",
    "preferred_name": "string (max 100 chars)",
    "gender_assigned_at_birth": "male|female|intersex|other|prefer_not_to_answer",
    "gender_other_text": "string (max 100 chars)",
    "pronouns": "she/hers|he/his|they/them|ze/zer|ask me|prefer_not_to_answer",
    "guardian_name": "string (max 100 chars)",
    "shared_parenting_agreement": "yes|no|prefer_not_to_answer",
    "shared_parenting_details": "string (max 500 chars)",
    "custody_concerns": "yes|no|prefer_not_to_answer",
    "custody_concerns_details": "string (max 500 chars)",
    "school_name": "string (max 200 chars)",
    "current_grade": "pre-k|kindergarten|1st|2nd|...|12th|college|not in school|other",
    "has_iep_504": "yes|no|prefer_not_to_answer",
    "iep_504_details": "string (max 500 chars)",
    "behavioral_academic_concerns": "yes|no|prefer_not_to_answer",
    "behavioral_academic_details": "string (max 500 chars)",
    "complications_prior_birth": "yes|no|prefer_not_to_answer",
    "complications_prior_details": "string (max 500 chars)",
    "complications_at_birth": "yes|no|prefer_not_to_answer",
    "complications_birth_details": "string (max 500 chars)",
    "milestones_met": "yes|no|prefer_not_to_answer",
    "milestones_details": "string (max 500 chars)",
    "life_changes": ["frequent_moves", "changes_in_caregivers", "..."],
    "life_changes_other_text": "string (max 500 chars)",
    "has_part_time_job": boolean,
    "has_extracurriculars": boolean,
    "extracurriculars_details": "string (max 500 chars)",
    "fun_activities": "string (max 500 chars)",
    "spirituality": "yes|no|complicated|prefer_not_to_answer",
    "completed": boolean,
    "sections_completed": ["basic_information", "guardian_information", "..."]
  }
}
```

**Note:** All fields in `data` are optional. You can provide partial data.

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "legal_name": "John Doe",
  "preferred_name": "Johnny",
  ...
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data or validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to access this patient
- `409 Conflict` - Demographics record already exists
- `500 Internal Server Error` - Server error

---

### 2. Get Demographics

Retrieve the demographics record for a patient.

**Endpoint:** `GET /api/demographics?patientId={uuid}`

**Query Parameters:**
- `patientId` (required): UUID of the patient

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "legal_name": "John Doe",
  "preferred_name": "Johnny",
  "gender_assigned_at_birth": "male",
  "pronouns": "he/his",
  ...
  "completed": false,
  "sections_completed": ["basic_information", "education"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing patientId parameter
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to access this patient
- `404 Not Found` - Demographics record not found
- `500 Internal Server Error` - Server error

---

### 3. Update Demographics (Full Update)

Perform a full update of a demographics record.

**Endpoint:** `PUT /api/demographics?patientId={uuid}`

**Query Parameters:**
- `patientId` (required): UUID of the patient

**Request Body:**
```json
{
  "data": {
    "legal_name": "John Doe",
    "preferred_name": "Johnny",
    ...
    "completed": true,
    "sections_completed": ["basic_information", "guardian_information", "education", "developmental_history", "life_changes", "activities"]
  }
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  ...
  "updated_at": "2024-01-15T10:40:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data or validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to access this patient
- `404 Not Found` - Demographics record not found
- `500 Internal Server Error` - Server error

---

### 4. Update Demographics (Partial Update / Auto-Save)

Perform a partial update of a demographics record. Used for auto-save functionality.

**Endpoint:** `PATCH /api/demographics?patientId={uuid}`

**Query Parameters:**
- `patientId` (required): UUID of the patient

**Request Body:**
```json
{
  "data": {
    "legal_name": "John Doe",
    "sections_completed": ["basic_information"]
  }
}
```

**Note:** Only the fields provided will be updated. All other fields remain unchanged.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  ...
  "updated_at": "2024-01-15T10:41:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data or validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to access this patient
- `404 Not Found` - Demographics record not found
- `500 Internal Server Error` - Server error

---

### 5. Get Completion State

Get the completion state of a patient's demographics form.

**Endpoint:** `GET /api/demographics/completion?patientId={uuid}`

**Query Parameters:**
- `patientId` (required): UUID of the patient

**Response:** `200 OK`
```json
{
  "exists": true,
  "completed": false,
  "sections_completed": ["basic_information", "education"],
  "completion_percentage": 33,
  "last_updated": "2024-01-15T10:35:00Z"
}
```

**Response Fields:**
- `exists`: Whether a demographics record exists for this patient
- `completed`: Whether the form is marked as complete
- `sections_completed`: Array of completed section names
- `completion_percentage`: Percentage of sections completed (0-100)
- `last_updated`: Timestamp of last update (null if no record exists)

**Error Responses:**
- `400 Bad Request` - Missing patientId parameter
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to access this patient
- `500 Internal Server Error` - Server error

---

## Data Models

### Demographics Object

| Field | Type | Max Length | Required | Description |
|-------|------|------------|----------|-------------|
| `id` | UUID | - | Auto-generated | Unique identifier |
| `patient_id` | UUID | - | Yes | Patient this record belongs to |
| `legal_name` | String | 100 | No | Patient's legal name |
| `preferred_name` | String | 100 | No | Patient's preferred name |
| `gender_assigned_at_birth` | String | 50 | No | Gender assigned at birth |
| `gender_other_text` | String | 100 | No | Other gender specification |
| `pronouns` | String | 50 | No | Preferred pronouns |
| `guardian_name` | String | 100 | No | Parent/guardian name |
| `shared_parenting_agreement` | String | 50 | No | Legal shared parenting status |
| `shared_parenting_details` | Text | 500 | No | Details about parenting agreement |
| `custody_concerns` | String | 50 | No | Whether there are custody concerns |
| `custody_concerns_details` | Text | 500 | No | Details about custody concerns |
| `school_name` | String | 200 | No | School or daycare name |
| `current_grade` | String | 50 | No | Current grade level |
| `has_iep_504` | String | 50 | No | Whether patient has IEP/504 plan |
| `iep_504_details` | Text | 500 | No | Details about IEP/504 plan |
| `behavioral_academic_concerns` | String | 50 | No | Whether there are concerns |
| `behavioral_academic_details` | Text | 500 | No | Details about concerns |
| `complications_prior_birth` | String | 50 | No | Complications before birth |
| `complications_prior_details` | Text | 500 | No | Details about complications |
| `complications_at_birth` | String | 50 | No | Complications at birth |
| `complications_birth_details` | Text | 500 | No | Details about complications |
| `milestones_met` | String | 50 | No | Whether milestones were met |
| `milestones_details` | Text | 500 | No | Details about milestones |
| `life_changes` | Array | - | No | Array of life change events |
| `life_changes_other_text` | Text | 500 | No | Other life changes description |
| `has_part_time_job` | Boolean | - | No | Whether patient has a job |
| `has_extracurriculars` | Boolean | - | No | Whether in extracurriculars |
| `extracurriculars_details` | Text | 500 | No | Details about activities |
| `fun_activities` | Text | 500 | No | What patient does for fun |
| `spirituality` | String | 50 | No | Role of spirituality in life |
| `completed` | Boolean | - | No | Whether form is complete |
| `sections_completed` | Array | - | No | Array of completed sections |
| `created_at` | Timestamp | - | Auto-generated | Creation timestamp |
| `updated_at` | Timestamp | - | Auto-updated | Last update timestamp |
| `created_by` | UUID | - | No | User who created record |
| `updated_by` | UUID | - | No | User who last updated record |

### Valid Values

**Gender Assigned at Birth:**
- `male`
- `female`
- `intersex`
- `prefer_not_to_answer`
- `other`

**Pronouns:**
- `she/hers`
- `he/his`
- `they/them`
- `ze/zer`
- `ask me`
- `prefer_not_to_answer`

**Current Grade:**
- `pre-k`
- `kindergarten`
- `1st` through `12th`
- `college`
- `not in school`
- `other`

**Yes/No/Prefer Not to Answer Fields:**
- `yes`
- `no`
- `prefer_not_to_answer`

**Spirituality:**
- `yes`
- `no`
- `complicated`
- `prefer_not_to_answer`

**Life Changes (array values):**
- `frequent_moves`
- `changes_in_caregivers`
- `death_of_friend_relative`
- `witness_to_violence`
- `history_of_abuse_neglect`
- `other`
- `prefer_not_to_answer`

**Section Names (array values):**
- `basic_information`
- `guardian_information`
- `education`
- `developmental_history`
- `life_changes`
- `activities`

---

## Examples

### Example 1: Create Basic Demographics

**Request:**
```bash
POST /api/demographics
Content-Type: application/json

{
  "patientId": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "legal_name": "Jane Smith",
    "preferred_name": "Jane",
    "gender_assigned_at_birth": "female",
    "pronouns": "she/hers",
    "sections_completed": ["basic_information"]
  }
}
```

**Response:**
```json
{
  "id": "987fcdeb-51a2-43f7-8901-ba678d901234",
  "patient_id": "123e4567-e89b-12d3-a456-426614174000",
  "legal_name": "Jane Smith",
  "preferred_name": "Jane",
  "gender_assigned_at_birth": "female",
  "pronouns": "she/hers",
  "completed": false,
  "sections_completed": ["basic_information"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Example 2: Auto-Save Progress

**Request:**
```bash
PATCH /api/demographics?patientId=123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "data": {
    "school_name": "Lincoln Elementary",
    "current_grade": "3rd",
    "sections_completed": ["basic_information", "education"]
  }
}
```

**Response:**
```json
{
  "id": "987fcdeb-51a2-43f7-8901-ba678d901234",
  "patient_id": "123e4567-e89b-12d3-a456-426614174000",
  "legal_name": "Jane Smith",
  "school_name": "Lincoln Elementary",
  "current_grade": "3rd",
  "sections_completed": ["basic_information", "education"],
  "updated_at": "2024-01-15T10:35:00Z"
}
```

### Example 3: Check Completion Status

**Request:**
```bash
GET /api/demographics/completion?patientId=123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "exists": true,
  "completed": false,
  "sections_completed": ["basic_information", "education"],
  "completion_percentage": 33,
  "last_updated": "2024-01-15T10:35:00Z"
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message description"
}
```

For validation errors:

```json
{
  "error": "Invalid demographics data",
  "errors": [
    {
      "field": "legal_name",
      "message": "Legal Name must not exceed 100 characters (current: 150)"
    },
    {
      "field": "pronouns",
      "message": "Pronouns must be one of: she/hers, he/his, they/them, ze/zer, ask me, prefer_not_to_answer"
    }
  ]
}
```

---

## Security & Compliance

### HIPAA Compliance

All demographics data is considered Protected Health Information (PHI) and must be handled in accordance with HIPAA regulations:

- All API requests must be transmitted over HTTPS/TLS
- Authentication is required for all endpoints
- Audit logging is performed for all data access and modifications
- Data is encrypted at rest in the database

### Authentication

TODO: Add authentication details when implemented

### Authorization

Users can only access demographics data for patients they are authorized to view. Authorization rules:
- Patients can access their own demographics
- Guardians can access their dependents' demographics
- Clinicians can access their assigned patients' demographics
- Administrators can access all demographics (with audit logging)

---

## Rate Limiting

TODO: Define rate limiting policy

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Create, read, update demographics
- Completion state tracking
- Auto-save support

