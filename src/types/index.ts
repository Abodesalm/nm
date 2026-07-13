// Money field used everywhere
export interface MoneyField {
  USD: number;
  SP: number;
  exchange: number;
}

// Settings
export interface Pack {
  _id: string;
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  price: MoneyField;
}

export interface Region {
  _id: string;
  name: string;
  mainRegion: string;
  mikrotik: {
    ip: string;
    port: number;
    username: string;
    password: string;
  };
}

export interface MainRegion {
  _id: string;
  name: string;
}

export interface Department {
  _id: string;
  name: string;
}

export interface Role {
  _id: string;
  name: string;
}

export interface Settings {
  defaultExchangeRate: number;
  autoSuspendDay: number;
  systemName: string;
  departments: Department[];
  roles: Role[];
  mainRegions: MainRegion[];
  regions: Region[];
  packs: Pack[];
}

// System User — login is by username; email optional
export interface SystemUser {
  _id: string;
  name: string;
  username: string;
  email?: string;
  isSuperAdmin: boolean;
  permissions: {
    section: string;
    permission: "none" | "readonly" | "full";
  }[];
  lastLogin: Date;
  createdAt: Date;
}

// Employee
export interface Employee {
  _id: string;
  id_num: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  photo?: string;
  cv?: string;
  role: string;
  department: string;
  salary: MoneyField;
  state: "active" | "inactive" | "on-leave";
  hireDate: Date;
  notes?: string;
  salaries: {
    _id: string;
    month: number;
    year: number;
    amount: MoneyField;
    reward: MoneyField;
    notes?: string;
    paidAt: Date;
  }[];
  loans: {
    _id: string;
    amount: MoneyField;
    state: "paid" | "unpaid";
    hidden: boolean;
    notes?: string;
    createdAt: Date;
  }[];
  bonuses: {
    _id: string;
    type: "reward" | "compensation";
    amount: MoneyField;
    reason?: string;
    date: Date;
    createdAt: Date;
  }[];
  hrPoints: {
    _id: string;
    points: number;
    reason?: string;
    date: Date;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Treasury entry — real money movement in/out of the company box
export interface TreasuryEntry {
  _id: string;
  type: "deposit" | "withdraw";
  source: "manual" | "invoice" | "loan";
  amount: MoneyField;
  description: string;
  notes?: string;
  relatedInvoice?: string | null;
  relatedLoan?: string | null;
  date: Date;
}

// Company loan (not employee loans)
export interface Loan {
  _id: string;
  direction: "on_us" | "for_us";
  party: string;
  amount: MoneyField;
  payments: {
    _id: string;
    amount: MoneyField;
    notes?: string;
    date: Date;
  }[];
  status: "open" | "paid";
  affectsTreasury: boolean;
  relatedStorageItem?: string | null;
  relatedActionId?: string | null;
  notes?: string;
  date: Date;
}

// Storage Item
export interface StorageItem {
  _id: string;
  name: string;
  category: string;
  unit: string;
  minQuantity: number;
  cost: MoneyField;
  notes?: string;
  isHidden: boolean;
  status: "in-stock" | "low-stock" | "out-of-stock";
  currentQuantity: number;
  borrowedQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

// Point
export interface Point {
  _id: string;
  point_number: number;
  name: string;
  mainRegion: string;
  region: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  providerPoint?: string;
  childPoints: string[];
  switches: number;
  totalPorts: number;
  usedPorts: number;
  freePorts: number;
  status: "online" | "offline" | "maintenance";
  notes?: string;
  createdAt: Date;
}

// Customer
export interface Customer {
  _id: string;
  customer_number: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  point: string;
  pppoe: {
    username: string;
    password: string;
  };
  status: "active" | "waiting" | "suspended" | "inactive";
  notes?: string;
  joinDate: Date;
  isDeleted: boolean;
  createdAt: Date;
}

// History Log
export interface HistoryLog {
  _id: string;
  section: string;
  type: string;
  performedBy: string;
  employee?: string;
  item?: string;
  point?: string;
  customer?: string;
  relatedId?: string;
  quantity?: number;
  goal_model?: string;
  goal_id?: string;
  notes?: string;
  date: Date;
}
