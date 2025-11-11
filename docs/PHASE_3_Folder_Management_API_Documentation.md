# Phase 3 - Folder Management System API Documentation

**Base URL**: `https://api.complifi.ai/api/v1`
**Authentication**: Bearer Token (JWT)

---

## Overview

The Folder Management System enables companies to:

- Create **GENERAL folders** for manual organization and archiving
- Auto-create **RECONCILIATION folders** when bank/card statements are uploaded
- Organize folders with statuses, priorities, and assignments
- Track reconciliation progress with compliance scoring
- View folders in Kanban-style Job Board
- Archive reconciliation folders into general folders (parent-child relationship)
- Filter folders by type, status, priority, assignee, and statement type

---

## Folder System Architecture

### Folder Types

1. **GENERAL Folder**
   - Created manually by SUPER_ADMIN or EDITOR
   - Used for organization and archiving
   - Can contain child folders (copied reconciliation folders)
   - No statement file, no transactions
   - Can have files uploaded directly (GeneralFolderFiles)

2. **RECONCILIATION Folder**
   - Auto-created when bank/card statement is uploaded
   - Contains transactions extracted from statement
   - Has statementType: BANK or CARD
   - BANK → Requires invoice uploads for matching
   - CARD → Requires receipt uploads for matching
   - Can be copied into GENERAL folders for archiving
   - Tracks compliance score (matched vs total transactions)

---

## Folder Lifecycle

### RECONCILIATION Folder Flow

```
1. User uploads BANK/CARD statement
   ↓
2. System creates RECONCILIATION folder automatically
   ↓
3. OCR extracts transactions from statement
   ↓
4. Folder status: TO_DO (ready for document uploads)
   ↓
5. User uploads receipts (CARD) or invoices (BANK)
   ↓
6. System runs fuzzy matching algorithm
   ↓
7. Compliance score calculated automatically
   ↓
8. User reviews matches, updates status to IN_REVIEW
   ↓
9. After approval, status set to CLOSED
   ↓
10. (Optional) Copy folder to GENERAL folder for archiving
```

### GENERAL Folder Flow

```
1. SUPER_ADMIN or EDITOR creates GENERAL folder
   ↓
2. Upload files directly to general folder
   ↓
3. Copy RECONCILIATION folders into GENERAL folder (parent-child)
   ↓
4. Organize archived reconciliation work
```

---

## Folder Statuses

| Status | Description | Usage |
|--------|-------------|-------|
| `TO_DO` | Folder created, awaiting work | Default status for new folders |
| `IN_PROGRESS` | Work in progress | Receipts/invoices being uploaded and matched |
| `IN_REVIEW` | Ready for review | All matching complete, awaiting approval |
| `CLOSED` | Completed and finalized | Reconciliation approved and closed |

**Note**: Only RECONCILIATION folders actively use status workflow. GENERAL folders default to TO_DO.

---

## Folder Priorities

| Priority | Description |
|----------|-------------|
| `LOW` | Low priority |
| `MEDIUM` | Medium priority |
| `HIGH` | High priority |
| `null` | No priority set |

---

## Statement Types

| Type | Description | Document Type Required |
|------|-------------|------------------------|
| `BANK` | Bank account statement | Invoices |
| `CARD` | Credit/debit card statement | Receipts |

**IMPORTANT**: statementType only applies to RECONCILIATION folders, not GENERAL folders.

---

## Detailed Permissions Matrix

| Action | SUPER_ADMIN | EDITOR | VIEWER |
|--------|-------------|--------|--------|
| **Folder Management** |
| Create GENERAL folder | ✅ | ✅ | ❌ |
| Create RECONCILIATION folder | ✅ (internal) | ✅ (internal) | ❌ |
| View folders | ✅ | ✅ | ✅ |
| Update folder | ✅ | ✅ | ❌ |
| Delete GENERAL folder (creator or owner) | ✅ | ✅ (if creator) | ❌ |
| Delete RECONCILIATION folder | ✅ | ❌ | ❌ |
| **Folder Operations** |
| Assign folder to user | ✅ | ✅ | ❌ |
| Update folder status | ✅ | ✅ | ❌ |
| Update folder priority | ✅ | ✅ | ❌ |
| Copy folder to general | ✅ | ✅ | ✅ |
| View child folders | ✅ | ✅ | ✅ |
| View Job Board | ✅ | ✅ | ✅ |

