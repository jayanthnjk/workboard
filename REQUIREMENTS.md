# Karnataka State Police WorkBoard — Consolidated Requirements

## 1. Introduction

Karnataka State Police WorkBoard is a comprehensive shift management and duty roster application for the Karnataka State Police CAR (City Armed Reserve) unit. It manages 572 personnel across three operational sections (A, B, C), 111 PMT personnel, and 24 Recruit APCs. Built with React and TypeScript, the system provides intelligent scheduling, AI-powered conversational assistance, role-based access control, document parsing, leave management, and reporting — all backed by mocked services for demo purposes.

This document consolidates requirements from five specification areas:

1. **Core Shift Management** — foundational UI, auth, scheduling, chatbot, voice, document parsing, notifications, reporting, audit
2. **Karnataka Police WorkBoard** — branding, organizational hierarchy, sections, platoons, rotations, Form 168, guard duty, VIP/gunman, leave, PMT, recruits
3. **Llama AI Conversation** — real LLM integration replacing mock service, streaming, intent recognition, action execution
4. **RBAC & Schedules Enhancement** — rank-based access control, enhanced schedule page, adhoc requests
5. **Duty Page Pagination Fix** — bugfix for DutyDetailPage pagination

---

## 2. Glossary

| Term | Definition |
|------|-----------|
| WorkBoard_UI | Main React-based user interface application |
| Section_A | Fixed Administrative Duties — 74 personnel (leadership, chamber sentry, armoury, dog squad, ASC team, gunman, OOD) |
| Section_B | Support Functions — 67 personnel (office writers, police canteen, band team, QRT team, CPT team) |
| Section_C | Rotational Platoon Duties — 277 personnel (34 AHC + 243 APC) rotating across 5 duty types on 15-day cycles |
| PMT | Personnel on Miscellaneous Training — 111 personnel (RPI-1, RSI-1, ARSI-20, AHC-66, APC-23) |
| Recruit_APC | 24 recruit APCs currently under basic training |
| Platoon | A group of Section C personnel rotating through duty types |
| Personnel_ID | Unique identifier (format: AHC-127, APC-2539, etc.) |
| Duty_Type | Rotational duty: Guard-I, Guard-II, Check Point, Prison/VIP Escort/Out, Striking Force/Help |
| Rotation_Cycle | 15-day period during which a platoon performs a specific duty type |
| Form_168 | Daily duty tracking form for VIP escorts, striking force, prisoner escort, check post, cash escort, guard duties |
| Guard_Location | One of 22 fixed locations requiring guard duty |
| Striking_Force | Quick response teams (SF-I, SF-II) and CAR Stand By teams (I, II, III) |
| Rank | DCP, ACP, RPI, RSI, ARSI, AHC, APC |
| Rank_Hierarchy | DCP > ACP > RPI > RSI > ARSI > AHC > APC |
| Leave_Type | CL (Casual), CML (Casual Medical), EL (Earned), PL (Privilege) |
| Sanctioned_Strength | Officially approved personnel count (559 total) |
| Present_Strength | Actual personnel currently serving (572 total) |
| Data_Store | Mocked persistence layer using JSON data and LocalStorage |
| API_Gateway | Mocked service layer simulating backend API interactions |
| Notification_Service | Module for delivering alerts and updates |
| Audit_Log | Immutable record of all system actions |
| AI_Scheduler | Intelligent scheduling component for auto-assigning shifts |
| Mock_LLM_Service | Mocked AI service using predefined JSON patterns |
| Llama_Service | Real LLM integration service for AI conversations |
| Voice_Assistant | Voice interaction module using browser Web Speech API |
| Document_Parser | Service simulating AI extraction of shift rules from documents |
| RBAC_Service | Service enforcing role-based access control |
| Admin_User | User with 'admin' role (DCP level) |
| Supervisor_User | User with 'supervisor' role (ACP, RPI level) |
| Employee_User | User with 'employee' role (RSI, ARSI, AHC, APC level) |
| Adhoc_Request | On-demand shift assignment request outside regular scheduling |
| Schedule_Detail_Modal | Modal dialog displaying detailed schedule entry information |

---

## 3. User Authentication and Role-Based Access

### 3.1 Login and Session

1. THE WorkBoard_UI SHALL display a login page with username and password fields.
2. WHEN valid credentials are submitted, THE WorkBoard_UI SHALL authenticate against the Data_Store and redirect to the role-based dashboard.
3. WHEN invalid credentials are submitted, THE WorkBoard_UI SHALL display an error message without revealing which field is incorrect.
4. WHEN a user clicks logout, THE WorkBoard_UI SHALL clear the session and redirect to the login page.
5. THE WorkBoard_UI SHALL persist authentication state across browser refreshes using local storage.

