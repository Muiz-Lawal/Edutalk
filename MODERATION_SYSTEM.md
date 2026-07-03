# AI Content Moderation System Documentation

## Overview
The EduTalk platform includes an advanced AI-powered content moderation system that automatically flags and reviews user-generated content for policy violations. The system uses OpenAI's moderation API with a fallback to keyword-based moderation when the API key is not configured.

## Features

### 1. Automatic Content Moderation
- **Real-time scanning** of reviews and chat messages
- **Multiple categories** including hate speech, violence, harassment, spam, and inappropriate content
- **Confidence scoring** to distinguish clear violations from borderline cases
- **Graceful fallback** to keyword-based moderation when OpenAI API is unavailable

### 2. Admin Moderation Queue
Hosts and administrators can:
- **Review flagged content** in a centralized queue
- **Filter by content type** (reviews, chat messages, profile content)
- **Approve or reject** individual items with custom reasons
- **Bulk process** multiple items with a single decision
- **View moderation history** with timestamps and decision details

### 3. Moderation Analytics
- **Real-time statistics** on moderation performance
- **Multiple time periods** (24 hours, 7 days, 30 days)
- **Visual breakdowns** of actions taken:
  - Auto Approved: Content passed moderation automatically
  - Auto Blocked: Content flagged automatically
  - Human Approved: Content reviewed and approved by admin
  - Human Rejected: Content reviewed and rejected by admin
  - Pending Review: Content awaiting human review
- **Key performance indicators**:
  - Flagged rate: Percentage of content flagged
  - Human review rate: Percentage of content reviewed by humans
  - Auto-moderation success rate

## System Architecture

### Backend Components

#### 1. AI Moderation Service (`aiModerationService.js`)
The core moderation engine that handles content analysis.

**Key Methods:**
- `moderateContent(content, options)` - Main moderation function
- `moderateReview(reviewData)` - Specific review moderation
- `moderateChatMessage(messageData)` - Chat message moderation
- `bulkModerateContent(contentArray, options)` - Batch processing

**Features:**
- OpenAI API integration with graceful degradation
- Custom moderation checks (spam detection, excessive caps, etc.)
- Moderation queueing system for asynchronous processing
- Context-aware decision making

#### 2. Moderation Model (`ModerationLog.js`)
MongoDB schema for storing moderation logs and audit trail.

**Fields:**
- `userId` - User who created the content
- `contentType` - Type of content (review, chat, profile)
- `content` - The actual content being moderated
- `flagged` - Boolean indicating if content was flagged
- `categories` - Specific violation categories detected
- `confidence` - Confidence score (0-1)
- `status` - Current status (pending_review, auto_approved, auto_blocked, reviewed_approved, reviewed_rejected)
- `moderationMethod` - How content was moderated (openai, keyword, custom)
- `reviewedBy` - Admin who reviewed the decision
- `reviewedAt` - When the decision was made
- `reviewNotes` - Reason for the decision

#### 3. Moderation Controller (`moderationController.js`)
Express controllers for admin endpoints.

**Endpoints:**
- `GET /api/moderation/queue` - Get pending items
- `GET /api/moderation/stats` - Get statistics
- `POST /api/moderation/:id/decide` - Process decision
- `POST /api/moderation/bulk-decide` - Bulk process
- `GET /api/moderation/user/:userId/history` - User history
- `POST /api/moderation/:id/re-moderate` - Re-evaluate content

### Frontend Components

#### 1. ModerationQueue.jsx
Interactive component for reviewing flagged content.

**Features:**
- Table view of pending items
- Checkbox selection for bulk operations
- Quick approve/reject buttons
- Confidence score visualization
- Content type badges
- User information display
- Category tags
- Pagination

#### 2. ModerationStats.jsx
Dashboard showing moderation metrics and trends.

**Displays:**
- Total content reviewed count
- Flagged content count and rate
- Human reviewed count and rate
- Pending review count
- Visual breakdown charts
- Key performance insights

#### 3. ModerationAdmin.jsx
Main page with tabbed interface combining queue and statistics.

## Integration Points

### Review Creation
When a user submits a review:
1. Content is sent to moderation service
2. Moderation result is stored with the review
3. If flagged, review is hidden until approved
4. Admin can review and approve/reject

### Chat Messages
When a user sends a chat message:
1. Message is moderated before broadcast
2. If flagged, sender receives rejection notice
3. Message is logged for admin review
4. Chat flow continues with approved messages

