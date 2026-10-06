// Centralized Access Email Configuration for Inkpen Platform
// Add any new authorized admin or manager email IDs to these lists:

export const ENROLLED_ADMIN_EMAILS = [
  'admin@inkpen.com',
  'admin@apex.com',
  'superadmin@inkpen.com',
  'kavyasn@gmail.com'
];

export const AUTHORIZED_MANAGER_EMAILS = [
  'jawahar@gmail.com',
  'hariprasath@gmail.com',
  'jawaharkumar@inkpen.com',
  'hariprasath@inkpen.com'
];

export function isAuthorizedAdminEmail(email) {
  if (!email) return false;
  return ENROLLED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function isAuthorizedManagerEmail(email) {
  if (!email) return false;
  return AUTHORIZED_MANAGER_EMAILS.includes(email.trim().toLowerCase());
}
