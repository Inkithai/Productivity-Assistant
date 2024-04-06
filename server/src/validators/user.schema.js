const { z } = require('zod');

const profileUpdate = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80).optional(),
  timezone: z
    .string()
    .trim()
    .regex(/^[A-Za-z]+(\/[A-Za-z0-9_+\-]+)?$/, 'Not a valid IANA timezone')
    .optional(),
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
