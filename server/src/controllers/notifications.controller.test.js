const request = require('supertest');

const app = require('../app');
const Notification = require('../models/notification.model');
const { authHeader } = require('../testing/db');
const { registerUser } = require('../testing/fixtures');

describe('notifications endpoints', () => {
  let auth;

  beforeEach(async () => {
    auth = await registerUser();
    await Notification.create([
      { userId: auth.user._id, type: 'reminder', title: 'First' },
      { userId: auth.user._id, type: 'system', title: 'Second', read: true },
    ]);
  });

  it('lists notifications with unread count', async () => {
    const res = await request(app).get('/api/notifications').set(authHeader(auth.token));

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
    expect(res.body.unreadCount).toBe(1);
  });

  it('filters to unread only', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .query({ unread: 'true' })
      .set(authHeader(auth.token));

    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].title).toBe('First');
  });

  it('marks a single notification as read', async () => {
    const list = await request(app).get('/api/notifications').set(authHeader(auth.token));
    const id = list.body.notifications[0]._id;

    const res = await request(app)
      .patch(`/api/notifications/${id}/read`)
      .set(authHeader(auth.token));

    expect(res.body.notification.read).toBe(true);
  });

  it('marks everything as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set(authHeader(auth.token));

    expect(res.body.updated).toBe(1);
    const unread = await Notification.countDocuments({ userId: auth.user._id, read: false });
    expect(unread).toBe(0);
  });

  it('does not read other users notifications', async () => {
    const other = await registerUser();
    const list = await request(app).get('/api/notifications').set(authHeader(auth.token));
    const id = list.body.notifications[0]._id;

    const res = await request(app)
      .patch(`/api/notifications/${id}/read`)
      .set(authHeader(other.token));

    expect(res.status).toBe(404);
  });
});
