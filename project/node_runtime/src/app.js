const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./shared/errors/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/projects/projects.routes');
const userRoutes = require('./modules/users/users.routes');
const workItemsRoutes = require('./modules/work_items/work_items.routes');
const sprintRoutes = require('./modules/sprints/sprints.routes')

const app = express();

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/users', userRoutes);
app.use('/work-items', workItemsRoutes);
app.use('/sprints-consult', sprintRoutes)

app.use(errorHandler);

module.exports = app;