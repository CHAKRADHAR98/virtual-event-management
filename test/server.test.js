process.env.NODE_ENV = 'test';

const tap = require('tap');
const supertest = require('supertest');
const app = require('../app');
const server = supertest(app);

const organizer = {
    name: 'Bruce Wayne',
    email: 'bruce@wayne.com',
    password: 'Gotham123',
    role: 'organizer',
};

const otherOrganizer = {
    name: 'Tony Stark',
    email: 'tony@stark.com',
    password: 'Iron123',
    role: 'organizer',
};

const attendee = {
    name: 'Clark Kent',
    email: 'clark@superman.com',
    password: 'Krypt()n8',
};

const mockEvent = {
    title: 'Node.js Meetup',
    description: 'An evening of talks on Node.js internals',
    date: '2099-12-01',
    time: '18:30',
};

let organizerToken = '';
let otherOrganizerToken = '';
let attendeeToken = '';
let eventId = 0;

const auth = (token) => ({ Authorization: `Bearer ${token}` });

tap.test('POST /register organizer', async (t) => {
    const response = await server.post('/register').send(organizer);
    t.equal(response.status, 201);
    t.equal(response.body.user.role, 'organizer');
    t.notOk(response.body.user.password);
    t.equal(response.body.emailSent, true);
    t.end();
});

tap.test('POST /register attendee defaults role to attendee', async (t) => {
    const response = await server.post('/register').send(attendee);
    t.equal(response.status, 201);
    t.equal(response.body.user.role, 'attendee');
    t.end();
});

tap.test('POST /register second organizer', async (t) => {
    const response = await server.post('/register').send(otherOrganizer);
    t.equal(response.status, 201);
    t.end();
});

tap.test('POST /register with missing email', async (t) => {
    const response = await server.post('/register').send({ name: 'No Email', password: 'secret123' });
    t.equal(response.status, 400);
    t.end();
});

tap.test('POST /register with invalid role', async (t) => {
    const response = await server.post('/register').send({ ...attendee, email: 'x@y.com', role: 'admin' });
    t.equal(response.status, 400);
    t.end();
});

tap.test('POST /register with duplicate email', async (t) => {
    const response = await server.post('/register').send(attendee);
    t.equal(response.status, 409);
    t.end();
});

tap.test('POST /login organizer', async (t) => {
    const response = await server.post('/login').send({ email: organizer.email, password: organizer.password });
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'token');
    organizerToken = response.body.token;
    t.end();
});

tap.test('POST /login attendee and second organizer', async (t) => {
    const a = await server.post('/login').send({ email: attendee.email, password: attendee.password });
    const o = await server.post('/login').send({ email: otherOrganizer.email, password: otherOrganizer.password });
    t.equal(a.status, 200);
    t.equal(o.status, 200);
    attendeeToken = a.body.token;
    otherOrganizerToken = o.body.token;
    t.end();
});

tap.test('POST /login with wrong password', async (t) => {
    const response = await server.post('/login').send({ email: organizer.email, password: 'wrongpassword' });
    t.equal(response.status, 401);
    t.end();
});

tap.test('GET /events without token', async (t) => {
    const response = await server.get('/events');
    t.equal(response.status, 401);
    t.end();
});

tap.test('GET /events with invalid token', async (t) => {
    const response = await server.get('/events').set(auth('not-a-real-token'));
    t.equal(response.status, 401);
    t.end();
});

tap.test('POST /events as organizer', async (t) => {
    const response = await server.post('/events').set(auth(organizerToken)).send(mockEvent);
    t.equal(response.status, 201);
    t.equal(response.body.event.title, mockEvent.title);
    t.same(response.body.event.participants, []);
    eventId = response.body.event.id;
    t.end();
});

tap.test('POST /events as attendee is forbidden', async (t) => {
    const response = await server.post('/events').set(auth(attendeeToken)).send(mockEvent);
    t.equal(response.status, 403);
    t.end();
});

tap.test('POST /events with invalid date and time', async (t) => {
    const response = await server.post('/events').set(auth(organizerToken)).send({
        ...mockEvent,
        date: '2099-02-30',
        time: '25:00',
    });
    t.equal(response.status, 400);
    t.equal(response.body.details.length, 2);
    t.end();
});

tap.test('POST /events with missing fields', async (t) => {
    const response = await server.post('/events').set(auth(organizerToken)).send({ title: 'Only title' });
    t.equal(response.status, 400);
    t.end();
});