**Note**:
- RECONCILIATION folders can ONLY be assigned to EDITOR or workspace members (not VIEWER)
- Only SUPER_ADMIN can delete RECONCILIATION folders
- Folder creator or SUPER_ADMIN can delete GENERAL folders

---

## API Endpoints

### 1. Create General Folder

**Purpose**: Creates an empty folder for organization/archiving purposes

**Endpoint**: `POST /folders/general`

**Authentication**: Required
**Authorization**: SUPER_ADMIN or EDITOR

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "2024 Tax Documents Archive",
  "workspaceId": 1,
  "statementType": "BANK"  // Required: 'BANK' or 'CARD'
}
```

**Validation Rules**:
- `name`: Required, string, 2-200 characters
- `workspaceId`: Required, integer

**Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "General folder created successfully",
  "data": {
    "id": 15,
    "name": "2024 Tax Documents Archive",
    "workspaceId": 1,
    "type": "GENERAL",
    "status": "TO_DO",
    "priority": null,
    "assignedToId": null,
    "complianceScore": 0,
    "statementType": 'BANK',
    "statementFileUrl": null,
    "parentFolderId": null,
    "createdBy": 1,
    "closingDate": null,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z",
    "workspace": {
      "id": 1,
      "name": "Q1 2025 Client Audit",
      "companyId": 1
    },
    "creator": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Important Notes**:
- Only SUPER_ADMIN or EDITOR can create general folders
- User must be a member of the workspace
- Type is automatically set to GENERAL
- No statement file or statementType for general folders

**Error Responses**:

**403 Forbidden** - Not authorized
```json
{
  "success": false,
  "message": "Only company owner or editor can create folders"
}
```

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Folder name is required"]
}
```

---

### 2. Get Folders by Workspace

**Purpose**: Retrieves all folders in a workspace with filtering, sorting, and pagination

**Endpoint**: `GET /workspaces/:workspaceId/folders`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `workspaceId` (integer): Workspace ID

**Query Parameters**:
```
?status=IN_PROGRESS              // Filter by status
&priority=HIGH                   // Filter by priority
&assignedToId=3                  // Filter by assigned user
&type=RECONCILIATION             // Filter by folder type(GENERAL/RECONCILIATION)
&statementType=CARD              // Filter by statement type (BANK/CARD)
&search=january                  // Search in folder names
&page=1                          // Page number (default: 1)
&limit=10                        // Items per page (default: 10)
&sortBy=createdAt               // Sort field (default: createdAt)
&sortOrder=DESC                  // Sort direction (default: DESC)
```

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Folders fetched successfully",
  "data": [
    {
      "id": 12,
      "name": "January 2024 - Bank Statement",
      "workspaceId": 1,
      "type": "RECONCILIATION",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "assignedToId": 3,
      "complianceScore": 75.5,
      "statementType": "BANK",
      "statementFileUrl": "https://storage.complifi.tech/statements/abc123.pdf",
      "parentFolderId": null,
      "createdBy": 1,
      "closingDate": null,
      "createdAt": "2024-01-20T10:30:00.000Z",
      "updatedAt": "2024-01-20T15:45:00.000Z",
      "assignedTo": {
        "id": 3,
        "name": "Sarah Wilson",
        "email": "sarah@example.com"
      }
    }
  ],
  "pagination": {
    "totalItems": 45,
    "totalPages": 5,
    "currentPage": 1,
    "itemsPerPage": 10
  }
}
```

**Use Cases**:
- Display all folders in workspace
- Filter BANK statement folders only: `?type=RECONCILIATION&statementType=BANK`
- Filter CARD statement folders only: `?type=RECONCILIATION&statementType=CARD`
- View high priority folders: `?priority=HIGH`
- See folders assigned to specific user: `?assignedToId=3`
- Search folders by name: `?search=january`

**Error Responses**:

**403 Forbidden** - Not a workspace member
```json
{
  "success": false,
  "message": "Access denied to this workspace"
}
```

---

### 3. Get Folder by ID

**Purpose**: Retrieves detailed information about a specific folder

**Endpoint**: `GET /folders/:id`

**Authentication**: Required
**Authorization**: User must have access to folder's workspace

**Path Parameters**:
- `id` (integer): Folder ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Folder fetched successfully",
  "data": {
    "id": 12,
    "name": "January 2024 - Bank Statement",
    "workspaceId": 1,
    "type": "RECONCILIATION",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "assignedToId": 3,
    "complianceScore": 75.5,
    "statementType": "BANK",
    "statementFileUrl": "https://storage.complifi.tech/statements/abc123.pdf",
    "parentFolderId": null,
    "createdBy": 1,
    "closingDate": null,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z",
    "workspace": {
      "id": 1,
      "name": "Q1 2025 Client Audit",
      "companyId": 1
    },
    "assignedTo": {
      "id": 3,
      "name": "Sarah Wilson",
      "email": "sarah@example.com"
    },
    "creator": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "parentFolder": null
  }
}
```

