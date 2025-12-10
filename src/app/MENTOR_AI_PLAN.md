# Mentor AI Assistant - Complete Implementation Plan

## Overview
Build "Mentor" - your business mentor AI assistant that learns everything about each business account and provides intelligent, personalized advice through conversational interface. Mentor acts as a trusted advisor, learning from your business data and helping you make better decisions.

**CRITICAL MVP SAFETY REQUIREMENT**: All implementation must be additive-only. Existing MVP functionality must remain 100% intact with zero breaking changes. New features are opt-in only.

## Pricing & Business Model

### Customer Pricing: Option 1 - Flat Subscription
- **£49/month** - Unlimited queries
- Separate add-on subscription (not included in base tiers)
- Available to any subscription tier (free users can also purchase)
- Simple, predictable pricing with ~5-6x markup

### Your Costs (per customer per month):
- AI Model (GPT-4/Claude): ~$2-5/month
- Embeddings: ~$0.10-0.50/month
- Vector DB (pgvector): $0 (uses existing PostgreSQL)
- Internet Search: ~$0.20-1/month
- Infrastructure: ~$0.50-1/month
- **Total: ~$3-9/month per active user**

## The "Mentor" Concept - Extended Features

### Core Mentor Philosophy
Mentor isn't just an AI chatbot - it's your business mentor that:
- **Learns** your business patterns over time
- **Guides** you toward better decisions
- **Teaches** best practices and industry knowledge
- **Tracks** your progress and growth
- **Celebrates** your wins and helps you learn from mistakes

### Mentor-Themed Features to Add

#### 1. **Business Goals & Progress Tracking**
- Set business goals (e.g., "Reduce food cost to 25%", "Increase monthly revenue by 20%")
- Mentor tracks progress and provides updates
- Visual progress indicators
- Goal-based suggestions ("You're 15% away from your food cost target, here's how...")

#### 2. **Learning & Insights**
- "Mentor Insights" - Weekly/monthly reports on business health
- "What I Learned" - Summaries of patterns Mentor discovered
- "Best Practices" - Industry-specific advice based on business type
- "Mistakes to Avoid" - Warnings based on similar businesses' data

#### 3. **Proactive Guidance**
- Daily/weekly check-ins ("Good morning! Here's what Mentor noticed...")
- Alerts for opportunities ("Your chocolate cake sales are up 30% - consider promoting it")
- Warnings ("Your ingredient costs increased 15% this month - let's review")
- Reminders ("Don't forget: Employee birthdays this week, compliance checks due")

#### 4. **Business Growth Tracking**
- "Business Health Score" - Overall metric based on multiple factors
- Growth milestones and achievements
- Comparison to industry benchmarks
- "Where You Started vs. Where You Are" - Historical progress

#### 5. **Personalized Learning Paths**
- Mentor suggests areas to focus on based on business stage
- "Mentor's Recommendations" - Prioritized action items
- Step-by-step guidance for complex decisions
- Industry-specific learning modules

#### 6. **Conversation Memory & Context**
- Mentor remembers past conversations
- References previous advice and outcomes
- "Last time we discussed..." - continuity in guidance
- Learns your preferences and communication style

#### 7. **Mentor Dashboard**
- Quick stats and insights at a glance
- Recent conversations and key takeaways
- Upcoming reminders and action items
- Business health overview

## Architecture

### 1. Data Knowledge Base
- **Vector Database**: Store embeddings of business data (recipes, ingredients, sales history, staff info, etc.)
- **Data Indexing Service**: Periodically index all company data into vector embeddings
- **Knowledge Graph**: Build relationships between entities (recipes → ingredients → suppliers → costs)
- **Data Sources to Index**:
  - Recipes (names, descriptions, costs, pricing, categories)
  - Ingredients (names, suppliers, prices, purchase history)
  - Sales records (revenue, channels, trends)
  - Staff data (roles, schedules, payroll)
  - Suppliers (contacts, pricing, delivery terms)
  - Production history (efficiency, waste, timing)
  - Analytics snapshots (profitability, trends)
  - Activity logs (user behavior patterns)
  - Goals and progress tracking
  - Historical conversations and outcomes

