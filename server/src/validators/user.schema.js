const { z } = require('zod');

const TIMEZONE_AREAS = [
  'Africa',
  'America',
  'Antarctica',
  'Asia',
  'Atlantic',
  'Australia',
  'Europe',
  'Indian',
  'Pacific',
  'Etc',
].join('|');

const TIMEZONE_PATTERN = new RegExp(`^(${TIMEZONE_AREAS})\\/[A-Za-z0-9_+\\-]+$|^UTC$`);

const profileUpdate = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80).optional(),
  timezone: z.string().trim().regex(TIMEZONE_PATTERN, 'Not a valid IANA timezone').optional(),
});

const passwordChange = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(100),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different',
    path: ['newPassword'],
  });

module.exports = { profileUpdate, passwordChange };
