# Campaign Media Attachments Feature

## Overview

This feature enables users to attach media files (Images, Videos, PDFs) to Broadcast Campaigns. The files are uploaded to Supabase Storage and sent via Chatwoot using multipart/form-data.

## Technical Implementation

### Frontend (`campaign-wizard.tsx`)

- Integrated file upload component in Step 3.
- Supports files up to 10MB.
- Uploads directly to `campaign-media` bucket.
- Stores public URL in component state.

### Backend (`actions/campaigns.ts`)

- `createCampaign` action accepts `mediaUrl` and `mediaType` parameters.
- Persists these values to the `campaigns` table.

### Worker (`actions/worker.ts`)

- `processOutboundBatch` updated to handle media.
- Checks if campaign has `media_url`.
- Downloads file to memory buffer (one fetch per batch optimization).
- Passes attachment to Chatwoot Service.

### Chatwoot Service (`lib/chatwoot/service.ts`)

- `sendMessage` method updated to accept optional `attachment` object.
- Uses `FormData` to send `content` and `attachments[]` to Chatwoot API.
- Handles `Blob` creation from `ArrayBuffer`.

## Database

- **Table**: `campaigns`
- **Columns**: `media_url` (text), `media_type` (text)
- **Storage**: `campaign-media` bucket (Public Read)

## Supported Formats

- Images (JPEG, PNG, etc.)
- Videos (MP4)
- Documents (PDF)

## Usage

1. Go to Campaigns -> Create Campaign.
2. Select "Broadcast" type (or standard).
3. In Step 3 (Message), use the attachment clip icon or drag & drop area.
4. Upload file and proceed.
