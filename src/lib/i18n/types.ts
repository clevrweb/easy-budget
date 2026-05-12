export interface Dict {
  locale: string;
  appTagline: string;

  auth: {
    signInTitle: string;
    registerTitle: string;
    email: string;
    password: string;
    confirmPassword: string;
    passwordMin: string;
    fullName: string;
    fullNamePlaceholder: string;
    preferredLanguage: string;
    english: string;
    spanish: string;
    signIn: string;
    createAccount: string;
    alreadyHaveAccount: string;
    signInLink: string;
    dontHaveAccount: string;
    createOneLink: string;
    passwordMismatch: string;
    checkEmail: string;
  };

  nav: {
    dashboard: string;
    home: string;
    bills: string;
    categories: string;
    groups: string;
    reports: string;
    settings: string;
    recurring: string;
    income: string;
    signOut: string;
    back: string;
  };

  dashboard: {
    title: string;
    summary: string;
    today: string;
    dueToday: string;
    dueThisWeek: string;
    dueThisMonth: string;
    paid: string;
    pending: string;
    overdue: string;
    noMonthBills: string;
    noMonthBillsHint: string;
  };

  bills: {
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    amountLabel: string;
    dueDateLabel: string;
    groupLabel: string;
    noGroup: string;
    statusLabel: string;
    paymentMethodLabel: string;
    categoryLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    addBill: string;
    addRecurringBill: string;
    saving: string;
    cancel: string;
    day: string;
    week: string;
    month: string;
    all: string;
    allTime: string;
    todayBtn: string;
    statusPrefix: string;
    pending: string;
    paid: string;
    overdue: string;
    pay: string;
    paidBtn: string;
    searchPlaceholder: string;
    byGroup: string;
    byDay: string;
    noBills: string;
    noBillsHint: string;
    ungrouped: string;
    billSingular: string;
    billPlural: string;
    confirmDelete: string;
    editBill: string;
    saveChanges: string;
  };

  recurring: {
    toggleLabel: string;
    recurrence: string;
    monthly: string;
    weekly: string;
    yearly: string;
    monthlyHint: string;
    weeklyHint: string;
    yearlyHint: string;
    dayOfMonth: string;
    dayOfMonthHint: string;
    ends: string;
    never: string;
    onDate: string;
    after: string;
    occurrences: string;
    savingNote: string;
    previewMonthlyPrefix: string;
    previewWeeklyPrefix: string;
    previewYearlyPrefix: string;
    useOrdinal: boolean;
    editTitle: string;
    editDesc: string;
    justThis: string;
    justThisEditDesc: string;
    entireSeries: string;
    entireSeriesEditDesc: string;
    deleteTitle: string;
    deleteDesc: string;
    justThisDeleteDesc: string;
    entireSeriesDeleteDesc: string;
    editEntireSeries: string;
    editSeriesSubtitle: string;
    startingFrom: string;
    regenerateHint: string;
    frequency: string;
    loading: string;
    updateSeries: string;
    neverShort: string;
  };

  categories: {
    title: string;
    addCategory: string;
    editCategory: string;
    nameLabel: string;
    colorLabel: string;
    noCategories: string;
    noCategoriesDesc: string;
    loadDefaults: string;
    loadDefaultsFull: string;
    saving: string;
    saveChanges: string;
    cancel: string;
    confirmDelete: string;
    billSingular: string;
    billPlural: string;
  };

  groups: {
    title: string;
    addGroup: string;
    editGroup: string;
    nameLabel: string;
    colorLabel: string;
    noGroups: string;
    noGroupsDesc: string;
    saving: string;
    saveChanges: string;
    cancel: string;
    confirmDelete: string;
    billSingular: string;
    billPlural: string;
  };

  reports: {
    title: string;
    monthlyTrend: string;
    last6Months: string;
    byCategory: string;
    categoryBreakdown: string;
    uncategorized: string;
  };

  settings: {
    title: string;
    notifications: string;
    billsDueToday: string;
    notifyMorning: string;
    notifyAt9: string;
    waitingPermission: string;
    settingUp: string;
    requiresHTTPS: string;
    notSupported: string;
    configMissing: string;
    permissionDenied: string;
    blocked: string;
    couldNotSave: string;
    subscriptionFailed: string;
    language: string;
    languageDesc: string;
    languageUpdated: string;
  };

  income: {
    title: string;
    addIncome: string;
    editIncome: string;
    nameLabel: string;
    namePlaceholder: string;
    amountLabel: string;
    frequencyLabel: string;
    startDateLabel: string;
    startDateHint: string;
    weekly: string;
    biweekly: string;
    twiceMonthly: string;
    monthly: string;
    weeklyHint: string;
    biweeklyHint: string;
    twiceMonthlyHint: string;
    monthlyHint: string;
    saving: string;
    saveChanges: string;
    cancel: string;
    confirmDelete: string;
    noIncome: string;
    noIncomeHint: string;
    incomeSectionTitle: string;
    billsSectionTitle: string;
    netLabel: string;
    perPaycheck: string;
    occurrences: string;
    noPeriodIncome: string;
  };

  common: {
    edit: string;
    delete: string;
    cancel: string;
    saving: string;
  };
}
