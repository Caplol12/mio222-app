export const ADMIN_EMAILS = [
  'montill22k@gmail.com'
];

export const isAdmin = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
