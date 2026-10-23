const events = [];
let nextId = 1;

const findAll = () => events;

const findById = (id) => events.find((event) => event.id === id);

const findByParticipant = (userId) => events.filter((event) => event.participants.includes(userId));

const create = ({ title, description, date, time, organizerId }) => {
    const now = new Date().toISOString();
    const event = {
        id: nextId++,
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        organizerId,
        participants: [],
        createdAt: now,
        updatedAt: now,
    };
    events.push(event);
    return event;
};

const update = (event, changes) => {
    ['title', 'description'].forEach((field) => {
        if (changes[field] !== undefined) {
            event[field] = changes[field].trim();
        }
    });
    ['date', 'time'].forEach((field) => {
        if (changes[field] !== undefined) {
            event[field] = changes[field];
        }
    });
    event.updatedAt = new Date().toISOString();
    return event;
};

const remove = (id) => {
    const index = events.findIndex((event) => event.id === id);
    if (index === -1) {
        return false;
    }
    events.splice(index, 1);
    return true;
};

const addParticipant = (event, userId) => {
    event.participants.push(userId);
    return event;
};

const removeParticipant = (event, userId) => {
    event.participants = event.participants.filter((id) => id !== userId);
    return event;
};

const toPublic = (event) => ({
    ...event,
    participants: [...event.participants],
    participantCount: event.participants.length,
});

module.exports = {
    events,
    findAll,
    findById,
    findByParticipant,
    create,
    update,
    remove,
    addParticipant,
    removeParticipant,
    toPublic,
};
