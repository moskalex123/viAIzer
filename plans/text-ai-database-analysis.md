# Text AI Database Analysis

## Project Overview

The Text AI project is a **Telegram Channel Content Improvement Bot** that:
- Monitors source Telegram channels
- Uses AI to improve/rewrite text content
- Posts improved content to target channels
- Has a payment system using "stars" and "batteries" as currency
- Supports multiple AI models (23 models configured)
- Provides scheduled posting functionality

## Database Schema

### Core Tables

#### 1. **users** (9 rows)
User accounts with Telegram integration

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| telegram_id | bigint | Telegram user ID |
| telegram_user_name | varchar | Telegram username |
| phone_number | varchar | User's phone number |
| balance | double precision | User's balance |
| send_report_to | varchar | Where to send reports |
| VIP_level | integer | VIP status level |
| username | varchar | Username |
| first_name | varchar | First name |
| last_name | varchar | Last name |
| is_superuser | boolean | Admin status |
| avatar_url | varchar | Profile picture URL |
| created_at | timestamp | Account creation date |
| is_active | boolean | Account status |
| is_newcomer | boolean | New user flag |
| language_code | varchar | User's language |
| bot_system_content | text | Custom bot system prompt |
| bot_model_1 | integer | Primary AI model ID |
| bot_model_2 | integer | Secondary AI model ID |
| free_batteries_total | double precision | Free batteries earned |
| time_of_last_earned_battery | timestamp | Last free battery earned |

**Key Insights:**
- Uses Telegram ID as primary identifier
- Has VIP level system (0 = regular user)
- Balance system for payments
- Supports multiple languages
- Can configure custom AI models per user

#### 2. **channel_pairs** (7 rows)
Source and target channel configurations

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| source_channel | varchar | Source Telegram channel ID |
| target_channel | varchar | Target Telegram channel ID |
| text_to_delete | text | Text patterns to remove |
| model_id | integer | AI model to use |
| system_content | text | Custom AI system prompt |
| max_tokens | integer | Max tokens for AI response |
| temperature | double precision | AI temperature setting |
| top_p | double precision | AI top_p setting |
| hour_min | integer | Minimum hour for posting |
| hour_max | integer | Maximum hour for posting |
| caption_text | text | Custom caption text |
| caption_url | text | Custom caption URL |

**Key Insights:**
- Users can create multiple channel pairs
- Highly customizable AI parameters
- Time-based posting restrictions
- Custom text filtering

**Sample System Prompts:**
- "Улучши этот текст, сделай его более читаемым, исправь грамматические ошибки и стилистические недочеты. Сохрани основной смысл и тон сообщения.. добавь эмодзи по тексту.Придумай цитату в  стиле в  Конфуция"
- "this is caption for video. make sure to translate text into English. Add some interesting fact about topic. Remove any relation to Russia. respond in form that is ready to replace caption directly..."

#### 3. **channel_processing_state** (7 rows)
Tracks processing progress for each channel pair

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| channel_pair_id | integer | Foreign key to channel_pairs |
| last_processed_message_id | integer | Last message processed |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**Key Insights:**
- Ensures no duplicate processing
- Tracks progress per channel pair

#### 4. **models** (23 rows)
Available AI models with pricing

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| model | varchar | Model identifier (e.g., "mistralai/mistral-small-3.2-24b-instruct") |
| system_content | text | Default system prompt |
| user_content | text | Default user prompt template |
| max_tokens | integer | Default max tokens |
| temperature | double precision | Default temperature |
| top_p | double precision | Default top_p |
| price_per_post | double precision | Cost per post |
| provider | integer | Provider ID (0=OpenAI, 1=OpenRouter, etc.) |
| model_visible_name | text | Display name with emojis |
| visible | integer | Visibility flag |
| api_price | double precision | API cost |

**Sample Models:**
- mistral-small-3.2-24b-instruct (0.2 batteries)
- gemma-3-27b-it (0.5 batteries)
- qwen3-next-80b-a3b-instruct (0.8 batteries)

