export const APP_COPY_DEFAULT_LOCALE = "en";

export const APP_COPY_DEFAULTS = {
  "tabs.dashboard": "Dashboard",
  "tabs.order": "Orders",
  "tabs.fineDine": "Fine Dine",
  "tabs.counterOrder": "Counter",
  "tabs.menu": "Menu",
  "tabs.subscription": "Plans",
  "tabs.account": "Account",

  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.loading": "Loading...",
  "common.tryAgain": "Try Again",
  "common.addUser": "Add User",
  "common.placeOrder": "Place order",
  "common.signIn": "Sign In",
  "common.back": "Back",
  "common.continue": "Continue",

  "auth.or": "or",
  "auth.needHelp": "Need help?",
  "auth.contactSupport": "Contact Support",
  "auth.contactSupportA11y": "Contact support on WhatsApp",

  "dashboard.title": "Dashboard",
  "dashboard.subtitle": "Overview of your restaurant and menu",
  "dashboard.loading": "Loading dashboard...",
  "dashboard.unavailable": "Dashboard unavailable",

  "orders.title": "Orders",
  "orders.subtitle": "Use tabs to switch between active and completed orders",
  "orders.loading": "Loading orders...",
  "orders.emptyInProgressTitle": "Nothing in progress",
  "orders.emptyInProgressBoard":
    "New tickets appear after a captain accepts a table order, or a guest pays.",
  "orders.emptyInProgressOrders": "Active orders will appear here.",
  "orders.emptyCompletedTitle": "Nothing completed yet",
  "orders.emptyCompletedBoard": "Completed tickets for today will appear here.",
  "orders.emptyCompletedOrders": "Completed orders will appear here.",

  "fineDine.title": "Fine Dine",
  "fineDine.subtitle": "Seat guests, accept orders, pay once at the end.",
  "fineDine.reservations": "Reservations",
  "fineDine.manageTables": "Manage tables",
  "fineDine.noTablesTitle": "No tables yet",
  "fineDine.noTablesSubtitle": "Owner can add tables from Manage tables.",
  "fineDine.makeTableFree": "Make table free",
  "fineDine.makeTableFreeConfirm":
    "Close the active session on {table} and mark it free? Unpaid items on the tab will be cleared.",
  "fineDine.generateBill": "Generate bill",
  "fineDine.placeOrder": "Place order",
  "fineDine.editTable": "Edit table details",
  "fineDine.openSession": "Open table session",
  "fineDine.markReserved": "Mark as reserved",
  "fineDine.markFree": "Mark as free",
  "fineDine.alerts": "Alerts",
  "fineDine.alertsSubtitle": "Seating codes and orders that need your accept, by table.",
  "fineDine.alertsEmptyTitle": "No pending alerts",
  "fineDine.alertsEmptyMessage":
    "New seating requests and guest orders will show up here with the table number.",
  "fineDine.seatingRequests": "Seating requests",
  "fineDine.ordersToAccept": "Orders to accept",
  "fineDine.acceptOrder": "Accept",
  "fineDine.confirmSeating": "Confirm",
  "fineDine.openTable": "Open table",
  "fineDine.guestWaiting": "Guest waiting",

  "menu.title": "Menu",
  "menu.subtitle": "Manage counters, categories, and items in one place.",
  "menu.loading": "Loading menu...",
  "menu.emptyItemsTitle": "No food items yet",
  "menu.emptyItemsNoCategory":
    "Create a category and counter first, then add dishes to your menu.",
  "menu.emptyItemsMessage": "Add your first dish with pricing, counter, and category details.",
  "menu.emptyFilterTitle": "No items match your filters",
  "menu.emptyFilterMessage": "Adjust search or filters, or add a new food item.",
  "menu.addFoodItem": "Add Food Item",
  "menu.addCategory": "Add Category",
  "menu.importFromPhoto": "Import from photo",

  "counter.title": "Counter Order",
  "counter.subtitle": "Place cash orders for walk-in customers",
  "counter.successSubtitle": "Order placed successfully",
  "counter.unavailableTitle": "Counter orders unavailable",
  "counter.unavailableMessage":
    "Only owners and managers can place counter orders on behalf of walk-in customers.",
  "counter.placeOrderCash": "Place order — Cash received",

  "account.title": "My Account",
  "account.subtitle": "Manage your profile and portal settings",
  "account.subtitleKitchen": "Your profile and account security",
  "account.usersEmptyTitle": "No users yet",
  "account.usersEmptyMessage": "Add team members to manage your portal.",

  "subscription.title": "Subscription",
  "subscription.subtitleActive": "Your subscription is active. Manage your coverage below.",
  "subscription.subtitleInactive": "Choose a plan to unlock coverage for your business.",
};

export const buildAppCopyRows = (entries = {}) => {
  const remote = entries && typeof entries === "object" && !Array.isArray(entries) ? entries : {};
  const keys = [...Object.keys(APP_COPY_DEFAULTS)];

  Object.keys(remote).forEach((key) => {
    if (key && !keys.includes(key)) {
      keys.push(key);
    }
  });

  return keys.map((key) => ({
    key,
    defaultValue: APP_COPY_DEFAULTS[key] || "",
    override: typeof remote[key] === "string" ? remote[key] : "",
  }));
};