**Error Responses**:

**404 Not Found** - Folder doesn't exist
```json
{
  "success": false,
  "message": "Folder not found"
}
```

**403 Forbidden** - No access to folder
```json
{
  "success": false,
  "message": "Access denied to this folder"
}
```

---

### 4. Update Folder

**Purpose**: Updates folder details (name, priority, assignee, closing date)

**Endpoint**: `PUT /folders/:id`

**Authentication**: Required
**Authorization**: SUPER_ADMIN or EDITOR

**Path Parameters**:
- `id` (integer): Folder ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "January 2024 - Bank Statement (Updated)",
  "priority": "MEDIUM",
  "assignedToId": 5,
  "closingDate": "2024-01-31T23:59:59.000Z"
}
```

**Validation Rules**:
- `name`: Optional, string, 2-200 characters
- `priority`: Optional, enum: LOW, MEDIUM, HIGH
- `assignedToId`: Optional, integer (must be workspace member)
- `closingDate`: Optional, ISO 8601 date string

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Folder updated successfully",
  "data": {
    "id": 12,
    "name": "January 2024 - Bank Statement (Updated)",
    "priority": "MEDIUM",
    "assignedToId": 5,
    "closingDate": "2024-01-31T23:59:59.000Z",
    "updatedAt": "2024-01-22T09:15:00.000Z"
  }
}
```

**Important Notes**:
- Cannot change folder `type` after creation
- Only SUPER_ADMIN or EDITOR can update folders
- Folder name, priority, assignee, and closing date can be updated

**Error Responses**:

**403 Forbidden** - Not authorized
```json
{
  "success": false,
  "message": "Only company owner or editor can update folders"
}
```

**400 Bad Request** - Cannot change type
```json
{
  "success": false,
  "message": "Cannot change folder type after creation"
}
```

---

### 5. Delete Folder

**Purpose**: Deletes a folder (with different rules for GENERAL vs RECONCILIATION)

**Endpoint**: `DELETE /folders/:id`

**Authentication**: Required
**Authorization**:
- RECONCILIATION folders: Only SUPER_ADMIN
- GENERAL folders: Creator or SUPER_ADMIN

