# Postboxen API Documentation

## Overview

Postboxen provides a comprehensive REST API for managing AI-powered meeting agents, decision tracking, and compliance features. All endpoints require authentication unless otherwise specified.

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@postboxen.se",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Inloggning lyckades",
  "user": {
    "id": "admin-user-123",
    "email": "admin@postboxen.se",
    "name": "Admin User",
    "scopes": ["agent:read", "agent:write", "admin"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Refresh Token
```http
POST /api/auth/refresh
Cookie: refresh-token=your-refresh-token
```

### Logout
```http
POST /api/auth/logout
Cookie: auth-token=your-auth-token
```

## Agent Management

### Schedule Meeting Agent
```http
POST /api/agents/schedule
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "meetingId": "meeting-123",
  "title": "Q3 Strategy Meeting",
  "startTime": "2025-09-22T09:00:00Z",
  "endTime": "2025-09-22T10:00:00Z",
  "organizerEmail": "manager@company.com",
  "platform": "teams",
  "meetingUrl": "https://teams.microsoft.com/l/meetup-join/...",
  "participants": [
    {
      "email": "participant1@company.com",
      "name": "John Doe",
      "role": "attendee"
    }
  ]
}
```

### Summarize Meeting
```http
POST /api/agents/summarize
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "meetingId": "meeting-123",
  "transcript": "Meeting transcript text...",
  "participants": ["participant1@company.com"],
  "duration": 3600
}
```

### Cancel Meeting
```http
POST /api/agents/cancel
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "meetingId": "meeting-123",
  "reason": "Meeting cancelled by organizer"
}
```

## Meeting Management

### List Meetings
```http
GET /api/agents/meetings?page=1&limit=20&organizerEmail=manager@company.com
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "meetings": [
    {
      "id": "meeting-123",
      "title": "Q3 Strategy Meeting",
      "organizerEmail": "manager@company.com",
      "startTime": "2025-09-22T09:00:00Z",
      "endTime": "2025-09-22T10:00:00Z",
      "status": "completed",
      "platform": "teams",
      "decisionCount": 3,
      "actionItemCount": 5,
      "transcriptSegmentCount": 45
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Meeting Details
```http
GET /api/agents/meetings/meeting-123
Authorization: Bearer your-jwt-token
```

### Create Meeting
```http
POST /api/agents/meetings
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "title": "New Meeting",
  "startTime": "2025-09-25T14:00:00Z",
  "endTime": "2025-09-25T15:00:00Z",
  "organizerEmail": "organizer@company.com",
  "platform": "zoom"
}
```

## Specialized Modules

### Procurement Simulator
```http
POST /api/agents/procurement/simulate
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "requirementA": "Original requirement text...",
  "requirementB": "Alternative requirement text...",
  "context": "Procurement context and constraints"
}
```

### Document Analysis
```http
POST /api/agents/documents/analyze
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "currentText": "Current document text...",
  "proposedText": "Proposed changes...",
  "documentType": "contract"
}
```

### Regulatory Watch
```http
GET /api/agents/regwatch?action=highlights&limit=5
Authorization: Bearer your-jwt-token
```

### Nudging
```http
POST /api/agents/nudging
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "meetingId": "meeting-123",
  "actionItems": ["action-1", "action-2"],
  "nudgeType": "follow-up",
  "scheduleFor": "2025-09-24T09:00:00Z"
}
```

## Compliance & Retention

### Consent Management
```http
POST /api/agents/consent
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "userEmail": "user@company.com",
  "profile": "juridik",
  "meetingId": "meeting-123"
}
```

### Data Retention
```http
POST /api/agents/retention
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "action": "delete_all",
  "userEmail": "user@company.com",
  "meetingId": "meeting-123"
}
```

## Queue Management

### Queue Statistics
```http
GET /api/agents/queues/stats
Authorization: Bearer your-jwt-token
```

### Queue Jobs
```http
GET /api/agents/queues/jobs
Authorization: Bearer your-jwt-token
```

### Dead Letter Queue
```http
GET /api/agents/queues/dead-letter
Authorization: Bearer your-jwt-token
```

### Retry Dead Letter Job
```http
POST /api/agents/queues/dead-letter
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "jobId": "dead-letter-job-123"
}
```

## System Health

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-20T18:30:00.000Z",
  "responseTime": "3ms",
  "version": "0.1.0",
  "environment": "development",
  "components": {
    "database": {
      "status": "healthy",
      "responseTime": 3,
      "timestamp": "2025-09-20T18:30:00.000Z"
    },
    "cache": {
      "status": "healthy",
      "info": {
        "memory": "# Memory\nused_memory:3463168...",
        "keyspace": "# Keyspace\ndb0:keys=227...",
        "timestamp": "2025-09-20T18:30:00.000Z"
      }
    },
    "redis": {
      "status": "healthy"
    }
  }
}
```

### Performance Metrics
```http
GET /api/performance/metrics
Authorization: Bearer your-jwt-token
```

**Response:** Prometheus-format metrics
```
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",endpoint="/api/agents/meetings",status="200"} 45

# HELP api_request_duration_seconds API request duration in seconds
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_bucket{method="GET",endpoint="/api/agents/meetings",le="0.1"} 12
api_request_duration_seconds_bucket{method="GET",endpoint="/api/agents/meetings",le="0.5"} 35
api_request_duration_seconds_bucket{method="GET",endpoint="/api/agents/meetings",le="1"} 45
```

## Error Handling

All API endpoints return structured error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE",
  "timestamp": "2025-09-20T18:30:00.000Z"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `413` - Payload Too Large
- `423` - Locked (Account locked)
- `429` - Too Many Requests (Rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

- **GET requests**: 100 requests per 15 minutes per IP
- **POST requests**: 10 requests per 15 minutes per IP
- **Authentication endpoints**: 5 login attempts per 15 minutes per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1632150000
```

## Webhooks

### Meeting Events
```http
POST /api/agents/webhooks/teams
Content-Type: application/json
X-Webhook-Signature: sha256=...

{
  "event": "meeting.started",
  "meetingId": "meeting-123",
  "timestamp": "2025-09-20T18:30:00.000Z",
  "data": {
    "participants": ["user1@company.com"],
    "platform": "teams"
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { PostboxenClient } from '@postboxen/sdk';

const client = new PostboxenClient({
  baseUrl: 'https://api.postboxen.com',
  apiKey: 'your-api-key'
});

// Schedule a meeting agent
const meeting = await client.agents.schedule({
  meetingId: 'meeting-123',
  title: 'Q3 Strategy Meeting',
  startTime: '2025-09-22T09:00:00Z',
  endTime: '2025-09-22T10:00:00Z',
  organizerEmail: 'manager@company.com',
  platform: 'teams'
});

// Get meeting summary
const summary = await client.meetings.summarize('meeting-123');
```

### Python
```python
from postboxen import PostboxenClient

client = PostboxenClient(
    base_url='https://api.postboxen.com',
    api_key='your-api-key'
)

# Schedule a meeting agent
meeting = client.agents.schedule(
    meeting_id='meeting-123',
    title='Q3 Strategy Meeting',
    start_time='2025-09-22T09:00:00Z',
    end_time='2025-09-22T10:00:00Z',
    organizer_email='manager@company.com',
    platform='teams'
)

# Get meeting summary
summary = client.meetings.summarize('meeting-123')
```

## Support

For API support and questions:
- **Documentation**: https://docs.postboxen.com
- **Support Email**: support@postboxen.com
- **GitHub Issues**: https://github.com/DanielWarg/Postboxen/issues