### 2. AI Model Integration
- **Primary**: RAG (Retrieval-Augmented Generation) using OpenAI GPT-4 Turbo or Claude
- **Secondary**: Fine-tuned model for business-specific patterns (future enhancement)
- **Embedding Model**: OpenAI text-embedding-3-large or similar
- **Vector Store**: pgvector (PostgreSQL extension) - FREE, uses existing database
- **Internet Search**: Tavily API or Perplexity API for web research

### 3. Database Schema Extensions

#### New Tables:
- `MentorSubscription`: Track Mentor feature subscriptions per company
- `MentorConversation`: Store conversation threads
- `MentorMessage`: Individual messages in conversations
- `MentorKnowledgeIndex`: Track what data has been indexed per company
- `MentorConfig`: Per-company Mentor preferences and settings
- `MentorGoal`: Business goals set by users
- `MentorProgress`: Progress tracking for goals
- `MentorInsight`: Generated insights and recommendations
- `MentorReminder`: Proactive reminders and alerts
- `MentorLearning`: Learning paths and educational content

### 4. API Routes

#### `/api/mentor/chat`
- Handle chat messages
- Retrieve relevant business context
- Call AI model with context
- Store conversation history
- Handle internet search when needed
- **MVP Safety**: New route, doesn't touch existing routes

#### `/api/mentor/index`
- Trigger data re-indexing for a company
- Background job to update vector embeddings
- **MVP Safety**: Background job, doesn't affect existing functionality

#### `/api/mentor/subscription`
- Check subscription status
- Handle subscription management
- **MVP Safety**: Uses existing FeatureModule pattern

#### `/api/mentor/goals`
- Create, update, delete business goals
- Track progress
- **MVP Safety**: New feature, isolated

#### `/api/mentor/insights`
- Generate and retrieve business insights
- **MVP Safety**: Read-only, doesn't modify existing data

#### `/api/mentor/reminders`
- Create, update, dismiss reminders
- **MVP Safety**: New feature, isolated

### 5. UI Components

#### Chat Interface (`/dashboard/mentor`)
- Chat window with message history
- Input field for questions
- Loading states
- Message formatting (markdown support)
- Suggested questions/prompts
- Context indicators (showing what data Mentor is using)
- **MVP Safety**: New page, doesn't modify existing dashboard

#### Mentor Dashboard (`/dashboard/mentor/dashboard`)
- Business health score
- Recent insights
- Active goals and progress
- Upcoming reminders
- Quick stats
- **MVP Safety**: New page, isolated

#### Goals Page (`/dashboard/mentor/goals`)
- View all goals
- Create new goals
- Track progress
- Visual progress indicators
- **MVP Safety**: New feature, isolated

#### Settings Page (`/dashboard/mentor/settings`)
- Enable/disable Mentor features
- Configure data sources to include
- Set privacy preferences
- View subscription status
- Configure reminders and notifications
- **MVP Safety**: New page, isolated

### 6. Subscription Integration

#### Stripe Product
- Create "Mentor AI Assistant" add-on product
- Pricing: £49/month (unlimited queries)
- Feature module integration (similar to existing FeatureModule system)
- **MVP Safety**: Uses existing FeatureModule pattern, doesn't modify base subscription logic

#### Access Control
- Check subscription before allowing Mentor access
- Show upgrade prompts for non-subscribers
- Track usage metrics (messages per month)
- Graceful degradation if subscription expires (no breaking errors)
- **MVP Safety**: Feature gating, existing pattern

### 7. Security & Privacy (CRITICAL)

**Strict Data Isolation (MUST HAVE)**:
- Every Mentor query MUST be scoped to authenticated company ID - no exceptions
- Vector database queries filtered by companyId at database level (row-level security)
- Separate vector namespaces/collections per company
- Company ID validated on every API request before any data access
- No shared embeddings or knowledge bases between companies
- Pre-flight validation: Verify user membership in company before any Mentor call
- Post-response validation: Ensure no cross-company data leakage

**Multi-Layer Security**:
- Authentication required for all Mentor endpoints
- Company membership verification (check Membership table) before data access
- API route middleware validates company access on every request
- Rate limiting per company to prevent abuse
- Query logging with company ID, user ID, timestamp for audit trail

