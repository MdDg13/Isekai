# Content Review & Correction System

## Overview

The content review system allows users to report errors and bad data in the reference library, with an admin interface to review and manage feedback.

## Features

### Public Features (All Users)
- **Report Error Page** (`/report-error`)
  - Accessible to all users (logged in or anonymous)
  - Form to report issues with reference data
  - Pre-filled from reference detail pages
  - Supports all reference types: spells, monsters, items, feats, classes, subclasses, races

### Admin Features
- **Admin Feedback Dashboard** (`/admin/qc-feedback`)
  - View all submitted feedback
  - Filter by status, item type, issue type
  - Update feedback status (pending, reviewed, fixed, rejected, duplicate)
  - Add review notes
  - Status summary dashboard

## Database Schema

See `docs/db/qc_feedback_schema.sql` for the complete schema.

Key tables:
- `qc_feedback` - Stores all feedback submissions
- `qc_feedback_summary` - View for dashboard statistics

## Usage

### For Users

1. **From Reference Detail Page**:
   - Click "Report Error" button on any reference item
   - Form is pre-filled with item information
   - Fill in issue details and submit

2. **Direct Access**:
   - Navigate to `/report-error`
   - Fill in all fields manually

### For Admins

1. Navigate to `/admin/qc-feedback`
2. View all pending feedback
3. Filter by status, type, or issue
4. Click on any feedback item to review
5. Update status and add notes
6. Mark as fixed when corrections are applied

## Feedback Workflow

1. **User Submits Feedback** → Status: `pending`
2. **Admin Reviews** → Status: `reviewed` (with notes)
3. **Corrections Applied** → Status: `fixed`
4. **Or Rejected** → Status: `rejected` or `duplicate`

## Integration Points

### Reference Detail Pages
- "Report Error" button on all reference detail pages
- Pre-fills item type, name, and source

### Future Enhancements
- Email notifications for admins on new feedback
- Automatic linking to extraction scripts for fixes
- Bulk status updates
- Export feedback for analysis
- Integration with extraction improvement pipeline

## Security

- RLS policies ensure:
  - Anyone can submit feedback
  - Users can view their own feedback
  - Only admins can view all feedback and update status
- Admin access controlled by `user_roles` table

## Next Steps

1. Run the SQL schema: `docs/db/qc_feedback_schema.sql`
2. Ensure `user_roles` table exists for admin checks
3. Test feedback submission
4. Test admin dashboard access

