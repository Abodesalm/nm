# NM System — Complete Planning Document

## Overview
A dashboard system to manage an internet company. Built with:
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + ShadCN UI
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Auth**: NextAuth.js
- **File Storage**: Cloudinary (photos, CVs, documents)
- **MikroTik Integration**: node-routeros
- **Map**: Leaflet + OpenStreetMap

## UI/UX Rules
- **Language**: Arabic (RTL) throughout the entire system
- **Fonts**: 2 fonts — one for titles, one for normal text (both Arabic-friendly)
- **Theme**: Dark/Light mode toggle, brand colors are orange/orange-red gradient (avoid pure red to not conflict with danger states)
- **Drawers**: Always use drawers for add/edit/view actions everywhere in the system
- **Pagination**: Default limit 10, options 10/25/50 on every table
- **Tables**: All tables have sort by clicking column header, hide/show columns dropdown (saved in localStorage), filters, search
- **Confirmation dialogs**: Required for all delete and critical actions
- **Money fields**: Every amount has {USD, SP, exchange} — SP 1 decimal, USD 2 decimals, auto-calculate 3rd when 2 are filled, default exchange rate from settings (editable per entry)

---

## Main Layout

### Sidebar
- Collapsible: expanded shows icon + text, collapsed shows icons only
- Brand: "NM System" text logo
- Navigation links for all 9 sections
- Hidden sections based on user permissions

### Topbar
- Search
- Notifications
- Theme toggle (dark/light)
- User avatar + menu (profile, logout)

### Sections
1. الموظفين (Employees)
2. التخزين (Storage)
3. السجل (History)
4. النقاط (Points)
5. الزبائن (Customers)
6. المشاكل (Problems)
7. المالية (Finance)
8. الوثائق (Documents)
9. الإعدادات (Settings)

---

## Settings Collection (Single Document)
```
{
  defaultExchangeRate: number,
  autoSuspendDay: number (1-28),
  systemName: string,
  departments: [{ _id, name }],
  roles: [{ _id, name }],
  mainRegions: [{ _id, name }],
  regions: [{
    _id, name, mainRegion,
    mikrotik: { ip, port, username, password }
  }],
  packs: [{
    _id, name,
    downloadSpeed, uploadSpeed,
    price: { USD, SP, exchange }
  }]
}
```

---

## Money Field Structure (Global)
Used everywhere there is a money amount:
```
{
  USD: number (2 decimals),
  SP: number (1 decimal),
  exchange: number (default from settings, saved at time of entry)
}
```
- When 2 fields filled → 3rd auto-calculates
- Exchange rate locked at time of saving (not affected by future settings changes)

---

## Section 1: Employees (الموظفين)

