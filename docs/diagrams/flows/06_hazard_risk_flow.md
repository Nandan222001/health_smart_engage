# Hazard Observation & Risk Assessment Flow

## Hazard Observation (Mobile - Quick Capture)

```mermaid
flowchart TD
    FW([Field Worker]) --> HAZ_SCREEN[Open Hazard Observation Screen\nMobile App]
    HAZ_SCREEN --> HAZ_TYPE[Select Hazard Type\nPhysical · Chemical · Biological\nErgonomic · Electrical · Behavioural]
    HAZ_TYPE --> LOCATION[Enter Location\nGPS auto-detected or manual zone entry]
    LOCATION --> DESCRIPTION[Describe the Hazard\nWhat was observed · Potential consequences]
    DESCRIPTION --> PHOTO[Capture Photo\n- recommended -]
    PHOTO --> SEVERITY_EST[Estimate Severity\nLow · Medium · High · Critical]
    SEVERITY_EST --> SUBMIT_HAZ[Submit Hazard Observation\nPOST /mobile/hazards]
    SUBMIT_HAZ --> CONFIRM[Observation ID assigned\nSafety Manager notified]

    CONFIRM --> SM([Safety Manager])
    SM --> ASSIGN{Assign to\nsomeone?}
    ASSIGN -->|Yes| ASSIGN_OWNER[Assign to responsible person\nOwner notified]
    ASSIGN_OWNER --> OWNER([Assigned Owner])
    OWNER --> ACTION[Take corrective action\nDocument steps]
    ACTION --> CLOSE_HAZ[Close Hazard\nPOST /mobile/hazards/{hazardId}/close]
    ASSIGN -->|No - SM handles| CLOSE_HAZ

    CLOSE_HAZ --> CLOSED_HAZ[Hazard - CLOSED\nAudit log updated]
```

---

## Risk Assessment Flow (Web)

```mermaid
flowchart TD
    SM([Safety Manager]) --> RISK_SCREEN[Open Risk Assessment Builder\nGET /risks/assessments]
    RISK_SCREEN --> NEW_RA[Create New Risk Assessment\nPOST /risks/assessments]
    NEW_RA --> RA_SCOPE[Define Scope\nActivity / Location / Department / Assets]
    RA_SCOPE --> HAZARD_ID[Identify Hazards\nList all hazards for this scope]

    HAZARD_ID --> SCORE_LOOP[For each hazard]
    SCORE_LOOP --> LIKELIHOOD[Score Likelihood\n1-Rare · 2-Unlikely · 3-Possible\n4-Likely · 5-Almost Certain]
    LIKELIHOOD --> CONSEQUENCE[Score Consequence\n1-Negligible · 2-Minor · 3-Moderate\n4-Major · 5-Catastrophic]
    CONSEQUENCE --> RISK_SCORE[Risk Score = Likelihood × Consequence\nMatrix: 1-25]
    RISK_SCORE --> RISK_LEVEL{Risk Level}
    RISK_LEVEL -->|1-4 Low| LOW[Low Risk\nRoutine controls sufficient]
    RISK_LEVEL -->|5-12 Medium| MEDIUM[Medium Risk\nAdditional controls required]
    RISK_LEVEL -->|15-25 High| HIGH[High Risk\nImmediate action needed\nAuto-alert dispatched]

    LOW & MEDIUM & HIGH --> CONTROLS[Define Control Measures\nEliminate · Substitute · Engineer\nAdministrative · PPE]
    CONTROLS --> RESIDUAL[Calculate Residual Risk\nAfter controls applied]
    RESIDUAL --> OWNER_RA[Assign Risk Owner\nReview date set]
    OWNER_RA --> SUBMIT_RA[Submit Risk Assessment\nSaved to Risk Register]
    SUBMIT_RA --> RISK_REG[(Risk Register)]
```

---

## Risk Register & Review Flow

```mermaid
flowchart TD
    SM([Safety Manager]) --> RISK_REG[Open Risk Register\nGET /risks/assessments]
    RISK_REG --> FILTER[Filter by\nLevel · Area · Owner · Status · Due date]
    FILTER --> VIEW_LIST[Risk Register List\nID · Hazard · Score · Level · Owner · Review date]
    VIEW_LIST --> SELECT_RISK[Select Risk]
    SELECT_RISK --> ACTIONS{Action}
    ACTIONS -->|Review & update controls| UPDATE_RA[Update Risk Assessment\nPATCH risk record]
    ACTIONS -->|Escalate to CAPA| CAPA_LINK[Create CAPA from Risk\nsee CAPA Flow]
    ACTIONS -->|Close risk| CLOSE_RISK[Mark Risk CLOSED\nRisk eliminated or transferred]
    ACTIONS -->|View trend| TREND[Risk Trend Analytics\nGET /risks/trends]
```

---

## Risk Score Matrix

| | **Negligible (1)** | **Minor (2)** | **Moderate (3)** | **Major (4)** | **Catastrophic (5)** |
|---|---|---|---|---|---|
| **Almost Certain (5)** | 5 Medium | 10 Medium | 15 High | 20 High | 25 High |
| **Likely (4)** | 4 Low | 8 Medium | 12 Medium | 16 High | 20 High |
| **Possible (3)** | 3 Low | 6 Medium | 9 Medium | 12 Medium | 15 High |
| **Unlikely (2)** | 2 Low | 4 Low | 6 Medium | 8 Medium | 10 Medium |
| **Rare (1)** | 1 Low | 2 Low | 3 Low | 4 Low | 5 Medium |

**Score = Likelihood x Consequence** - Low: 1-4, Medium: 5-12, High: 13-25

---

## Hazard Observation States

```mermaid
stateDiagram-v2
    [*] --> OPEN : Field worker submits observation
    OPEN --> ASSIGNED : Safety Manager assigns to owner
    ASSIGNED --> IN_PROGRESS : Owner acknowledges
    IN_PROGRESS --> CLOSED : Owner closes with evidence
    OPEN --> CLOSED : Safety Manager closes directly
    CLOSED --> [*]
```