### 3.2 Role-Based Navigation

6. WHILE authenticated as Admin_User, THE WorkBoard_UI SHALL display the full administrative navigation menu (configuration, scheduling, reporting, audit).
7. WHILE authenticated as Supervisor_User, THE WorkBoard_UI SHALL display team management, approval workflows, and limited reporting.
8. WHILE authenticated as Employee_User, THE WorkBoard_UI SHALL display personal schedule, request submission, and notifications.

### 3.3 RBAC — Rank-Based Personnel Management

9. THE RBAC_Service SHALL define the Rank_Hierarchy as: DCP > ACP > RPI > RSI > ARSI > AHC > APC.
10. WHEN an Admin_User accesses the Personnel_Manager, all add and edit controls SHALL be enabled.
11. WHEN a non-Admin_User accesses the Personnel_Manager, the "Add Personnel" button SHALL be disabled.
12. WHEN a Supervisor_User views a personnel record, the edit button SHALL be enabled only for subordinate personnel (lower rank).
13. WHEN an Employee_User accesses the Personnel_Manager, all edit buttons SHALL be disabled.
14. IF a user attempts to edit personnel of equal or higher rank, THE Personnel_Manager SHALL display an "Insufficient permissions" message.
15. THE RBAC_Service SHALL provide a function to determine edit permission based on rank comparison.
16. THE Personnel_Manager SHALL visually indicate which personnel records are editable by the current user.

---

## 4. Dashboard

### 4.1 Role-Based Dashboards

1. Admin_User dashboard: organization-wide shift coverage metrics, pending approvals count, system health indicators, personnel count by section (A: 74, B: 67, C: 277, PMT: 111, Recruit: 24), current rotation status, vacancy/extra personnel indicators.
2. Supervisor_User dashboard: team schedule overview, pending leave requests, shift swap requests requiring approval.
3. Employee_User dashboard: upcoming shifts, leave balance, recent notifications.
4. Dashboard widgets SHALL use a responsive grid layout adapting to screen sizes.
5. Clicking a dashboard metric SHALL navigate to the detailed view.
6. Dashboard data SHALL refresh every 60 seconds while the page is active.
7. THE dashboard SHALL display absent and suspended personnel counts, sick personnel count, current VIP escort and gunman assignments, current special duty assignments, PMT personnel count, and pending adhoc requests count.

---

## 5. Application Branding and Data Migration

1. THE WorkBoard_UI SHALL display "Karnataka State Police WorkBoard" as the application title in the header and browser tab.
2. THE WorkBoard_UI SHALL remove all existing mock employee data and replace with Karnataka Police personnel data structure.
3. THE Data_Store SHALL contain seed data representing the sanctioned strength of 559 personnel across all ranks.
4. THE Data_Store SHALL organize personnel into Section_A (74), Section_B (67), Section_C (277), PMT (111), and Recruit APCs (24).
5. WHEN the application initializes, THE Data_Store SHALL load Karnataka Police-specific departments, locations, and duty assignments.
6. THE WorkBoard_UI SHALL remove all unused code, imports, and dependencies.
7. THE WorkBoard_UI SHALL pass build verification without errors or warnings.

---

## 6. Organizational Hierarchy Management

1. THE WorkBoard_UI SHALL support the rank hierarchy: DCP, ACP, RPI, RSI, ARSI, AHC, APC.
2. Personnel display SHALL show rank, name, personnel ID, section assignment, and current duty status.
3. DCP and ACP positions SHALL be limited to 1 each.
4. THE WorkBoard_UI SHALL track sanctioned strength vs present strength for each rank.
5. Vacancy tracking: DCP-0, ACP-0, RPI-1, RSI-1, ARSI-2, AHC-3, APC-(-20) = 7 total.
6. Extra personnel tracking: RSI-8, ARSI-11.
7. Section_A view: all 74 fixed administrative duty positions with assigned personnel.
8. Section_B view: all 67 support function positions with assigned personnel.
9. Section_C view: all 5 platoons with current duty type assignments.
10. Support hierarchical department structures with parent-child relationships.
11. Display named personnel with designations (e.g., "SRI UMESH P, DCP").

---

## 7. Personnel Identification and Tracking

