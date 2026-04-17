// Admin emails that bypass email verification. Developer status is
// determined by the user_roles table, not by email.
export const ADMIN_EMAILS = [
  "devuser@developer.com",
  "admin@admin.com",
  "circlomanagement@circloclub.com",
];

// Account auto-signed-in by the dev gate when a valid code is entered.
export const DEVELOPER_EMAIL = "devuser@developer.com";
