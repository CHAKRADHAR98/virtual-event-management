# Virtual Event Management API

A RESTful backend for a virtual event management platform, built with
**Node.js**, **Express.js**, **bcrypt**, **JWT**, and **Nodemailer**. Users
register as organizers or attendees, organizers manage events, and attendees
register for events and receive a confirmation email.

All data is kept in memory (arrays and objects), so it resets when the server
restarts.

### Features

- **Registration and login** with bcrypt-hashed passwords and JWT tokens
- **Two roles**: `organizer` and `attendee` (default)
- **Event CRUD** with title, description, date, time, and participant list
- **Role-based authorization**: only organizers can create events, and only the
  organizer who created an event can update or delete it
- **Event registration**: any logged-in user can register for an event, cancel
  it, and list the events they are registered for
- **Participant list** for the event's organizer
- **Email notifications** on account creation and on event registration, sent
  with async/await
- **Input validation** reporting all problems at once
- **Centralised error handling** with consistent JSON errors

### Tech stack

| | |
| --- | --- |
| Runtime | Node.js (>= 18) |
| Framework | Express.js 4 |
| Password hashing | bcrypt (10 salt rounds) |
| Tokens | jsonwebtoken |
| Email | Nodemailer |
| Config | dotenv |
| Storage | In-memory |
| Testing | tap + supertest |

---

## Setup instructions

**Prerequisites:** Node.js 18 or higher.

```bash
git clone <your-repository-url>
cd virtual-event-management
npm install
cp .env.example .env
npm start
```

You should see:

```
Server is listening on 3000
```

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port the server listens on |
| `JWT_SECRET` | dev-only fallback | Secret used to sign tokens |
| `JWT_EXPIRES_IN` | `1h` | Token lifetime |
| `SMTP_HOST` | empty | SMTP server. Leave empty to log emails to the console instead of sending them |
| `SMTP_PORT` | `587` | SMTP port (`465` uses TLS) |
| `SMTP_USER` / `SMTP_PASS` | empty | SMTP credentials |
| `MAIL_FROM` | `Virtual Events <no-reply@virtual-events.local>` | Sender address |

To send real emails, set the SMTP values. A free test inbox from
[Ethereal](https://ethereal.email) or [Mailtrap](https://mailtrap.io) works
well. With no `SMTP_HOST`, each email is printed as a line like:

```
[email] to=clark@superman.com subject="You are registered for Node.js Meetup"
```

If sending an email fails, the request still succeeds and the response has
`"emailSent": false`.

---

## API reference

All `/events` and `/registrations` routes need the header
`Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/register` | Public | Create an account |
| POST | `/login` | Public | Log in and get a token |
| GET | `/events` | Logged in | List all events |
| GET | `/events/:id` | Logged in | Get one event |
| POST | `/events` | Organizer | Create an event |
| PUT | `/events/:id` | Event's organizer | Update an event |
| DELETE | `/events/:id` | Event's organizer | Delete an event |
| GET | `/events/:id/participants` | Event's organizer | List registered users |
| POST | `/events/:id/register` | Logged in | Register for an event |
| DELETE | `/events/:id/register` | Logged in | Cancel a registration |
| GET | `/registrations` | Logged in | List my registered events |

### `POST /register`

```json
{
  "name": "Bruce Wayne",
  "email": "bruce@wayne.com",
  "password": "Gotham123",
  "role": "organizer"
}
```

`role` is optional and defaults to `attendee`. Response `201`:

```json
{
  "message": "User registered successfully",
  "user": { "id": 1, "name": "Bruce Wayne", "email": "bruce@wayne.com", "role": "organizer", "createdAt": "..." },
  "emailSent": true
}
```

### `POST /login`

```json
{ "email": "bruce@wayne.com", "password": "Gotham123" }
```

Response `200`:

```json
{ "token": "eyJhbGciOi...", "user": { "id": 1, "name": "Bruce Wayne", "role": "organizer" } }
```

### `POST /events`

```json
{
  "title": "Node.js Meetup",
  "description": "An evening of talks on Node.js internals",
  "date": "2099-12-01",
  "time": "18:30"
}
```

Response `201`:

```json
{
  "message": "Event created successfully",
  "event": {
    "id": 1,
    "title": "Node.js Meetup",
    "description": "An evening of talks on Node.js internals",
    "date": "2099-12-01",
    "time": "18:30",
    "organizerId": 1,
    "participants": [],
    "participantCount": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### `PUT /events/:id`

Send any of `title`, `description`, `date`, `time`. Fields you leave out stay
the same.

```json
{ "time": "19:00" }
```

### `POST /events/:id/register`

No body. Adds the logged-in user to the event and sends a confirmation email.
Response `201`:

```json
{ "message": "Registered for event successfully", "event": { "...": "..." }, "emailSent": true }
```

### `GET /registrations`

```json
{ "events": [ { "id": 1, "title": "Node.js Meetup", "...": "..." } ] }
```

---

## Validation rules

| Field | Rule |
| --- | --- |
| `name` | Required, non-empty string |
| `email` | Required, valid email, unique (case-insensitive) |
| `password` | Required, at least 6 characters |
| `role` | Optional, `organizer` or `attendee` |
| `title`, `description` | Non-empty strings |
| `date` | Real calendar date in `YYYY-MM-DD` |
| `time` | 24-hour `HH:MM` |

## Error handling

Every error returns JSON in the same shape:

```json
{ "error": "Invalid event payload", "details": ["time must be in 24-hour HH:MM format"] }
```

| Status | When |
| --- | --- |
| 400 | Invalid body or malformed JSON |
| 401 | Missing, invalid, or expired token, or wrong login details |
| 403 | Role or ownership check failed |
| 404 | Event or route not found, or not registered when cancelling |
| 409 | Email already used, or already registered for the event |
| 500 | Unexpected server error |

---

## Project structure

```
virtual-event-management/
├── app.js
├── config/index.js
├── controllers/
│   ├── authController.js
│   └── eventController.js
├── middlewares/
│   ├── auth.js
│   ├── errorHandler.js
│   ├── validateEvent.js
│   └── validateUser.js
├── models/
│   ├── eventModel.js
│   └── userModel.js
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── registrationRoutes.js
├── services/emailService.js
└── test/server.test.js
```

---

## Testing

```bash
npm run test
```

The suite covers registration, login, role and ownership checks, event CRUD,
validation, event registration and cancellation, and email notifications.

```
# { total: 55, pass: 55 }
```

### Quick check with curl

```bash
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" \
  -d '{"name":"Bruce","email":"bruce@wayne.com","password":"Gotham123","role":"organizer"}'

TOKEN=$(curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" \
  -d '{"email":"bruce@wayne.com","password":"Gotham123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -X POST http://localhost:3000/events -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Node.js Meetup","description":"Talks on Node.js","date":"2099-12-01","time":"18:30"}'

curl -X POST http://localhost:3000/events/1/register -H "Authorization: Bearer $TOKEN"

curl http://localhost:3000/registrations -H "Authorization: Bearer $TOKEN"
```

## Notes and limitations

- Data is in memory and is lost on restart.
- IDs are auto-incrementing integers.
- Deleting an event also removes its registrations.