tap.test('GET /events', async (t) => {
    const response = await server.get('/events').set(auth(attendeeToken));
    t.equal(response.status, 200);
    t.equal(response.body.events.length, 1);
    t.end();
});

tap.test('GET /events/:id', async (t) => {
    const response = await server.get(`/events/${eventId}`).set(auth(attendeeToken));
    t.equal(response.status, 200);
    t.equal(response.body.event.id, eventId);
    t.end();
});

tap.test('GET /events/:id not found', async (t) => {
    const response = await server.get('/events/9999').set(auth(attendeeToken));
    t.equal(response.status, 404);
    t.end();
});

tap.test('PUT /events/:id by owner', async (t) => {
    const response = await server.put(`/events/${eventId}`).set(auth(organizerToken)).send({ time: '19:00' });
    t.equal(response.status, 200);
    t.equal(response.body.event.time, '19:00');
    t.equal(response.body.event.title, mockEvent.title);
    t.end();
});

tap.test('PUT /events/:id by another organizer is forbidden', async (t) => {
    const response = await server.put(`/events/${eventId}`).set(auth(otherOrganizerToken)).send({ title: 'Hijacked' });
    t.equal(response.status, 403);
    t.end();
});

tap.test('PUT /events/:id by attendee is forbidden', async (t) => {
    const response = await server.put(`/events/${eventId}`).set(auth(attendeeToken)).send({ title: 'Hijacked' });
    t.equal(response.status, 403);
    t.end();
});

tap.test('PUT /events/:id with empty body', async (t) => {
    const response = await server.put(`/events/${eventId}`).set(auth(organizerToken)).send({});
    t.equal(response.status, 400);
    t.end();
});

tap.test('POST /events/:id/register as attendee', async (t) => {
    const response = await server.post(`/events/${eventId}/register`).set(auth(attendeeToken));
    t.equal(response.status, 201);
    t.equal(response.body.emailSent, true);
    t.equal(response.body.event.participantCount, 1);
    t.end();
});

tap.test('POST /events/:id/register twice', async (t) => {
    const response = await server.post(`/events/${eventId}/register`).set(auth(attendeeToken));
    t.equal(response.status, 409);
    t.end();
});

tap.test('POST /events/:id/register for missing event', async (t) => {
    const response = await server.post('/events/9999/register').set(auth(attendeeToken));
    t.equal(response.status, 404);
    t.end();
});

tap.test('GET /registrations', async (t) => {
    const response = await server.get('/registrations').set(auth(attendeeToken));
    t.equal(response.status, 200);
    t.equal(response.body.events.length, 1);
    t.equal(response.body.events[0].id, eventId);
    t.end();
});

tap.test('GET /events/:id/participants by owner', async (t) => {
    const response = await server.get(`/events/${eventId}/participants`).set(auth(organizerToken));
    t.equal(response.status, 200);
    t.equal(response.body.participants.length, 1);
    t.equal(response.body.participants[0].email, attendee.email);
    t.notOk(response.body.participants[0].password);
    t.end();
});

tap.test('GET /events/:id/participants by attendee is forbidden', async (t) => {
    const response = await server.get(`/events/${eventId}/participants`).set(auth(attendeeToken));
    t.equal(response.status, 403);
    t.end();
});

tap.test('DELETE /events/:id/register cancels registration', async (t) => {
    const response = await server.delete(`/events/${eventId}/register`).set(auth(attendeeToken));
    t.equal(response.status, 200);
    const after = await server.get('/registrations').set(auth(attendeeToken));
    t.equal(after.body.events.length, 0);
    t.end();
});

tap.test('DELETE /events/:id/register when not registered', async (t) => {
    const response = await server.delete(`/events/${eventId}/register`).set(auth(attendeeToken));
    t.equal(response.status, 404);
    t.end();
});

tap.test('DELETE /events/:id by another organizer is forbidden', async (t) => {
    const response = await server.delete(`/events/${eventId}`).set(auth(otherOrganizerToken));
    t.equal(response.status, 403);
    t.end();
});

tap.test('DELETE /events/:id by owner', async (t) => {
    const response = await server.delete(`/events/${eventId}`).set(auth(organizerToken));
    t.equal(response.status, 200);
    const after = await server.get(`/events/${eventId}`).set(auth(organizerToken));
    t.equal(after.status, 404);
    t.end();
});

tap.test('Unknown route returns 404', async (t) => {
    const response = await server.get('/nope');
    t.equal(response.status, 404);
    t.end();
});

tap.teardown(() => {
    process.exit(0);
});