**PII Handling**:
- Mask sensitive data (employee emails, phone numbers, exact addresses) in Mentor context
- Configurable PII masking rules per company
- Option to exclude certain data types from Mentor access (e.g., payroll data)

**Audit & Compliance**:
- Log all Mentor interactions with company ID, user ID, timestamp, data accessed
- Track what data was retrieved for each query
- Monitor for suspicious access patterns
- Configurable conversation history retention per company
- GDPR compliance: data deletion, export, right to be forgotten
- Regular security audits of Mentor queries and data access patterns

### 8. MVP Safety Implementation Strategy

#### Isolation Principles:
1. **New Routes Only**: All Mentor routes are `/api/mentor/*` - no modification to existing routes
2. **New Pages Only**: All Mentor pages are `/dashboard/mentor/*` - no modification to existing pages
3. **New Database Tables**: All Mentor tables are prefixed with `Mentor*` - no schema changes to existing tables
4. **Feature Module Pattern**: Uses existing FeatureModule system - proven pattern
5. **Optional Features**: All Mentor features are behind subscription check - no impact if not subscribed
6. **Graceful Degradation**: If Mentor fails, it doesn't affect existing functionality
7. **No Shared State**: Mentor doesn't modify existing data structures or business logic

#### Testing Strategy:
- Unit tests for all Mentor components (isolated)
- Integration tests for Mentor API routes (isolated)
- E2E tests for Mentor features (isolated)
- Regression tests for existing MVP features (ensure nothing broke)
- Security tests for data isolation (critical)

### 9. Implementation Phases

#### Phase 1: Foundation (MVP)
- Database schema for conversations, subscriptions, goals
- Basic chat UI
- RAG implementation with OpenAI
- Vector database setup (pgvector)
- Data indexing for core entities (recipes, ingredients, sales)
- Stripe subscription integration
- **MVP Safety**: All isolated, no existing code touched

#### Phase 2: Enhanced Context & Goals
- Expand data indexing (staff, suppliers, production history)
- Internet search integration
- Better context retrieval (semantic search)
- Conversation memory across sessions
- Goals and progress tracking
- Suggested questions based on business data
- **MVP Safety**: Additive features only

#### Phase 3: Intelligence & Insights
- Fine-tuned model for business patterns (future)
- Predictive insights (pricing recommendations, demand forecasting)
- Proactive alerts (e.g., "Your ingredient costs increased 15%")
- Business health scoring
- Weekly/monthly insights reports
- Integration with existing analytics
- **MVP Safety**: Read-only insights, no data modification

#### Phase 4: Voice & Advanced Features
- Voice input (speech-to-text)
- Voice output (text-to-speech)
- Real-time conversation
- Multi-language support
- **MVP Safety**: New features, isolated

## Technical Stack

- **Vector DB**: pgvector (PostgreSQL extension) - FREE, uses existing database
- **AI Provider**: OpenAI GPT-4 Turbo or Anthropic Claude
- **Embeddings**: OpenAI text-embedding-3-large
- **Search**: Tavily API or Perplexity API
- **Background Jobs**: Vercel Cron or external job queue
- **Caching**: Redis for conversation context (optional)

## Key Files to Create/Modify

### New Files (All Isolated):
- `prisma/schema.prisma` - Add Mentor-related models (new tables only)
- `lib/mentor/` - Mentor service layer
  - `chat.ts` - Chat handler
  - `embeddings.ts` - Embedding generation
  - `vector-store.ts` - Vector database operations
  - `context-retrieval.ts` - Retrieve relevant business context
  - `web-search.ts` - Internet search integration
  - `goals.ts` - Goal tracking
  - `insights.ts` - Insight generation
- `api/mentor/chat/route.ts` - Chat API endpoint
- `api/mentor/index/route.ts` - Data indexing endpoint
- `api/mentor/subscription/route.ts` - Subscription management
- `api/mentor/goals/route.ts` - Goals management
- `api/mentor/insights/route.ts` - Insights endpoint
- `dashboard/mentor/page.tsx` - Main chat interface
- `dashboard/mentor/dashboard/page.tsx` - Mentor dashboard
- `dashboard/mentor/goals/page.tsx` - Goals page
- `dashboard/mentor/settings/page.tsx` - Settings page
- `components/mentor/ChatWindow.tsx` - Chat UI component
- `components/mentor/MessageBubble.tsx` - Message display
- `components/mentor/SuggestedQuestions.tsx` - Prompt suggestions
- `components/mentor/GoalCard.tsx` - Goal display component
- `components/mentor/InsightCard.tsx` - Insight display component
- `components/mentor/BusinessHealthScore.tsx` - Health score component