**Key Insights:**
- 23 different AI models available
- Uses OpenRouter (provider=1) for most models
- Pricing varies by model
- Models have visible names with emojis

#### 5. **payments** (13 rows)
Payment tracking

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| currency_type | varchar | Currency type (stars) |
| amount | double precision | Payment amount |
| batteries_received | double precision | Batteries earned |
| status | varchar | Payment status (pending/completed) |
| telegram_invoice_id | varchar | Telegram invoice ID |
| telegram_pre_checkout_id | varchar | Telegram pre-checkout ID |
| external_transaction_id | varchar | External transaction ID |
| error_message | text | Error details |
| created_at | timestamp | Payment creation time |
| completed_at | timestamp | Payment completion time |

**Key Insights:**
- Uses Telegram Stars for payments
- Converts stars to batteries (internal currency)
- Tracks payment status
- Integrates with Telegram payment system

#### 6. **scheduled_posts** (287 rows)
Queue of posts to be published

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| channel_pair_id | integer | Foreign key to channel_pairs |
| original_message_id | bigint | Original message ID |
| source_channel_id | varchar | Source channel ID |
| target_channel_id | varchar | Target channel ID |
| message_id | bigint | Published message ID |
| media_type | varchar | Media type (video/photo/text) |
| scheduled_at | timestamp | Scheduled time |
| status | varchar | Post status (pending/completed/failed) |
| content | text | Improved content |
| media_path | varchar | Media file path |
| created_at | timestamp | Creation timestamp |
| balance_after | double precision | Balance after post |

**Sample Content:**
```
"The Northernmost Cat 🐱
The lynx is the only cat living in Arctic Circle. Its fur is warmest and fluffiest, helping it survive harsh conditions ❄️. 
Its luxurious coat keeps it cozy in coldest regions 🌎."
```

**Key Insights:**
- Large queue of pending posts (287)
- Supports various media types
- Tracks balance changes
- Stores improved content

#### 7. **workers** (1 row)
Background worker management

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| session_id | integer | Foreign key to telegram_sessions |
| status | varchar | Worker status (running/stopped) |
| last_started_at | timestamp | Last start time |
| last_activity_at | timestamp | Last activity time |
| pid | integer | Process ID |
| last_error | text | Last error message |

**Key Insights:**
- Background processing system
- Tracks worker status and errors
- Uses process IDs for management

#### 8. **worker_queue** (0 rows)
Queue for worker tasks

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| status | varchar | Task status |
| priority | integer | Task priority |
| created_at | timestamp | Creation time |
| started_at | timestamp | Start time |
| completed_at | timestamp | Completion time |
| error_message | text | Error details |

**Key Insights:**
- Currently empty (no queued tasks)
- Supports priority-based processing

#### 9. **telegram_sessions** (4 rows)
User session management

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | integer | Foreign key to users |
| session_path | varchar | Session file path |
| created_at | timestamp | Session creation |
| session_last_used | timestamp | Last used time |

**Key Insights:**
- Manages Telegram client sessions
- Tracks session usage

#### 10. **user_bot_log_state** (3 rows)
Bot state tracking per user

| Column | Type | Description |
|--------|------|-------------|
| user_id | integer | Primary key |
| last_status_message_id | varchar | Last status message ID |
| updated_at | timestamp | Last update time |

**Key Insights:**
- Tracks bot interaction state
- Manages status messages

#### 11. **worker_errors** (0 rows)
Error logging

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| worker_id | integer | Foreign key to workers |
| timestamp | timestamp | Error time |
| error_type | varchar | Error type |
| error_message | text | Error details |

**Key Insights:**
- Currently no errors
- Comprehensive error tracking

#### 12. **alembic_version** (1 row)
Database migration tracking

| Column | Type | Description |
|--------|------|-------------|
| version_num | varchar | Migration version |

**Key Insights:**
- Uses Alembic for migrations
- Current version: h1234567891

## Currency System

### Stars (Telegram Stars)
- Used for payments via Telegram
- Converted to batteries
- Payment currency

### Batteries
- Internal currency for AI processing
- Earned from stars purchases
- Used per AI model request
- Different models cost different amounts