1. Unique personnel IDs in format: AHC-XXX or APC-XXXX (e.g., AHC-127, APC-2539).
2. Store personnel name along with ID (e.g., "AHC-190 NITHIN").
3. Search by ID, name, or rank.
4. Personnel ID displayed prominently in all duty assignment views.
5. Validate personnel ID uniqueness when adding new personnel.
6. Support ID formats for all ranks: RPI, RSI, ARSI, AHC, APC.

---

## 8. Section A — Fixed Administrative Duties

1. Display duty categories: Leadership, Chamber Sentry, Armoury, Dog Squad, ASC Team, Gunman, OOD.
2. Leadership: DCP, ACP, RPI, RSI (Duty Officer), ARSI (ADO).
3. Chamber Sentry: Commissioner Office, DCP CAR Office, DCP Law & Order, ACP CAR Office, DCP Crime & Traffic.
4. Armoury: 1 RSI, 2 ARSI, 2 APC.
5. Dog Squad: 1 ARSI, 5 AHC, 4 APC.
6. ASC Team: 1 ARSI, 7 AHC, 5 APC.
7. Gunman: 5 ARSI, 5 AHC, 4 APC.
8. OOD: BDDS Western Range, CCT Kudlu, FPB Mangaluru, Control Room, Bajpe Airport Liaison, Photographer, Consumer Disputes Office, Bugler.
9. Validate Section_A total does not exceed 74.

---

## 9. Section B — Support Functions

1. Display duty categories: Office Writers, Police Canteen, Police Lane, CAR Store, Building Maintenance, Band Team, QRT Team, CPT Team.
2. Office Writers/Computer Operators: 4 ARSI, 4 AHC, 3 APC.
3. Police Canteen: 1 RSI, 3 AHC, 1 APC.
4. Band Team: 7 AHC, 2 APC.
5. QRT Team: 1 RSI, 1 AHC, 10 APC.
6. CPT Team: 3 AHC, 20 APC.
7. Additional positions: Police Lane In-Charge, Arogya Bhagya Coordinator, COP Computer Wing, State Level Sports.
8. Validate Section_B total does not exceed 67.

---

## 10. Section C — Rotational Platoon Duties

1. 5 platoons with specific personnel assignments:
   - PLATOON-I: 56 personnel
   - PLATOON-II: 55 personnel
   - PLATOON-III: 55 personnel
   - PLATOON-IV: 56 personnel
   - PLATOON-V: 56 personnel
2. 5 duty types: Guard-I (56), Guard-II (55), Check Point (55), Prison/VIP Escort/Out (56), Striking Force/Help (56).
3. Each rotation cycle assigns each platoon to a different duty type.
4. 15-day rotation cycles.
5. Display complete rotation calendar with date ranges and platoon-to-duty mappings.
6. Rotation sequence: Guard-I → Guard-II → Check Point → Prison/VIP → Striking Force → Guard-I.
7. For any specific date, display which platoon is assigned to which duty type.
8. Validate Section_C total = 277 (34 AHC + 243 APC).
9. Support manual override of rotation assignments for special circumstances.
10. Track individual personnel IDs within each platoon.

---

## 11. Striking Force Team Management

1. Sub-teams: CC ROOM SF-I (9), CC ROOM SF-II (10), CAR STAND BY -I (10), CAR STAND BY -II (10), CAR STAND BY -III (11).
2. Display team name, required personnel count, and current assignments.
3. Track personnel assignments to specific sub-teams.
4. Validate adequate staffing from assigned platoon.
5. Display warning indicator if understaffed.

---

## 12. Guard Duty Location Management

1. Maintain 22 guard locations: Commissioner Office Guard (COP), District Treasury Guard, District Session Judge Bunglow Guard, bank currency chest guards (Canara, Karnataka, Axis, ICICI, Corporation/Union, Syndicate, Vijaya/Bank of Baroda), FSL Guard Mangaluru, Wireless Monitoring Station Guard, Wenlock Hospital Cell Guard, NCC (Pandeshwara, Aravinda, Yekkuru), VVPAT/EVM Guards, CAR Armoury Guard.
2. Display location name, required personnel count, and current assignment status.
3. Track guard duty shifts and allow assignment from appropriate platoon.
4. Display warning indicator if understaffed.
5. Support adding, editing, and deactivating guard locations.

---

## 13. VIP Escort and Gunman Assignments