### Modified Files (Minimal, Additive Only):
- `api/webhooks/stripe/route.ts` - Add Mentor subscription webhook handler (new function, doesn't modify existing)
- `lib/stripe.ts` - Add Mentor product/price creation helper (new function)
- `lib/user-app-subscriptions.ts` - Add Mentor module check helper (new function, extends existing)

## Data Indexing Strategy

### Initial Index (Phase 1):
1. Recipes: name, description, category, cost, pricing
2. Ingredients: name, supplier, price history, purchase patterns
3. Sales: revenue trends, top products, channels

### Extended Index (Phase 2):
4. Staff: roles, schedules, performance
5. Suppliers: contacts, pricing, delivery terms
6. Production: efficiency, waste, timing
7. Analytics: profitability, trends, forecasts
8. Goals: business objectives and progress

### Indexing Process:
- Background job runs daily/weekly
- Incremental updates (only changed data)
- Full re-index on demand
- Track indexing status per company
- **MVP Safety**: Background process, doesn't affect existing functionality

## Example Use Cases

1. **Pricing Advice**: "Mentor, what should I price my chocolate cake at?"
   - Mentor analyzes ingredient costs, food cost %, competitor pricing (web search), profit margins

2. **Goal Setting**: "Mentor, help me set a food cost target for my bakery"
   - Mentor analyzes current food costs, industry benchmarks (web search), business type, sets goal

3. **Progress Check**: "Mentor, how am I doing on my goals?"
   - Mentor shows progress on all active goals, provides encouragement, suggests next steps

4. **Operational Advice**: "Mentor, how can I reduce waste in production?"
   - Mentor analyzes production history, identifies patterns, suggests improvements

5. **Proactive Insight**: Mentor proactively: "I noticed your chocolate cake sales are up 30% this month. Consider promoting it more or increasing production."

6. **Compliance**: "Mentor, what food safety regulations do I need to follow?"
   - Mentor searches current regulations, checks against business practices

7. **Employee Management**: "Mentor, remind me about upcoming employee birthdays"
   - Mentor queries staff data, provides reminders, can set up recurring reminders

8. **Supplier Management**: "Mentor, which supplier should I use for flour?"
   - Mentor compares suppliers, prices, delivery terms, reliability

9. **Learning**: "Mentor, teach me about food cost management"
   - Mentor provides educational content, best practices, industry knowledge

10. **Business Health**: "Mentor, how's my business doing?"
    - Mentor provides overall health score, key metrics, areas for improvement

## Success Metrics

- User engagement (messages per user per month)
- Response quality (user ratings)
- Subscription conversion rate
- Feature adoption rate (goals set, insights viewed)
- Response time (latency)
- Cost per conversation
- Goal completion rate
- User retention (Mentor subscribers)

## Future Enhancements

- Voice chat (Phase 4)
- Multi-language support
- Mobile app integration
- API for third-party integrations
- Custom AI training on business-specific data
- Integration with external tools (accounting, POS systems)
- Mentor marketplace (share insights with other businesses)
- Collaborative learning (anonymized insights from similar businesses)

## MVP Safety Checklist

- [ ] All new routes are under `/api/mentor/*` - no existing routes modified
- [ ] All new pages are under `/dashboard/mentor/*` - no existing pages modified
- [ ] All new database tables prefixed with `Mentor*` - no existing tables modified
- [ ] Uses existing FeatureModule pattern - proven approach
- [ ] All features behind subscription check - no impact if not subscribed
- [ ] Graceful error handling - failures don't break existing functionality
- [ ] Comprehensive tests for Mentor features (isolated)
- [ ] Regression tests for existing MVP features (ensure nothing broke)
- [ ] Security tests for data isolation (critical)
- [ ] Documentation for Mentor features (separate from MVP docs)