### Schema
```
{
  _id,
  id_num: number (unique),
  fullName: string,
  email: string,
  phone: string,
  address: string,
  photo: string (Cloudinary URL),
  cv: string (Cloudinary URL),
  role: string (from settings),
  department: string (from settings),
  salary: { USD, SP, exchange },
  state: 'active' | 'inactive' | 'on-leave',
  notes: string,
  absents: [{
    _id,
    date: Date,
    isAbsent: boolean,
    excused: boolean,
    reason: string,
    note: string,
    createdAt: Date
  }],
  salaries: [{
    _id,
    month: number,
    year: number,
    amount: { USD, SP, exchange },
    reward: { USD, SP, exchange },
    notes: string,
    paidAt: Date
  }],
  loans: [{
    _id,
    amount: { USD, SP, exchange },
    state: 'paid' | 'unpaid',
    notes: string,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Main Table
- Columns: id_num badge, photo (avatar, hideable), fullName, role, department, phone, salary, state
- Search: by fullName
- Filters: role, department
- Sortable: id_num, fullName, department, role, salary
- Hide/show columns (localStorage)
- Add button (top)
- Click row → Employee Profile Page
- 3-dot per row: edit, absents, salaries, loans, history, delete
- Pagination default 10

### 3-dot Actions (all open as Drawers)

#### Edit
- Form with all plain info fields
- Upload photo (Cloudinary) max 2MB
- Upload CV/PDF (Cloudinary) max 10MB
- Role and department are dynamic dropdowns from settings

#### Absents Drawer
- Stats at top: إجمالي الغيابات، غيابات بعذر، غيابات بدون عذر (for shown month)
- Calendar showing days of current month
- Navigate between months (prev/next buttons)
- Click a day → add/edit/delete absent
- Absent properties: date, isAbsent, excused, reason, note

#### Salaries Drawer
- Stats at top: إجمالي الرواتب المدفوعة، إجمالي المكافآت (for shown year)
- Grid of 12 months for current year
- Navigate between years
- Click a month → add salary (if not exists) or delete (if exists)
- Cannot add salary twice for same month
- Salary properties: amount{USD,SP,exchange}, reward{USD,SP,exchange}, month, year, notes
- Adding salary → creates history log (salary_added)
- Deleting salary → deletes its history log

#### Loans Drawer
- Stat at top: إجمالي السلف غير المدفوعة
- Table of loans with pagination
- Columns: amount, state, notes, date, actions
- Actions per row: delete, toggle paid/unpaid
- Add loan button at top
- Adding loan → creates history log (loan_added)
- Deleting loan → deletes its history log

#### History Drawer
- Shows history logs related to this employee
- Filter by type (salary_added, loan_added)
- Filter by date range
- Read only table
- Pagination default 10

#### Delete
- Confirmation dialog
- Hard delete (or soft — decide during build)

### Employee Profile Page
- Header: id_num badge, fullName, role, department, state badge, edit button
- Basic info: photo, email, phone, address, salary, notes, cv download
- Absents section: fully interactive (same as drawer)
- Salaries section: fully interactive (same as drawer)
- Loans section: fully interactive (same as drawer) with pagination
- Borrowed items section: items from storage currently in employee's possession

### File Upload Rules
- Photo: image, max 2MB, Cloudinary folder: nm-system/employees/photos/
- CV: PDF, max 10MB, Cloudinary folder: nm-system/employees/cvs/
- Naming: emp_{id_num}_{timestamp}

---

## Section 2: Storage (التخزين)

### Schema
```
{
  _id,
  name: string,
  category: string,
  unit: string,
  minQuantity: number,
  cost: { USD, SP, exchange },
  notes: string,
  isHidden: boolean,
  status: 'in-stock' | 'low-stock' | 'out-of-stock', // auto
  currentQuantity: number, // auto-calculated from actions
  borrowedQuantity: number, // auto-calculated from actions
  actions: [{
    _id,
    type: 'stock_in' | 'stock_out' | 'consume' | 'borrow' | 'return',
    quantity: number,
    employee: employeeId,
    goal_model: 'customers' | 'points' | 'employees' | null,
    goal_id: id | null,
    notes: string,
    date: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Status Auto-calculation
- currentQuantity = sum of all (+) actions - sum of all (-) actions
  - stock_in (+), return (+)
  - stock_out (-), consume (-), borrow (-)
- borrowedQuantity = sum of borrow - sum of return
- status:
  - currentQuantity = 0 → out-of-stock
  - currentQuantity <= minQuantity → low-stock
  - currentQuantity > minQuantity → in-stock

### Main Table
- Columns: name, category, unit, currentQuantity, borrowedQuantity, status, cost
- Search: by name
- Filters: category, status
- Sortable: name, currentQuantity, status, cost
- Hide/show columns (localStorage)
- Add button (top)
- "Show hidden items" toggle button
- Click row → Item Profile Page
- 3-dot per row: apply action, edit, hide
- Pagination default 10

### Apply Action Drawer
- Action type (radio): stock_in | stock_out | consume | borrow | return
- quantity
- employee (searchable dropdown)
- goal_model (dropdown: customers|points|employees)
- goal_id (dynamic searchable dropdown based on goal_model)
- notes
- date
- Creates history log on save

### Edit Drawer
- Edit plain info: name, category, unit, minQuantity, cost, notes

### History Log → Storage Action relationship
- Adding action → creates history log (relatedId = action._id)
- Deleting history log → removes action from item → quantities recalculate
- Deleting action from item page → deletes its history log
- Both require confirmation

### Point Equipment Auto-sync
- Action with goal_model:points → auto-adds to point equipment
- Deleting action/log → auto-removes from point equipment
- Deleting from point equipment → does NOT affect actions/logs

### Item Profile Page
- Header: name, status badge, category
- Basic info: unit, cost, minQuantity, notes
- Stats: currentQuantity, borrowedQuantity, status
- Actions log table with pagination and filters
  - Filter by type, employee, date range, goal

---

## Section 3: History (السجل)

### Schema
```
{
  _id,
  section: 'employees' | 'storage' | 'points' | 'customers' | ...,
  type: 
    // employees
    'salary_added' | 'loan_added' |
    // storage
    'stock_in' | 'stock_out' | 'consume' | 'borrow' | 'return' |
    // points
    'point_added' | 'point_deleted' |
    // customers
    'customer_added' | 'customer_suspended' | 'customer_restored' |
    'customer_deleted' | 'sub_added' | 'sub_deleted',
  performedBy: userId, // system user who did the action
  employee: employeeId | null,
  item: storageItemId | null,
  point: pointId | null,
  customer: customerId | null,
  relatedId: id, // related document id (salary, loan, action._id, etc.)
  quantity: number | null, // for storage actions
  goal_model: string | null,
  goal_id: id | null,
  notes: string | null,
  date: Date
}
```

### Rules
- Logs created ONLY on add actions
- No editing logs — delete and re-add
- Deleting log:
  - Employee logs → deletes related document (salary/loan)
  - Storage logs → removes action from item, quantities recalculate
  - Both require confirmation dialog
- Deleting related document → deletes its log + confirmation

### Main Page UI
- Quick filter buttons: الكل | موظفين | تخزين | نقاط | زبائن | ...
- Filters: date range (start/end), section, type
- Search: by employee, item, customer, point
- Hide/show columns dropdown
- Default visible columns: التاريخ، القسم، النوع، بواسطة، الموظف، العنصر، النقطة، الزبون، الكمية، الملاحظات
- Hidden by default: goal_model, goal_id, relatedId
- Sortable columns: date
- Delete button per row → confirmation dialog
- Read only (no clicking to navigate)
- Pagination default 10

---

## Section 4: Points (النقاط)

### Schema
```
{
  _id,
  point_number: number, // unique per main_region
  name: string,
  mainRegion: string (from settings),
  region: string (from settings),
  location: {
    address: string,
    lat: number,
    lng: number
  },
  providerPoint: pointId | null, // null = connects to central MikroTik
  childPoints: [pointId], // max 4
  employees: [employeeId], // informational only
  equipment: [{
    itemId: storageItemId,
    quantity: number
  }], // auto-managed from storage actions
  switches: number, // count of switches at this point
  totalPorts: number, // auto: (switches × 8) - (switches-1) × 2
  usedPorts: number, // auto: childPoints.length + customers.length + 1 (for provider)
  freePorts: number, // auto: totalPorts - usedPorts
  captivePortal: {
    hasRouter: boolean,
    // more details discussed later
  },
  status: 'online' | 'offline' | 'maintenance',
  notes: string,
  createdAt: Date
}
```

### Status Rules
- Switch-only points: manual status, changed via Problems section
- Router/captive portal points: auto-tracked via ping

### Port Calculation
- totalPorts = (switches × 8) - (switches - 1) × 2
- usedPorts = childPoints.length + customers.length + 1 (provider connection, except root)
- freePorts = totalPorts - usedPorts

### Main Points Page
- Accordion list of Main Regions (all open by default, collapsible)
- Each main region shows its normal regions as cards
- Region cards show: name, points count, customers count, online/offline count
- Click region → Region Page

### Region Page
- Back button to main points page
- Toggle between 3 views:

#### 1. Tree View
- Visual graph showing point connections
- Root: Central MikroTik → points hierarchy
- Hover point → popup: point_number, name, status, freePorts, customers count + actions
- Click → Point Profile Page
- Actions in hover popup: add point, add customer, edit, delete

#### 2. Table View
- Columns: point_number, name, status, totalPorts, freePorts, customers count, providerPoint
- Search, filter, sort, hide/show columns
- 3-dot per row: add point, add customer, edit, delete
- Click row → Point Profile Page
- Pagination default 10

#### 3. Geo Map View
- Leaflet + OpenStreetMap (free)
- Points as colored markers (🟢 online, 🔴 offline, 🟡 maintenance)
- Lines between connected points
- Hover marker → same popup as tree view
- Click marker → Point Profile Page

### Add Point
- From tree/map hover → provider point pre-filled
- From table button → enter provider point number → system finds it
- Validation: new provider must have < 4 children
- point_number unique per main_region

### Delete Point Rules
- Cannot delete if has child points
- Cannot delete if has customers
- Shows warning message if either condition exists

### Change Provider Point
- Validates new provider has < 4 children
- Point must stay in same main_region

### Point Profile Page
- Header: point_number badge, name, status badge, region, main_region, edit button
- Basic info: location address, employees assigned, notes, switches count
- Mini map showing exact location
- Ports summary: visual progress bar (used/total/free)
- Visual tree: provider point + children
- Equipment section (from storage actions)
- Customers list with pagination
- Back button

### History Logs for Points
- point_added
- point_deleted
- (customer logs handled in customers section)

### Add Point Form Fields
- point_number
- name
- mainRegion (dropdown from settings)
- region (dropdown filtered by mainRegion)
- location: address (text) + lat/lng (manual or map picker)
- providerPoint (number input → auto-resolve)
- employees (multi-select)
- switches (number, default 1)
- captivePortal.hasRouter (toggle)
- notes

---

## Section 5: Customers (الزبائن)

### Schema
```
{
  _id,
  customer_number: number, // unique per main_region
  name: string,
  phone: string,
  email: string,
  address: string,
  point: pointId,
  pppoe: {
    username: string,
    password: string
  },
  currentPack: {
    isCustom: boolean,
    packId: id | null,
    downloadSpeed: number,
    uploadSpeed: number,
    price: { USD, SP, exchange }
  }, // derived from current month subscription
  status: 'active' | 'waiting' | 'suspended' | 'inactive',
  notes: string,
  joinDate: Date,
  isDeleted: boolean, // soft delete
  subscriptions: [{
    _id,
    month: number,
    year: number,
    pack: {
      isCustom: boolean,
      packId: id | null,
      downloadSpeed: number,
      uploadSpeed: number,
      price: { USD, SP, exchange }
    },
    amount: { USD, SP, exchange },
    discount: {
      enabled: boolean,
      amount: { USD, SP, exchange }
    },
    finalAmount: { USD, SP, exchange },
    paidAt: Date,
    notes: string
  }],
  createdAt: Date
}
```

### Status Logic
- active: has paid sub for current month (PPPoE enabled, correct speed)
- waiting: no paid sub for current month, internet still ON
- suspended: no paid sub, internet OFF (PPPoE disabled on MikroTik)
- inactive: status is active but no active PPPoE session detected on MikroTik

### Status Auto-management (Cron Jobs)
- Month start → all customers without pre-paid sub → waiting
- Auto-suspend day (from settings) → all waiting → suspended (MikroTik PPPoE disabled)
- Pre-paid sub for future month → speed updates when that month starts
- On-demand MikroTik check (page load or refresh button) → detects inactive status

### MikroTik Integration per Customer
- Add customer → create PPPoE account on MikroTik (correct region's MikroTik)
- Change pack (add new sub) → update speed on MikroTik
- Suspend → disable PPPoE account on MikroTik (immediate)
- Restore → enable PPPoE account on MikroTik (immediate)
- Delete → disable PPPoE account on MikroTik (account kept but disabled)
- Month start cron → batch update speeds for pre-paid customers

### Subscription Rules
- Cannot add sub twice for same month
- Adding sub → creates history log (sub_added)
- Deleting sub → deletes its history log
- Sub calendar: 12 months per year, navigate between years (same as salaries)

### Discount Calculation (when adding mid-month sub)
- Auto-calculate: remaining days / total days in month × full price
- Shows suggestion to user (editable)
- User confirms with breakdown shown
- finalAmount saved

### Main Table
- Columns: customer_number, name, phone, point, pack, status, joinDate
- Search: by name
- Filters: status, region, main_region, pack
- Sortable: customer_number, name, status, joinDate
- Hide/show columns (localStorage)
- Add button (top)
- Soft deleted customers hidden (no toggle to show them)
- Multi-select for bulk: delete, suspend/restore
- Refresh button → triggers MikroTik PPPoE session check
- 3-dot per row: edit, toggle suspend/restore, subscriptions history, delete
- Click row → Customer Profile Page
- Pagination default 10

### Add Customer
- From main customers page button
- From points section (provider point pre-filled)
- Form: name, phone, email, address, point, pppoe{username,password}, pack selection
- Pack: dropdown from settings packs OR toggle "حزمة مخصصة" → manual speed+price entry
- On save → creates PPPoE on MikroTik + history log (customer_added)

### Customer Profile Page
- Header: customer_number badge, name, status badge, point, edit button, suspend/restore button
- Basic info: phone, email, address, PPPoE username, joinDate, notes
- Current pack info
- Subscriptions section: fully interactive calendar (12 months/year, navigate years)
- Stats: total paid this year, current month status
- Refresh button for MikroTik status check

### History Logs for Customers
- customer_added
- customer_suspended
- customer_restored
- customer_deleted
- sub_added
- sub_deleted

---

## Section 6: Problems (المشاكل)
*(To be discussed and built later)*

---

## Section 7: Finance (المالية)
*(To be discussed and built later)*

---

## Section 8: Documents (الوثائق)
*(To be discussed and built later)*

---

## Section 9: Settings (الإعدادات)

### Layout
Sidebar with categories:
- عام (General)
- المناطق (Regions)
- الموظفين (HR)
- الزبائن (Customers)
- المستخدمين (System Users) — super admin only
- المظهر (Appearance)

### General Settings
- Default exchange rate
- Auto-suspend day (1-28)
- System name

### Regions Settings
- Main Regions CRUD (drawer)
- Regions CRUD (drawer): name, mainRegion, mikrotik{ip,port,username,password}

### HR Settings
- Departments CRUD (drawer)
- Roles CRUD (drawer)

### Customers Settings
- Packs CRUD (drawer): name, downloadSpeed, uploadSpeed, price{USD,SP,exchange}

### Appearance
- Dark/Light mode toggle

---

## System Users

### Schema
```
{
  _id,
  name: string,
  email: string,
  password: string (hashed, min 8 chars, letters+numbers),
  isSuperAdmin: boolean,
  permissions: [{
    section: 'employees'|'storage'|'history'|'points'|
             'customers'|'problems'|'finance'|'documents'|'settings',
    permission: 'none' | 'readonly' | 'full'
  }],
  sessions: [{
    _id,
    device: string,
    browser: string,
    lastActivity: Date,
    createdAt: Date
  }],
  lastLogin: Date,
  createdAt: Date
}
```

### Permission Rules
- none → section completely hidden from sidebar + route protected (middleware blocks URL access)
- readonly → can view only, no add/edit/delete
- full → full access
- Super admin → access to everything including users management
- Only super admin can manage system users
- No one else has access to users management

### Super Admin Rules
- One special account (created on first system setup)
- Full access to everything
- Can view all active sessions for any user
- Can force logout any session (single or all)
- Can reset any user's password
- Cannot delete himself

### User Profile Page (accessible by any logged-in user)
- Edit info: name, email
- Change password (separate form): current password, new password, confirm
- Cannot edit own permissions
- No photo

### Sessions Management (super admin only, in users table)
- Per user: active sessions list
- Each session: device, browser, last activity, force logout button
- Logout all sessions button per user

### Users Table (super admin only)
- Columns: name, email, lastLogin, active sessions count, permissions summary
- Add user (drawer): name, email, password, permissions per section
- Edit permissions (drawer)
- Reset password (drawer)
- Delete user (confirmation, cannot delete super admin)

---

## Authentication & Security

### Login Page
- Email + password
- No failed attempts locking
- Sessions never expire automatically

### Password Rules
- Minimum 8 characters
- Must contain letters AND numbers
- No special character requirement

### Password Reset
- Only super admin can reset any user's password
- No email reset (local system)
- No "change on first login" requirement

### Multiple Devices
- Same user can be logged in from multiple devices simultaneously
- All sessions visible to super admin

---

## Global UI Patterns

### Tables (all tables in system)
- Sort by clicking column header (not all columns sortable)
- Hide/show columns from dropdown checklist (saved in localStorage)
- Filters bar
- Search input
- Pagination: default 10, options 10/25/50
- Multi-select where applicable

### Drawers (used everywhere for add/edit/view)
- Slide in from right
- Close button + backdrop click to close
- Confirmation if unsaved changes

### Confirmation Dialogs
- Required for: all deletes, suspend/restore, any action with consequences
- Show clear description of what will happen

### Money Input Fields
- 3 inputs: USD, SP, exchange
- Auto-calculate 3rd when 2 filled
- Default exchange from settings (editable per entry)
- SP: 1 decimal place
- USD: 2 decimal places

### Status Badges
- Color coded: green (active/online), yellow (waiting), red (suspended/offline), blue (inactive), orange (maintenance)

### File Uploads (Cloudinary)
- Photos: max 2MB, images only
- CVs/Documents: max 10MB, PDF
- Folder structure: nm-system/{section}/{type}/

---

## Cron Jobs (Scheduled Tasks)
1. **Month start (1st of each month, 00:00)**:
   - Set all customers without pre-paid sub → waiting
   - Apply pre-paid subs speeds on MikroTik for current month

2. **Auto-suspend day (configured in settings, 00:00)**:
   - All waiting customers → suspended
   - Disable PPPoE accounts on MikroTik (batch, per region MikroTik)

---

## MikroTik Integration Summary
- Package: node-routeros
- One MikroTik per region (credentials stored in settings)
- Connection: server → MikroTik API (over internet, always accessible)
- PPPoE management: create, enable, disable, delete, update speed
- Status check: on-demand (page load / refresh button)
- Check method: active PPPoE sessions list

---

## File Structure
```
nm-system/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (overview)
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── storage/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── history/page.tsx
│   │   ├── points/
│   │   │   ├── page.tsx
│   │   │   ├── region/[id]/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── problems/page.tsx
│   │   ├── finance/page.tsx
│   │   ├── documents/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── general/page.tsx
│   │       ├── regions/page.tsx
│   │       ├── hr/page.tsx
│   │       ├── customers/page.tsx
│   │       ├── users/page.tsx
│   │       └── appearance/page.tsx
│   └── api/ (all API routes)
├── components/
│   ├── ui/ (ShadCN)
│   ├── layout/ (Sidebar, Topbar, ThemeToggle)
│   ├── employees/
│   ├── storage/
│   ├── history/
│   ├── points/
│   ├── customers/
│   ├── settings/
│   └── shared/ (DataTable, MoneyInput, StatusBadge, ConfirmDialog, etc.)
├── lib/
│   ├── db/mongoose.ts
│   ├── db/models/
│   ├── auth.ts
│   ├── mikrotik.ts
│   ├── cloudinary.ts
│   ├── cron.ts
│   └── utils.ts
├── hooks/
├── types/
├── middleware.ts
└── ...config files
```

---

## Sections To Be Discussed Later
- Problems (المشاكل)
- Finance (المالية)
- Documents (الوثائق)
- Captive Portal management (under Points)

These sections will be discussed and built after the first batch of sections is complete.
