# Mobile Offline Sync Flow

## Offline Data Capture Flow

```mermaid
flowchart TD
    FW([Field Worker]) --> ACTION[Perform Action in Mobile App\nReport incident · Submit hazard\nAnswer audit · Record inspection]

    ACTION --> CONN_CHECK{Device\nConnected?}

    CONN_CHECK -->|Online| DIRECT[Send directly to API\nNormal request flow]
    DIRECT --> SUCCESS[Response received\nRecord saved to server]

    CONN_CHECK -->|Offline| QUEUE[Queue operation locally\nMobileSyncItem created\nOperation type: create · update · delete]
    QUEUE --> LOCAL_STORE[(Local Sync Queue\non device)]
    LOCAL_STORE --> INDICATOR[Sync status indicator shown\nPending: N items to sync]

    FW --> CONTINUE[Continue working offline\nAll actions queued locally]
```

---

## Sync Execution Flow (When Connectivity Restored)

```mermaid
flowchart TD
    CONN_RESTORED([Connectivity restored\nor user opens Sync Status screen]) --> SYNC_STATUS[View Sync Status\nGET /mobile/sync/status\nPending items count shown]

    SYNC_STATUS --> PULL_FIRST[Pull latest data from server first\nPOST /mobile/sync/pull\nDelta since last sync]
    PULL_FIRST --> PULL_RESP[Server returns changed records\nPermits · Incidents · Audits · Hazards\nAssets · Tasks · Notifications]
    PULL_RESP --> UPDATE_LOCAL[Update local cache\nwith server data]
    UPDATE_LOCAL --> PUSH_QUEUE

    PUSH_QUEUE[Push queued offline operations\nPOST /mobile/sync/push\nAll pending MobileSyncItems sent]
    PUSH_QUEUE --> FOR_EACH_ITEM[For each queued item]

    FOR_EACH_ITEM --> CONFLICT_CHECK{Server record\nchanged since\noffline capture?}
    CONFLICT_CHECK -->|No conflict| APPLY[Apply operation to server\nRecord created / updated]
    APPLY --> REMOVE_QUEUE[Remove item from sync queue]
    REMOVE_QUEUE --> NEXT_ITEM

    CONFLICT_CHECK -->|Conflict detected| CONFLICT_FLAG[Mark as CONFLICT\nBoth versions preserved]
    CONFLICT_FLAG --> NEXT_ITEM

    NEXT_ITEM{More\nQueued Items?}
    NEXT_ITEM -->|Yes| FOR_EACH_ITEM
    NEXT_ITEM -->|No| SYNC_RESULT

    SYNC_RESULT{Any\nConflicts?}
    SYNC_RESULT -->|No| SYNC_DONE[Sync complete\nAll records applied]
    SYNC_RESULT -->|Yes| CONFLICT_SCREEN[Show Conflict Resolution Screen\nList of conflicted records]
```

---

## Conflict Resolution Flow

```mermaid
flowchart TD
    USER([Field Worker]) --> CONFLICT_LIST[Conflict Resolution Screen\nList of conflicted records]
    CONFLICT_LIST --> SELECT_CONFLICT[Select a conflict to resolve]
    SELECT_CONFLICT --> COMPARE[Compare versions side by side\nLocal version vs Server version\nField-by-field diff shown]
    COMPARE --> RESOLUTION{Choose\nResolution}

    RESOLUTION -->|Keep my version - Local| KEEP_LOCAL[POST /mobile/sync/conflicts/:conflictId/resolve\nresolution: local\nLocal record overwrites server]
    RESOLUTION -->|Keep server version - Remote| KEEP_SERVER[POST /mobile/sync/conflicts/:conflictId/resolve\nresolution: remote\nServer record kept, local discarded]
    RESOLUTION -->|Merge manually| MANUAL_MERGE[Edit merged version\nCombine relevant fields from both]
    MANUAL_MERGE --> SAVE_MERGE[POST /mobile/sync/conflicts/:conflictId/resolve\nresolution: merge · merged_data provided]

    KEEP_LOCAL & KEEP_SERVER & SAVE_MERGE --> CONFLICT_RESOLVED[Conflict resolved\nRecord updated]
    CONFLICT_RESOLVED --> MORE_CONFLICTS{More\nConflicts?}
    MORE_CONFLICTS -->|Yes| CONFLICT_LIST
    MORE_CONFLICTS -->|No| SYNC_COMPLETE[All conflicts resolved\nSync status: COMPLETE]
```

---

## Sync Queue Item States

```mermaid
stateDiagram-v2
    [*] --> PENDING : Operation queued while offline
    PENDING --> SYNCING : Sync push started
    SYNCING --> APPLIED : Applied to server, no conflict
    SYNCING --> CONFLICT : Conflict detected with server version
    CONFLICT --> APPLIED : User resolves conflict
    APPLIED --> [*]
```

---

## Sync Status Screen

```mermaid
flowchart TD
    USER([User]) --> SYNC_SCREEN[Open Sync Status Screen\nMobile: SyncStatusScreen]
    SYNC_SCREEN --> STATUS_VIEW[View current status\nLast synced timestamp\nPending items: N\nConflicts: N]
    STATUS_VIEW --> MANUAL_SYNC[Tap Sync Now button]
    MANUAL_SYNC --> SYNC_FLOW[Sync Execution Flow]
    STATUS_VIEW --> VIEW_QUEUE[View pending queue items\nOperation · Entity type · Created at]
    STATUS_VIEW --> VIEW_CONFLICTS[View unresolved conflicts]
    VIEW_CONFLICTS --> CONFLICT_RESOLVE[Conflict Resolution Flow]
```
