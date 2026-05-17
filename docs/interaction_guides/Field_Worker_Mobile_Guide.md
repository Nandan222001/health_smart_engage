# Interaction Guide: Field Worker (Mobile)

This guide details every interactive element and transition within the Field Worker's mobile experience.

---

## Screen 1: Mobile Home Dashboard
**The primary hub for all field activities.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **User Profile Icon** | Image/Button | Tap | Opens `Profile & Settings` screen |
| **Notification Bell** | Icon/Badge | Tap | Opens `Notifications` screen |
| **"Safe Day" Indicator** | Status Card | None | Visual pulse based on AI risk score |
| **"Report Incident"** | Large Button | Tap | Opens `Quick Incident Report` form |
| **"Scan QR Code"** | Large Button | Tap | Opens `Camera Scanner` |
| **"My Tasks" List** | Scrollable List | Tap Item | Opens specific `Task Detail` (e.g., CAPA, Audit) |
| **SOPs Tab** | Bottom Nav | Tap | Switches to `SOP Search` |
| **Permits Tab** | Bottom Nav | Tap | Switches to `Permit List` |

---

## Screen 2: Quick Incident Report
**Rapid capture of safety events.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **"X" Close** | Icon | Tap | Discards draft and returns to `Home` |
| **Type Selector** | Radio/Chips | Selection | Sets `incident_type` (Near Miss, Injury, etc.) |
| **"Take Photo"** | Camera Button | Tap | Opens device camera; returns thumbnail |
| **Location Auto-fill** | Text/Icon | Tap | Triggers GPS fetch and populates address |
| **Description** | Input Field | Typing | Captures user narrative |
| **"Submit Report"** | Action Button | Tap | Calls `POST /api/v1/mobile/incidents`; shows Success Dialog |

---

## Screen 3: SOP Search & View
**Accessing safety knowledge in the field.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Search Bar** | Input | Typing | Filters document list by `title` or `tag` |
| **Document Card** | List Item | Tap | Opens `PDF Viewer` for selected SOP |
| **"Acknowledge"** | Sticky Button | Tap | Calls `POST .../acknowledge`; updates status to "Read" |

---

## Screen 4: Permit Request Form
**Initiating high-risk work authorization.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Asset Lookup** | Search/QR | Interaction | Validates if equipment is compliant |
| **Controls Checklist** | Multi-select | Check | User confirms safety measures are in place |
| **"Sign Here"** | Signature Pad | Drawing | Captures digital signature |
| **"Request Permit"** | Action Button | Tap | Calls `POST /api/v1/mobile/permits`; returns to `Permit List` |

---

## Screen 5: Audit Checklist Execution
**Completing inspections in the field.**

### UI Elements & Interactions
| Element | UI Type | Action | Destination / Result |
| :--- | :--- | :--- | :--- |
| **Question Card** | Card | None | Displays text and clause reference |
| **Pass/Fail/NA** | Segmented Ctrl | Tap | Records answer for specific `questionId` |
| **"Add Evidence"** | Photo Icon | Tap | Attaches photo to the specific question |
| **"Complete Audit"** | Footer Button | Tap | Calls `POST .../complete`; triggers sync queue |