### Pricing Examples
- mistral-small-3.2-24b-instruct: 0.2 batteries
- gemma-3-27b-it: 0.5 batteries
- qwen3-next-80b-a3b-instruct: 0.8 batteries

## AI Model Integration

### Providers
- **Provider 0**: OpenAI
- **Provider 1**: OpenRouter (most models)

### Model Categories
1. **Small Models** (0.2-0.5 batteries)
   - Fast, cost-effective
   - Good for simple text improvements

2. **Medium Models** (0.5-0.8 batteries)
   - Better quality
   - More creative responses

3. **Large Models** (0.8+ batteries)
   - Highest quality
   - More expensive

## Key Features

### 1. Channel Monitoring
- Monitors source Telegram channels
- Detects new messages
- Processes content automatically

### 2. AI Text Improvement
- Uses customizable AI models
- Supports custom system prompts
- Configurable parameters (temperature, top_p, max_tokens)
- Text filtering capabilities

### 3. Scheduled Posting
- Queue system for posts
- Time-based scheduling
- Status tracking
- Balance management

### 4. Payment Integration
- Telegram Stars integration
- Automatic currency conversion
- Payment status tracking
- Invoice management

### 5. User Management
- Telegram authentication
- VIP level system
- Balance tracking
- Multi-language support
- Custom model selection

### 6. Background Processing
- Worker system
- Queue management
- Error tracking
- Process monitoring

## Workflow

```
1. User pairs source and target channels
2. Configures AI model and parameters
3. Worker monitors source channel
4. New message detected
5. AI processes and improves content
6. Post scheduled for target channel
7. Post published at scheduled time
8. Balance deducted
```

## Integration Opportunities with viAIzer

### Shared Components
1. **User Authentication**: Both use Telegram IDs
2. **AI Models**: Both use OpenRouter and OpenAI
3. **Payment System**: Both have currency systems
4. **Multi-language Support**: Both support multiple languages

### Complementary Features
1. **Text AI**: Channel content automation
2. **viAIzer**: Direct user interaction and image processing
3. **Combined**: Full content creation pipeline

### Potential Synergies
1. **Unified User Account**: Single account across both platforms
2. **Shared Balance**: Use batteries/батарейки across both platforms
3. **Cross-Platform Workflows**: 
   - Use viAIzer to create images
   - Use Text AI to generate captions
   - Publish to channels automatically
4. **Shared AI Models**: Access to 23+ models across platforms
5. **Unified Analytics**: Track usage across both platforms

## Technical Stack Inferences

### Backend
- Node.js (inferred from viAIzer)
- PostgreSQL database
- Telegram Bot API
- OpenRouter API
- OpenAI API

### Deployment
- Background workers
- Queue management
- Session management
- Process monitoring

## Data Relationships

```
users (1) ──── (N) channel_pairs
users (1) ──── (N) payments
users (1) ──── (N) scheduled_posts
users (1) ──── (N) telegram_sessions
users (1) ──── (1) user_bot_log_state
users (1) ──── (N) workers

channel_pairs (1) ──── (1) channel_processing_state
channel_pairs (1) ──── (N) scheduled_posts

models (1) ──── (N) channel_pairs

workers (1) ──── (N) worker_queue
workers (1) ──── (N) worker_errors
```

## Current Usage Statistics

- **Users**: 9 active users
- **Channel Pairs**: 7 active pairs
- **Models**: 23 available models
- **Scheduled Posts**: 287 pending posts
- **Payments**: 13 transactions
- **Workers**: 1 worker (stopped)

## Next Steps for Integration

1. **Map User Entities**: Match users between platforms
2. **Unify Currency**: Convert between батарейки and batteries
3. **Share AI Models**: Access to all models from both platforms
4. **Cross-Platform API**: Enable communication between platforms
5. **Unified Analytics**: Track usage across both platforms
6. **Shared Workflows**: Create combined content creation pipelines

---

**Analysis Date**: 2026-01-06
**Database**: taigerdb
**Status**: Complete