**Path Parameters**:
- `id` (integer): Folder ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Folder deleted successfully",
  "data": null
}
```

**Important Notes**:
- **RECONCILIATION folders**: Only SUPER_ADMIN can delete
- **GENERAL folders**: Folder creator or SUPER_ADMIN can delete
- Deleting a folder will cascade delete all associated data (transactions, receipts, invoices, files)

**Error Responses**:

**403 Forbidden** - Not authorized (RECONCILIATION)
```json
{
  "success": false,
  "message": "Only company owner can delete reconciliation folders"
}
```

**403 Forbidden** - Not authorized (GENERAL)
```json
{
  "success": false,
  "message": "Only the folder creator or company owner can delete general folders"
}
```

---

### 6. Assign Folder to User

**Purpose**: Assigns a reconciliation folder to a workspace member

**Endpoint**: `PATCH /folders/:id/assign`

**Authentication**: Required
**Authorization**: SUPER_ADMIN or EDITOR

**Path Parameters**:
- `id` (integer): Folder ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "assignedToId": 3
}
```

**Validation Rules**:
- `assignedToId`: Required, integer
- Assignee must be workspace member
- Assignee cannot be a VIEWER (must be EDITOR or above)
- Only RECONCILIATION folders can be assigned

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Folder assigned successfully",
  "data": {
    "id": 12,
    "name": "January 2024 - Bank Statement",
    "assignedToId": 3,
    "assignedTo": {
      "id": 3,
      "name": "Sarah Wilson",
      "email": "sarah@example.com"
    }
  }
}
```

**Important Notes**:
- Only RECONCILIATION folders can be assigned
- Assignee must be workspace member with EDITOR role or above
- Cannot assign to VIEWER users

**Error Responses**:

**400 Bad Request** - Not a reconciliation folder
```json
{
  "success": false,
  "message": "Only reconciliation folders can be assigned"
}
```

**400 Bad Request** - Assignee is a viewer
```json
{
  "success": false,
  "message": "Cannot assign folders to viewers"
}
```

**400 Bad Request** - Not a workspace member
```json
{
  "success": false,
  "message": "Assignee must be a member of the workspace"
}
```

---

### 7. Update Folder Status

**Purpose**: Updates the status of a reconciliation folder

**Endpoint**: `PATCH /folders/:id/status`

**Authentication**: Required
**Authorization**: SUPER_ADMIN or EDITOR

**Path Parameters**:
- `id` (integer): Folder ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "status": "IN_REVIEW"
}
```

**Validation Rules**:
- `status`: Required, enum: TO_DO, IN_PROGRESS, IN_REVIEW, CLOSED
- Only RECONCILIATION folders can have status updates

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Folder status updated successfully",
  "data": {
    "id": 12,
    "name": "January 2024 - Bank Statement",
    "status": "IN_REVIEW",
    "updatedAt": "2024-01-22T11:30:00.000Z"
  }
}
```

**Important Notes**:
- Only RECONCILIATION folders have status workflow
- Only SUPER_ADMIN or EDITOR can update status
- Status flow: TO_DO → IN_PROGRESS → IN_REVIEW → CLOSED (not enforced, can skip)

**Error Responses**:

**403 Forbidden** - Not authorized
```json
{
  "success": false,
  "message": "Only company owner or editor can update folder status"
}
```

**400 Bad Request** - Not a reconciliation folder
```json
{
  "success": false,
  "message": "Only reconciliation folders can have status changes"
}
```

---

### 8. Update Folder Priority

**Purpose**: Updates the priority of a folder

**Endpoint**: `PATCH /folders/:id/priority`

**Authentication**: Required
**Authorization**: SUPER_ADMIN or EDITOR

**Path Parameters**:
- `id` (integer): Folder ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "priority": "HIGH"
}
```