1. VIP escort assignments:
   - H.H. Sri Vishvaprasannatirtha Swamiji: ARSI SRI DINESH GOWDA
   - Sri U.T. Khader Fareed (Hon'ble Speaker): ARSI SRI SUDHEERKUMAR, APC-0182
   - Paramapoojya Srimajjagadguru Shankaracharya: ARSI SRI ARUNKUMAR
2. Gunman assignments:
   - SRI DARSHAN H V, IAS, DC: AHC-190 NITHIN
   - SRI BASAVARAJ, DISTRICT SESSION JUDGE: ARSI SRI SHIVAKUMAR
   - COMPOL: ARSI SRI IBRAHIM, AHC-178 NITHESH
   - DCP L&O: ARSI SRI SURESH, SRI POORNESH T
   - DCP CRIME & TRAFFIC: AHC-2633, APC-2826
   - DCP CAR: AHC-2724, APC-2640
   - SRI RAKESH MALLI: APC-2525
   - SRI MITHUN RAI: ARSI SRI MOHAN BHANDARY
   - SRI U T KHADAR: AHC-2815
   - SRI IVAN D'SOUZA MLC: APC-0469
3. Capture VIP/official name, assigned personnel with ID, and duty duration.
4. Track VIP escort and gunman assignments separately from regular duty rotations.
5. Display current assignments on the dashboard.

---

## 14. Court Duty Assignments

1. Courts: II ADSJ COURT MANGALURU, VI ADSJ COURT MANGALURU, I ADDL SR CJ & CJM COURT MANGALURU, VI JMFC COURT MANGALURU, III JMFC COURT MANGALURU.
2. Capture court name, assigned personnel, and duty schedule.
3. Track as part of daily Form 168 duties.
4. Support adding, editing, and deactivating court duty locations.

---

## 15. Exam Evaluation Centre Guard Management

1. Centres: CANARA PU COLLEGE KODIALBAIL, ST. ALOYSSIUS PU COLLEGE KODIALBAIL, SM KUSHE PU COLLEGE ATTAVARA, BHARATHI PU COLLEGE MANGALURU, ST. AGNES PU COLLEGE.
2. Capture centre name, assigned personnel, and duty period.
3. Track as temporary duty assignments.
4. Support adding exam evaluation centres during exam periods.

---

## 16. Cash Escort Route Management

1. Routes: ICICI Bank Mangaluru → Canara Bank Bijai, Axis Bank Mangaluru → Axis Bank Bengaluru, Axis Bank Mangaluru → Axis Bank Mangaluru (internal).
2. Capture source bank, destination bank, assigned personnel, and escort schedule.
3. Track as part of daily Form 168 duties.
4. Support adding, editing, and deactivating cash escort routes.

---

## 17. Daily Duty Tracking (Form 168)

1. Provide a Form 168 interface for recording daily duty assignments.
2. VIP Escort duties: capture VIP name, escort personnel with ID, duty duration.
3. Check Post duties: three shifts — A (05:00–13:00), B (13:00–21:00), C (21:00–05:00).
4. Track Striking Force, Follow Up Party, RIV, B,B, and Check Point Duty assignments.
5. Track Prisoner Escort and Court Property duties.
6. Track Cash Escort duties with route details.
7. Track Court Duty assignments for all courts.
8. Track Exam Guard duties for PUC evaluation centres.
9. WHEN a duty is recorded, THE Audit_Log SHALL capture assignment details with timestamp and recording officer.
10. Generate daily duty summary reports in Form 168 format.

---

## 18. HQ Duty Assignment Management

1. HQ duty assignments:
   - CAR HQ: RPI SRI R V KAMATH
   - DUTY OFFICER/DUTY WRITERS: RSI SRI MANJUNATH H KAROSHI, AHC-2834, 2600
   - DCP CAR WRITER: ARSI SRI PRAMOD, AHC-2688
   - ACP WRITER: ARSI SRI SUDARSHANAKUMAR, APC-035
   - RPI WRITER: ARSI SRI UADAYAKUMARA SHETTY
   - COMPUTER OPERATOR/E-OFFICE: AHC-2645, APC-2788
   - ASST. DUTY OFFICER/ASST WRITERS: ARSI SRI JNANAPRAKASH, APC-2572, 2567
2. Capture position name, assigned personnel with ID, and duty schedule.
3. Track as part of Section A fixed duties.
4. Display current HQ duty assignments on the dashboard.

---

## 19. PMT (Personnel on Miscellaneous Training)

1. Track 111 PMT personnel separately: RPI-1, RSI-1, ARSI-20, AHC-66, APC-23.
2. Training programs: BASIC TRAINING PTS MYSURU (13-05-2025), BASIC TRAINING PTS DHARWAD (22-06-2025), PDMS TRAINING (03-03-2026), CCT TRG KOODLU (04-03-2026), 69-STATE LEVEL DUTY MEET TRAINING BENGALURU.
3. Capture training program name, location, start date, expected duration.
4. Display PMT personnel count on dashboard.
5. Track training completion and return to duty dates.
6. Generate training attendance reports.

---

## 20. Recruit APC Management

1. Track 24 Recruit APCs under basic training with IDs (APC-530, 536, 553, 556, 560, 561, 554, 564, 562, 538, 534, etc.).
2. Capture recruit ID, name, training start date, expected completion date.
3. Display recruit APC count separately from present strength.
4. Track training progress and graduation dates.
5. Support transitioning graduated recruits to regular APC status.

---

## 21. Leave Management

1. Leave types: CL (Casual), CML (Casual Medical), EL (Earned), PL (Privilege).
2. Display available balance for each leave type on submission.
3. Track detailed leave statements with date ranges (e.g., "30 DAYS EL FROM 16-02-2026 TO 17-03-2026").
4. Track Weekly Off with specific dates per personnel.
5. Track Permission separately from leave.
6. Check for duty conflicts on submission and display affected assignments.
7. On approval, automatically identify replacement candidates from the same section.
8. For Section_C, suggest replacements from the same platoon or duty type.
9. Generate leave reports by section and rank.
10. Maintain leave request history with status tracking.
11. Escalate to Admin_User when no suitable replacement is available.

---

## 22. Absent, Suspended, and Sick Personnel Tracking

1. Track absent personnel with start dates (e.g., APC-2821 VIJAYAKUMAR BUDIHAL: FROM 31-08-2025).
2. Track suspended personnel with dates (e.g., AHC-290 DEVIPRASAD: FROM 02-02-2026).
3. Track sick personnel with dates (e.g., APC-0104 MALLANNA: FROM 25-02-2026).
4. Capture personnel ID, name, status, and effective date.
5. Display counts on dashboard.
6. Automatically exclude absent, suspended, and sick personnel from duty assignments.
7. Support transitioning sick personnel back to active duty.
8. Generate reports showing history.

---

## 23. Special Duty Assignments

1. Special duties: SPL DUTY REPORT TO CEN PS, KABBADDI SELECTION TO DAVANAGERE, CP ESTATE IC, BAJPE AIRPORT OP DUTY, POLICE LANE BEAT DUTY, TAPPAL DUTY TO BENGALURU, PUC EXAM QUESTION PAPER ESCORT.
2. Capture duty name, assigned personnel, location, duty period.
3. Track separately from regular rotational duties.
4. Display current special duty assignments on dashboard.
5. Support adding, editing, and completing special duty assignments.

---

## 24. Vacancy and Extra Personnel Tracking

1. Track actual vacancy by rank: DCP-0, ACP-0, RPI-1, RSI-1, ARSI-2, AHC-3, APC-(-20) = 7 total.
2. Track extra personnel: RSI-8, ARSI-11.
3. Display on dashboard.
4. Calculate and display net staffing position (sanctioned vs present).
5. APC vacancy -20 indicates 20 extra personnel beyond sanctioned strength.
6. Generate staffing reports showing vacancy trends.

---


## 25. Schedule Calendar and Rotation View

1. Display schedules in day, week, and month calendar views.
2. Color-code duty types: Guard-I, Guard-II, Check Point, Prison/VIP, Striking Force with visible legend.
3. Display platoon rotation boundaries with 15-day cycle markers.
4. Clicking a calendar cell displays detailed duty assignments for that date.
5. Filter by section (A, B, C), platoon (P1–P5), and duty type.
6. Highlight current rotation period and upcoming rotation changes.
7. Show platoon-to-duty mapping for each 15-day period in Section_C calendar.
8. Support keyboard navigation for accessibility.
9. Highlight current day with distinct visual style.
10. Display personnel availability indicators (available, on-leave, sick).
11. Provide summary card showing today's active duties and personnel count.
12. Display rotation cycle info: cycle number, date range, next rotation date.
13. Show tooltip with duty summary on hover over schedule entries.

### 25.1 Enhanced Schedules Page

14. Rename "Rotation Schedule" to "Schedules" in navigation.
15. Display header with title "Schedules" and subtitle.
16. Provide view mode toggles: "Current Rotation", "Calendar View", "All Schedules".
17. Display schedule statistics: total scheduled duties, active personnel, upcoming rotations, pending adhoc requests.

### 25.2 Clickable Schedule Entries

18. Clicking a schedule entry opens a Schedule_Detail_Modal.
19. Modal displays: duty type, date, assigned platoon, personnel count, list of assigned personnel (names, ranks, contact), location, notes.
20. Modal provides button to navigate to full personnel list for that duty.
21. Close on click-outside or close button.

### 25.3 Schedule Assignment Creation

22. Admin_User and Supervisor_User see a "Create Assignment" button.
23. Assignment form: duty type, date/date range, personnel selection (individual/platoon/section), location, notes.
24. On valid submission, create assignment and display success message.
25. If assignment conflicts with existing schedules, display warning with conflict details.

---

## 26. Adhoc Duty Requests

1. Admin_User and Supervisor_User see an "Adhoc Request" button on the Schedules page.
2. Adhoc request form: personnel selection, duty type, date, location, reason (required).
3. On valid submission, create request with status "pending".
4. Send notification to assigned personnel.
5. Display "Adhoc Requests" tab/section showing all adhoc requests.
6. List displays: request date, assigned personnel, duty type, location, status, reason.
7. Filter by status: pending, accepted, declined, completed.
8. Accept action: pending → accepted.
9. Decline action: pending → declined (with reason recorded).
10. Complete action: accepted → completed.
11. Display total pending adhoc requests count in Schedules header.

---

## 27. Shift Swap Requests

1. Employee_User can initiate a swap request showing eligible colleagues by skills and availability.
2. Validate both employees meet qualification requirements for swapped shifts.
3. Notify target employee.
4. On mutual acceptance, route to Supervisor_User for final approval.
5. On approval, update both schedules and notify all parties.
6. Prevent swaps violating rotation rules.
7. Log all swap requests in Audit_Log.

---

## 28. Shift Configuration

1. Display shift types with name, start time, end time, duration.
2. Create shift type: name, start time, end time, break duration, color code.
3. Warn if shift type duration exceeds 12 hours (labor compliance).
4. Display shift patterns with name, rotation cycle, assigned shift types.
5. Create patterns with multiple shift types and rotation sequence.
6. Validate patterns don't create consecutive shifts exceeding 16 hours.
7. Show affected patterns/schedules when editing a shift type.
8. Support categories: regular, overtime, on-call, training.
9. Rotation rule types: round-robin, skill-based, seniority-based, preference-based.
10. Configure minimum rest hours between shifts.
11. Configure maximum consecutive working days per employee.
12. Support constraints for holidays, weekends, special dates.
13. Detect and display rule conflicts; require resolution.
14. Allow priority ranking of rotation rules.

---

## 29. AI-Powered Auto Scheduling

1. AI_Scheduler analyzes available employees, shift requirements, and rotation rules.
2. Generate proposed schedule maximizing coverage while respecting constraints.
3. Display conflicts with suggested resolutions when constraints can't all be satisfied.
4. Display generated schedule in calendar view with color-coded shift types.
5. Show fairness score indicating equitable distribution.
6. Consider employee preferences and historical assignment data.
7. On approval, save assignments and trigger notifications.
8. Allow manual adjustments before final approval.
9. Complete generation for up to 100 employees within 10 seconds.

---

## 30. Llama LLM Conversational Interface

### 30.1 Llama Service Integration

1. Provide method to send user messages and receive AI-generated responses.
2. Include system prompt defining assistant's role as Workboard shift management helper.
3. Support configurable API endpoint and model parameters (temperature, max tokens).
4. Graceful error message if Llama API is unreachable.
5. Log errors and return user-friendly fallback on API error.
6. Configurable request timeout.

### 30.2 Conversation Context Management

7. Maintain message history within current session.
8. Include Context_Window of previous messages when sending to Llama.
9. Configurable maximum Context_Window size.
10. Clear history on new chat.
11. Persist conversation history to session storage for page refresh recovery.
12. Restore history from session storage on page load.

### 30.3 Response Streaming

13. Display response tokens incrementally as they arrive.
14. Show visual indicator while streaming is in progress.
15. Finalize message and enable input when streaming completes.
16. Display partial response with error indicator if streaming is interrupted.
17. Support cancellation of in-progress responses.

### 30.4 Intent Recognition and Action Mapping

18. Parse Llama responses to identify actionable intents (view_schedule, create_leave_request, create_swap_request, view_team_schedule, view_reports).
19. Display clickable action buttons alongside response when intent is identified.
20. Action buttons styled as interactive UI elements.
21. Multiple actions displayed as a row/list of selectable buttons.
22. Extract relevant entities (dates, employee names, leave types).
23. Display only text response if no actionable intent identified.
24. Include structured output instructions in system prompt.
25. Action buttons include descriptive labels.

### 30.5 Action Execution

26. Clicking an action button performs the corresponding operation.
27. Support navigation actions routing to relevant pages.
28. Support data prefill actions opening forms with extracted values.
29. Display confirmation on success; error message with alternatives on failure.

### 30.6 Quick Action Suggestions

30. Render AI-presented options as clickable buttons.
31. Styled distinctly from regular text (pill buttons, cards, etc.).
32. Clicking sends that option as a user message.
33. Buttons have hover and active states.
34. Remain clickable until user sends a different message.
35. System prompt instructs model to format suggestions in parseable structure.
36. Numbered lists in AI response auto-converted to clickable buttons.

### 30.7 System Prompt Configuration

37. System prompt includes available actions and parameters.
38. Respond in helpful, concise manner for workplace communication.
39. Include current user's name and role for personalization.
40. Configurable without code changes.

### 30.8 Error Handling and Fallback

41. Fall back to existing mock LLM service if Llama API unavailable.
42. Display subtle indicator when in fallback mode.
43. Retry logic with exponential backoff for transient failures.
44. Temporarily disable API calls after multiple consecutive failures.
45. Log all errors with debugging context.

### 30.9 Voice Input Integration

46. Send voice transcript to Llama_Service for processing.
47. Existing voice assistant continues to function with Llama backend.
48. Optionally speak response using text-to-speech.
49. Display transcript for confirmation if voice confidence below threshold.

### 30.10 Loading Indicators

50. Animated typing indicator while waiting for response.
51. Streaming indicator distinct from typing indicator.
52. Disable input field while request in progress.
53. Re-enable and focus input on completion or failure.

### 30.11 Chat Panel Integration

54. ChatbotPanel uses same Llama_Service as HomePage.
55. Separate conversation histories for ChatbotPanel and HomePage.
56. Conversation context preserved independently when switching.
57. ChatbotPanel supports all same features (streaming, actions, voice).

---

## 31. Mocked LLM Chatbot (Fallback)

1. Chatbot panel accessible from all pages via floating action button.
2. Match user input against predefined patterns; return mocked responses from JSON data.
3. Support schedule inquiries, leave requests, shift swaps, workforce analytics.
4. Display confirmation dialog before executing actionable intents.
5. Maintain conversation context using session storage.
6. Provide suggestions and auto-complete from mocked intent patterns.
7. Simulate function calling by mapping intents to predefined actions.
8. Microphone button for voice input.
9. Web Speech API for speech-to-text; SpeechSynthesis for audio responses.
10. Request clarification if voice confidence below 80%.
11. Allow enable/disable voice features in settings.
12. Fallback response from JSON if no pattern matches.
13. Log all chatbot and voice interactions.
14. Load mocked responses from configurable JSON file.

---

## 32. Mocked Document Parsing

1. Accept PDF, DOCX, TXT, and image file uploads.
2. Return predefined extraction results from JSON based on document type/filename.
3. Display extracted rules in structured format with simulated confidence scores.
4. Return predefined ambiguous/conflicting rules with suggested clarifications.
5. Return predefined summary for complex rule patterns.
6. Simulate multi-language support.
7. Maintain upload history with extraction results.
8. Create rotation rules from confirmed extractions.
9. Support batch processing.
10. Load parsing responses from configurable JSON file.

---

## 33. Notification System

1. In-app notifications for schedule changes, request updates, system alerts.
2. Notification bell icon with unread count in header.
3. Dropdown list of recent notifications on bell click.
4. Categories: urgent, informational, action-required.
5. Navigate to relevant page on action-required notification click.
6. Mark as read individually or in bulk.
7. Per-user notification preferences configuration.
8. Toast notifications for real-time urgent alerts.

---

## 34. Reporting and Analytics

1. Report types: duty coverage, overtime, attendance, leave utilization, personnel distribution, rotation compliance, guard duty coverage, PMT/training attendance, vacancy/extra personnel, absent/suspended/sick personnel.
2. Filter by date range, department, location, employee, section, rank.
3. Display results in interactive charts and data tables.
4. Metrics: shift coverage %, overtime hours, absence rate.
5. Export in PDF, CSV, Excel.
6. Scheduled report generation and delivery.
7. Trend analysis comparing current period to historical data.
8. Compliance reports for labor regulation adherence.
9. Generate daily duty summary reports in Form 168 format.

---

## 35. Audit Trail

1. Record all create, update, delete operations with timestamp, user, and details.
2. Searchable audit log viewer for Admin_User.
3. Filter by date range, user, action type, entity type.
4. Capture before/after values for all data modifications.
5. Display complete change details in side panel on selection.
6. Support export for compliance reporting.
7. Audit log is immutable — protected from modification or deletion.
8. Highlight security-relevant actions (login attempts, permission changes).

---

## 36. Application Shell and Visual Design

1. Responsive layout: header, collapsible sidebar, main content area.
2. Sidebar state persists across sessions.
3. Mobile-optimized navigation drawer below 768px viewport.
4. Display current user name, role, and avatar in header.
5. Highlight active navigation item; support nested menus.
6. Breadcrumb navigation for deep hierarchies.
7. Keyboard shortcuts for common navigation.
8. Color palette: primary deep blue (#0078D4) with accent status colors.
9. Light and dark theme modes with preference persistence.
10. Consistent spacing, typography, component styling.
11. Smooth transitions and micro-animations.
12. Color contrast meets WCAG AA standards.
13. Status colors: green (success), amber (warning), red (error).

---

## 37. Reusable UI Components

### 37.1 Data Tables

1. Column sorting.
2. Multi-column filtering (text, date, select).
3. Pagination with configurable page sizes.
4. Row selection for bulk actions.
5. Column visibility toggling and reordering.
6. Loading and empty states.
7. Inline editing for authorized users.
8. Virtual scrolling for tables exceeding 1000 rows.

### 37.2 Forms

9. Text input, select, date picker, multi-select components.
10. Real-time validation feedback.
11. Specific error messages below fields on validation failure.
12. Block submission until all required fields valid.
13. Field dependencies (one field's options depend on another).
14. Autosave for long forms.
15. Confirmation dialog when navigating away from unsaved forms.

---

## 38. Mocked API Layer

1. Simulate all CRUD operations with configurable response delays.
2. Realistic seed data: 50+ employees, 5 departments, 3 locations.
3. Simulate error responses for testing.
4. Persist data changes in browser local storage.
5. Initialize with default seed data if no persisted data exists.
6. Log all simulated API calls to console.
7. Configurable latency to simulate network conditions.

---

## 39. Application Reliability and Performance

1. User-friendly error messages with retry option on API failure.
2. Error boundaries to prevent full application crashes.
3. Fallback UI with navigation options on page load failure.
4. Log errors to console with stack traces.
5. Preserve form data on submission failure; allow retry.
6. Network connectivity status and offline indicators.
7. Skeleton loaders during initial data fetching.
8. Lazy loading for route-based code splitting.
9. Progress indicator for long-running operations.
10. Cache frequently accessed data.
11. Initial dashboard render within 3 seconds.
12. Optimistic updates for improved perceived performance.
13. Debounce search and filter inputs.

---

## 40. Data Integrity and Code Quality

1. Validate all personnel assignments against rank and section constraints.
2. Validate rotation schedules — all platoons assigned, no overlaps.
3. Validate guard duty assignments meet minimum staffing requirements.
4. Validate personnel IDs for uniqueness and correct format.
5. Remove all unused imports, variables, dead code.
6. Pass TypeScript strict mode compilation without errors.
7. Implement proper error boundaries.
8. Display specific error messages for data validation errors.
9. Implement optimistic updates.
10. Cache frequently accessed data.

---

## 41. Preserved Application Features

1. Preserve existing authentication and login with role-based access.
2. Preserve dashboard with Karnataka Police metrics.
3. Preserve employee management with rank structure.
4. Preserve schedule viewing with rotation support.
5. Preserve leave request workflow with Karnataka Police leave types.
6. Preserve shift types and patterns configuration adapted for duty types.
7. Preserve locations management for guard duty locations.
8. Preserve reports with Karnataka Police-specific reports.
9. Preserve audit logging.
10. Preserve chatbot assistance.
11. Preserve settings page with user preferences.
12. Maintain responsive design for mobile and desktop.

---

## 42. DutyDetailPage Pagination Fix (Bugfix)

### Current Behavior (Defect)

1. DutyDetailPage renders all personnel rows from `allOnDuty` without pagination controls.
2. Large personnel lists render in a single unbounded table.
3. No pagination state exists (`currentPage`, `pageSize`).

### Expected Behavior

4. Display only a page-sized subset of `allOnDuty` rows with `Pagination` component below the table.
5. Default page size of 10; slice data to show current page's items.
6. Initialize with `currentPage = 1` and `pageSize = 10`.
7. Page change updates displayed personnel rows.
8. Page size change updates row count and resets to page 1.

### Regression Prevention

9. "Add Resource" modal continues to append new personnel and display them.
10. Page continues to fetch and display personnel data, stats cards, location map, duty header.
11. Empty `allOnDuty` renders table with no rows (Pagination shows "No records").
12. Back button navigation to schedule page continues to work.
