const { Router } = require("express");

const { getCalendarEventsController } = require('../controllers/calendar.controller');

const calendarRoutes = Router();

// All calendar routes will require authentication


// Route to get all calendar events (meetings and tasks)
// GET /api/calendar/events
calendarRoutes.get("/calendar-events", getCalendarEventsController);

module.exports = calendarRoutes;