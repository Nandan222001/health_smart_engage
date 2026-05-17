# Interaction Guide: Safety Manager (Web Dashboard)

This guide details the desktop interaction model for Safety Managers managing site safety.

---

## Screen 1: Site HSE Command Dashboard
**The manager's mission control for site safety.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Global Site Filter** | Dropdown | Select | Refreshes all metrics for selected `site_id` |
| **"Approvals" Tile** | KPI Card | Click | Navigates to `Permit Review Queue` |
| **"High Severity" Incident**| Alert Card | Click | Navigates to `Incident Detail & Investigation` |
| **Hazard Map** | Interactive SVG | Hover/Click | Shows hazard details at specific site locations |
| **"Create Audit"** | Button | Click | Opens `Audit Scheduling` modal |

---

## Screen 2: Permit Review Queue
**Processing and authorizing high-risk work.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Status Tabs** | Tabs | Click | Filters list (Submitted, Approved, Expiring, Closed) |
| **Permit Row** | Table Row | Click | Navigates to `Permit Detail Review` |
| **"Conflict" Icon** | Warning Tag | Click | Opens `Concurrent Work Conflict Viewer` |
| **Bulk Approve** | Checkbox/Btn | Click | Approves multiple low-risk permits at once |

---

## Screen 3: Incident Investigation Workspace
**Managing the full investigation lifecycle.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Timeline View** | Gantt/List | Scroll | Reviews sequence of events from report to closure |
| **"5-Why" Tool** | Interactive Tree | Typing | User records root cause analysis levels |
| **"Add CAPA"** | Button | Click | Opens `CAPA Creation` form linked to this incident |
| **Evidence Gallery** | Grid | Click Image | Opens high-res photo viewer with metadata |

---

## Screen 4: Risk Register
**Strategic risk monitoring and control.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Risk Matrix (5x5)** | Grid | Click Cell | Filters register to show risks in that severity/likelihood |
| **"Add Risk"** | Primary Button | Click | Navigates to `Risk Assessment Builder` |
| **Control Status** | Progress Bar | Hover | Shows implementation % of required controls |
| **Export Register** | Dropdown | Click | Triggers PDF/Excel download of site register |

---

## Screen 5: Audit & CAPA Manager
**Ensuring site-wide compliance.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Calendar View** | Calendar | Drag/Drop | Reschedules upcoming audits |
| **Finding Card** | Card | Click | Opens `Finding Detail` with linked ISO clauses |
| **Approve CAPA** | Button | Click | Marks CAPA as closed; writes to audit log |