**Validation Rules**:
- `priority`: Required, enum: LOW, MEDIUM, HIGH

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Folder priority updated successfully",
  "data": {
    "id": 12,
    "name": "January 2024 - Bank Statement",
    "priority": "HIGH",
    "updatedAt": "2024-01-22T12:00:00.000Z"
  }
}
```

**Important Notes**:
- Only SUPER_ADMIN or EDITOR can update priority
- Priority can be set on both GENERAL and RECONCILIATION folders

**Error Responses**:

**403 Forbidden** - Not authorized
```json
{
  "success": false,
  "message": "Only company owner or editor can update folder priority"
}
```

---

### 9. Get Job Board (Kanban View)

**Purpose**: Retrieves reconciliation folders grouped by status for Kanban visualization

**Endpoint**: `GET /workspaces/:workspaceId/job-board`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `workspaceId` (integer): Workspace ID

**Query Parameters**:
```
?priority=HIGH              // Filter by priority
&assignedToId=3            // Filter by assigned user
&type=RECONCILIATION       // Filter by folder type
&statementType=BANK        // Filter by statement type
```

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Job board fetched successfully",
  "data": {
    "TO_DO": {
      "count": 5,
      "folders": [
        {
          "id": 10,
          "name": "February 2024 - Card Statement",
          "type": "RECONCILIATION",
          "status": "TO_DO",
          "priority": "MEDIUM",
          "statementType": "CARD",
          "complianceScore": 0,
          "assignedToId": null,
          "createdAt": "2024-01-25T08:00:00.000Z"
        }
      ]
    },
    "IN_PROGRESS": {
      "count": 8,
      "folders": [
        {
          "id": 12,
          "name": "January 2024 - Bank Statement",
          "type": "RECONCILIATION",
          "status": "IN_PROGRESS",
          "priority": "HIGH",
          "statementType": "BANK",
          "complianceScore": 75.5,
          "assignedToId": 3,
          "assignedTo": {
            "id": 3,
            "name": "Sarah Wilson",
            "email": "sarah@example.com"
          },
          "createdAt": "2024-01-20T10:30:00.000Z"
        }
      ]
    },
    "IN_REVIEW": {
      "count": 3,
      "folders": []
    },
    "CLOSED": {
      "count": 12,
      "folders": []
    }
  }
}
```

**Use Cases**:
- Kanban board visualization
- Dashboard for reconciliation progress
- Filter by assignee to show user-specific board
- Filter by priority to show high-priority items
- Filter by statementType to separate BANK and CARD workflows

**Important Notes**:
- Only shows RECONCILIATION folders (not GENERAL folders)
- Groups folders by status columns
- Returns count for each status column
- Supports same filters as GET /folders endpoint

---

### 10. Copy Folder to General (Archive)

**Purpose**: Copies a reconciliation folder into a general folder (creates parent-child relationship)

**Endpoint**: `POST /folders/:id/copy`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Source reconciliation folder ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "targetGeneralFolderId": 15
}
```

**Validation Rules**:
- `targetGeneralFolderId`: Required, integer
- Source folder must be RECONCILIATION type
- Target folder must be GENERAL type
- Both folders must be in the same workspace

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Folder copied to general folder successfully",
  "data": {
    "id": 12,
    "name": "January 2024 - Bank Statement",
    "type": "RECONCILIATION",
    "parentFolderId": 15,
    "parentFolder": {
      "id": 15,
      "name": "2024 Tax Documents Archive",
      "type": "GENERAL"
    }
  }
}
```

**Important Notes**:
- This creates a parent-child relationship (not a copy/duplicate)
- The reconciliation folder now "belongs to" the general folder
- Useful for organizing completed reconciliation work
- Any workspace member can copy folders

**Error Responses**:

**400 Bad Request** - Source is not reconciliation
```json
{
  "success": false,
  "message": "Can only copy reconciliation folders"
}
```

**400 Bad Request** - Target is not general
```json
{
  "success": false,
  "message": "Target must be a general folder"
}
```

**400 Bad Request** - Different workspaces
```json
{
  "success": false,
  "message": "Folders must be in the same workspace"
}
```

---

### 11. Get Child Folders

**Purpose**: Retrieves all child folders of a general folder (reconciliation folders that were copied into it)

**Endpoint**: `GET /folders/:id/children`

**Authentication**: Required
**Authorization**: User must be workspace member

