const express = require('express');
const eventController = require('../controllers/eventController');
const { authenticate, authorizeRoles } = require('../middlewares/auth');
const { validateCreateEvent, validateUpdateEvent } = require('../middlewares/validateEvent');

const router = express.Router();
const organizerOnly = authorizeRoles('organizer');

router.use(authenticate);

router.get('/', eventController.listEvents);
router.post('/', organizerOnly, validateCreateEvent, eventController.createEvent);
router.get('/:id', eventController.getEvent);
router.put('/:id', organizerOnly, validateUpdateEvent, eventController.updateEvent);
router.delete('/:id', organizerOnly, eventController.deleteEvent);

router.get('/:id/participants', organizerOnly, eventController.listParticipants);
router.post('/:id/register', eventController.registerForEvent);
router.delete('/:id/register', eventController.cancelRegistration);

module.exports = router;
