# AI Safety Advisor Flow

## AI Advisor - Query & Response Flow

```mermaid
flowchart TD
    USER([Any User\nField Worker / Manager / Executive]) --> AI_SCREEN[Open AI Safety Advisor\nMobile: AIAdvisorScreen\nWeb: AI Safety Advisor Chat page]

    AI_SCREEN --> PREV_HISTORY{Previous\nConversations?}
    PREV_HISTORY -->|Yes| LOAD_HIST[Load conversation history\nGET /mobile/ai/conversations\nor GET /ai/conversations]
    PREV_HISTORY -->|No| NEW_CONV[Start new conversation]
    LOAD_HIST --> INPUT_AREA
    NEW_CONV --> INPUT_AREA

    INPUT_AREA[User types safety question\nExamples:\n- What PPE is needed for confined space entry?\n- Show me the hot work permit requirements\n- What are the steps for LOTO?\n- What are our chemical spill procedures?]

    INPUT_AREA --> SUBMIT_Q[Submit Query\nPOST /mobile/ai/advisor/query\nor POST /ai/advisor/query]

    SUBMIT_Q --> AI_BACKEND[AI Service\nProcesses query]
    AI_BACKEND --> CONTEXT_FETCH[Retrieve relevant context\n- Knowledge documents / SOPs\n- Past incident reports\n- Risk assessments\n- Regulatory standards]
    CONTEXT_FETCH --> AI_ENGINE([AI / ML Engine\nGenerates answer])
    AI_ENGINE --> RESPONSE[Answer generated\nWith source citations]

    RESPONSE --> DISPLAY[Display answer in chat\nWith linked source documents]
    DISPLAY --> SOURCES[Show citation list\n- Document name · Revision · Clause]
    SOURCES --> USER_ACTION{User\nAction}

    USER_ACTION -->|Ask follow-up| INPUT_AREA
    USER_ACTION -->|Open cited document| SOP_VIEW[View SOP / Document\nGET /knowledge/documents/{documentId}]
    USER_ACTION -->|Give feedback| FEEDBACK[Submit Feedback\nPOST /mobile/ai/responses/{responseId}/feedback\nHelpful · Not helpful · Inaccurate]
    USER_ACTION -->|End session| SAVE_CONV[Conversation saved\nto AI Conversations history]

    FEEDBACK --> FEEDBACK_USED[Feedback used to\nimprove AI responses]
    SOP_VIEW --> USER_ACTION
```

---

## Predictive Risk Scoring Flow (Background)

```mermaid
flowchart TD
    TRIGGER([Trigger:\nNew incident · Hazard · Audit finding\nor scheduled daily job]) --> COLLECT_DATA[Collect data for location/area\nRecent incidents · Open hazards\nAudit findings · Non-compliant assets\nTraining gaps · Weather / shift data]

    COLLECT_DATA --> AI_RISK_ENGINE([AI / ML Risk Engine\nPOST /ai/predictive-risk/score])
    AI_RISK_ENGINE --> SCORE[Predictive Risk Score\n0-100 per area / department]
    SCORE --> THRESHOLDS{Score\nThreshold}
    THRESHOLDS -->|Score under 30 - Low| LOW_RISK[Low risk flagged\nNo immediate action]
    THRESHOLDS -->|Score 30-70 - Medium| MED_RISK[Medium risk\nSafety Manager advisory alert]
    THRESHOLDS -->|Score above 70 - High| HIGH_RISK[High risk\nUrgent alert dispatched\nAppears in AI Intelligence Dashboard]

    LOW_RISK & MED_RISK & HIGH_RISK --> SAVE_SCORE[Score saved\nPredictiveRiskScore record created]
    SAVE_SCORE --> DASH_UPDATE[AI Intelligence Dashboard updated\nGET /dashboards/ai-intelligence]

    HIGH_RISK --> SM_ALERT([Safety Manager alerted\nRecommended actions provided])
```

---

## AI Weekly Safety Briefing Flow

```mermaid
flowchart TD
    SCHEDULER([Scheduled Job - Weekly]) --> COLLECT_WEEKLY[Collect weekly data\nIncidents · Hazards · Audits\nCAPAs · Risk trends · Training gaps]
    COLLECT_WEEKLY --> AI_BRIEFING[POST /ai/briefings/generate\nAI compiles weekly briefing]
    AI_BRIEFING --> BRIEFING_DOC[Weekly briefing document generated\nKey metrics · Trends · Alerts\nRecommended focus areas]
    BRIEFING_DOC --> PUSH_TO_DASH[Published to AI Safety Intelligence Dashboard\nGET /dashboards/ai-intelligence]
    BRIEFING_DOC --> EMAIL_NOTIF[Email digest sent to\nSafety Manager & Executive]
    EMAIL_NOTIF --> EXEC([Executive / Safety Manager\nreviews briefing])
```

---

## Knowledge Search Flow

```mermaid
flowchart TD
    USER([User]) --> SEARCH_INPUT[Enter search query\nGET /mobile/knowledge/search?q={query}\nor GET /search/knowledge?q={query}]
    SEARCH_INPUT --> RESULTS[Search results displayed\nDocument title · Tag · Revision · Date]
    RESULTS --> SELECT_DOC[Select document]
    SELECT_DOC --> VIEW_DOC[View SOP / Knowledge Document\nGET /mobile/knowledge/documents/{documentId}\nor GET /knowledge/documents/{documentId}]
    VIEW_DOC --> ACK_Q{Acknowledge\nrequired?}
    ACK_Q -->|Yes| ACK[Tap Acknowledge\nPOST /mobile/knowledge/documents/{documentId}/acknowledge]
    ACK --> RECORD[Read acknowledgement\nrecorded against user]
    ACK_Q -->|No| READ_ONLY[Read only]
```