**Path Parameters**:
- `id` (integer): Parent general folder ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Child folders fetched successfully",
  "data": {
    "folders": [
      {
        "id": 12,
        "name": "January 2024 - Bank Statement",
        "type": "RECONCILIATION",
        "status": "CLOSED",
        "statementType": "BANK",
        "complianceScore": 95.5,
        "parentFolderId": 15,
        "createdAt": "2024-01-20T10:30:00.000Z"
      },
      {
        "id": 18,
        "name": "January 2024 - Card Statement",
        "type": "RECONCILIATION",
        "status": "CLOSED",
        "statementType": "CARD",
        "complianceScore": 88.2,
        "parentFolderId": 15,
        "createdAt": "2024-01-22T14:00:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 2,
      "totalPages": 1,
      "currentPage": 1,
      "itemsPerPage": 1000
    }
  }
}
```

**Use Cases**:
- Display archived reconciliation folders within a general folder
- Show organization structure
- List all reconciliation work for a specific period/category

---

## Error Handling

### Common Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 400 Bad Request | Invalid input, validation errors | Invalid folder type, missing required fields |
| 401 Unauthorized | Missing/invalid token | Not authenticated |
| 403 Forbidden | Insufficient permissions | Not SUPER_ADMIN/EDITOR, not workspace member |
| 404 Not Found | Resource doesn't exist | Folder not found |
| 500 Server Error | Internal server error | System error |

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Detailed error (development only)"
}
```

---

## Quick Reference

### Base URL
```
https://api.complifi.api/api/v1
```

### Authentication Header
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints Summary

| Method | Endpoint | Auth | Authorization | Description |
|--------|----------|------|---------------|-------------|
| POST | `/folders/general` | ✅ | SUPER_ADMIN/EDITOR | Create general folder |
| GET | `/workspaces/:id/folders` | ✅ | Member | Get folders with filters |
| GET | `/folders/:id` | ✅ | Member | Get folder details |
| PUT | `/folders/:id` | ✅ | SUPER_ADMIN/EDITOR | Update folder |
| DELETE | `/folders/:id` | ✅ | See notes* | Delete folder |
| PATCH | `/folders/:id/assign` | ✅ | SUPER_ADMIN/EDITOR | Assign folder |
| PATCH | `/folders/:id/status` | ✅ | SUPER_ADMIN/EDITOR | Update status |
| PATCH | `/folders/:id/priority` | ✅ | SUPER_ADMIN/EDITOR | Update priority |
| GET | `/workspaces/:id/job-board` | ✅ | Member | Get Kanban view |
| POST | `/folders/:id/copy` | ✅ | Member | Copy to general folder |
| GET | `/folders/:id/children` | ✅ | Member | Get child folders |

\* Delete authorization:
- RECONCILIATION folders: SUPER_ADMIN only
- GENERAL folders: Creator or SUPER_ADMIN

---

## Filter Combinations

### Common Filter Patterns

**Get all BANK reconciliation folders:**
```
GET /workspaces/1/folders?type=RECONCILIATION&statementType=BANK
```

**Get all CARD reconciliation folders:**
```
GET /workspaces/1/folders?type=RECONCILIATION&statementType=CARD
```

**Get high priority folders in progress:**
```
GET /workspaces/1/folders?priority=HIGH&status=IN_PROGRESS
```

**Get folders assigned to specific user:**
```
GET /workspaces/1/folders?assignedToId=3
```

**Get all general folders:**
```
GET /workspaces/1/folders?type=GENERAL
```

**Job board filtered by BANK statements:**
```
GET /workspaces/1/job-board?statementType=BANK
```

---

## Folder Data Model

```json
{
  "id": 12,
  "name": "Folder Name",
  "workspaceId": 1,
  "type": "RECONCILIATION|GENERAL",
  "status": "TO_DO|IN_PROGRESS|IN_REVIEW|CLOSED",
  "priority": "LOW|MEDIUM|HIGH|null",
  "assignedToId": 3,
  "complianceScore": 75.5,
  "statementType": "BANK|CARD|null",
  "statementFileUrl": "https://...|null",
  "parentFolderId": 15,
  "createdBy": 1,
  "closingDate": "2024-01-31T23:59:59.000Z|null",
  "createdAt": "2024-01-20T10:30:00.000Z",
  "updatedAt": "2024-01-20T15:45:00.000Z"
}
```

---
