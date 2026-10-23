const ROLES = ['organizer', 'attendee'];

const users = [];
let nextId = 1;

const normalise = (email) => String(email).trim().toLowerCase();

const findByEmail = (email) => users.find((user) => user.email === normalise(email));

const findById = (id) => users.find((user) => user.id === id);

const create = ({ name, email, password, role }) => {
    const user = {
        id: nextId++,
        name: name.trim(),
        email: normalise(email),
        password,
        role: role || 'attendee',
        createdAt: new Date().toISOString(),
    };
    users.push(user);
    return user;
};

const toPublic = ({ id, name, email, role, createdAt }) => ({
    id,
    name,
    email,
    role,
    createdAt,
});

module.exports = { ROLES, users, findByEmail, findById, create, toPublic };