### Content Actions
When admin decides on flagged content:
1. Review is approved/rejected and unhidden/removed
2. Log entry is updated with decision
3. Status changes to `reviewed_approved` or `reviewed_rejected`
4. Decision is recorded for audit trail

## Configuration

### Environment Variables
```
# OpenAI API key for moderation
OPENAI_API_KEY=sk-your_openai_api_key

# Optional: Configure moderation strictness
MODERATION_STRICTNESS=medium  # low, medium, high
```

### Moderation Strictness Levels
- **Low**: Only block severe violations (hate speech, extreme violence)
- **Medium** (default): Block moderate to severe violations
- **High**: Block even borderline cases

## API Reference

### Get Moderation Queue
```
GET /api/moderation/queue?page=1&limit=10&contentType=review
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `contentType` - Filter by type: 'review', 'chat_message', 'profile' (optional)

**Response:**
```json
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get Statistics
```
GET /api/moderation/stats?period=7d
```

**Query Parameters:**
- `period` - Time period: '1d', '7d', '30d' (default: '7d')

**Response:**
```json
{
  "period": "7d",
  "totalContent": 1000,
  "flaggedContent": 45,
  "flaggedRate": "4.5%",
  "humanReviewRate": "2.1%",
  "breakdown": {
    "autoApproved": 850,
    "autoBlocked": 105,
    "reviewedApproved": 32,
    "reviewedRejected": 13,
    "pendingReview": 0
  }
}
```

### Process Decision
```
POST /api/moderation/:id/decide
```

**Body:**
```json
{
  "decision": "approved", // or "rejected", "escalated"
  "reason": "Content is appropriate"
}
```

### Bulk Process
```
POST /api/moderation/bulk-decide
```

**Body:**
```json
{
  "decisions": [
    {"id": "logId1", "decision": "approved", "reason": "OK"},
    {"id": "logId2", "decision": "rejected", "reason": "Inappropriate"}
  ]
}
```

## Best Practices

### For Hosts/Admins
1. **Regular Review**: Check the moderation queue daily for pending items
2. **Consistent Decisions**: Use similar criteria when approving/rejecting
3. **Detailed Reasons**: Always provide reasons for rejections to help system learn
4. **Monitor Stats**: Review statistics to identify moderation trends
5. **Escalate**: Use escalate decision for borderline cases that need higher review

### For Content Creators
1. **Follow Guidelines**: Understand platform community standards
2. **Respectful Tone**: Keep communications professional and respectful
3. **Original Content**: Share authentic experiences and reviews
4. **No Spam**: Avoid repetitive or promotional content

### For Developers
1. **Error Handling**: Gracefully handle API failures with fallback moderation
2. **Logging**: Log all moderation decisions for audit trail
3. **Performance**: Cache moderation results to reduce API calls
4. **Security**: Ensure only authorized users can access moderation endpoints
5. **Testing**: Test with various content types and violations

## Troubleshooting

### OpenAI API Not Configured
**Symptom:** "OpenAI API key not configured. Using fallback moderation only."
**Solution:** Set OPENAI_API_KEY environment variable with valid key

### Content Not Being Moderated
**Symptom:** All content is approved without review
**Check:**
- Verify moderation is integrated in review/chat controllers
- Check if moderateContent returns expected results
- Review moderation logs

### Admin Panel Not Loading
**Symptom:** Moderation page shows 404 or error
**Check:**
- Ensure user is logged in as host
- Verify `/api/moderation/queue` endpoint is accessible
- Check browser console for errors

### Bulk Process Fails
**Symptom:** Bulk decision processing returns error
**Solution:**
- Verify all selected items exist
- Ensure items haven't been processed already
- Check for network connectivity

## Future Enhancements

1. **Machine Learning**: Train custom models on platform-specific content patterns
2. **User Appeals**: Allow users to appeal moderation decisions
3. **Automated Responses**: Send templated emails for rejections
4. **Severity Levels**: Distinguish between warnings and removals
5. **Moderation Reports**: Generate detailed reports for compliance
6. **User Reputation**: Track user violation history
7. **Community Flags**: Allow users to flag content for admin review

## Security & Privacy

- All moderation decisions are logged for audit trail
- Content is processed securely with encryption in transit
- Only authorized admins can view moderation data
- Sensitive user information is protected
- OpenAI API calls use secure HTTPS connections
- No moderation content is stored with OpenAI

## Support

For issues or questions about the moderation system:
1. Check this documentation
2. Review backend logs for errors
3. Verify configuration settings
4. Contact platform administrators

---

**Last Updated:** May 2024
**Version:** 1.0
**Status:** Production Ready