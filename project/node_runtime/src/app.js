const express = require('express');
const expressWs = require('express-ws')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./shared/errors/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/projects/projects.routes');
const userRoutes = require('./modules/users/users.routes');
const workItemsRoutes = require('./modules/work_items/work_items.routes');
const sprintRoutes = require('./modules/sprints/sprints.routes')
const SprintBoardRoutes = require('./modules/sprintBoard/sprintBoard.route')
const costsRoutes = require('./modules/costs/costs.routes')
const blockersRoutes = require('./modules/blockers/blockers.routes')
const suggestionsRoutes = require('./modules/suggestions/suggestions.routes')
const dashboardRoutes = require('./modules/dashboard/dashboard.routes')
const risksRoutes     = require('./modules/risks/risks.routes')
const auditRoutes     = require('./modules/audit/audit.routes')
const notificationsRoutes = require('./modules/notifications/notifications.routes')
const alertConfigRoutes   = require('./modules/alert_config/alert_config.routes')

const app = express();
expressWs(app)

app.use(express.json());
app.use(cors({
    origin: [process.env.FRONTED_API_URL || 'http://localhost:3000', process.env.REACT_APP_BACKEND_API_URL, process.env.REACT_APP_WS_API_URL ,  'http://localhost:3000', ],
    credentials: true,
}));


app.ws('/ws', (ws, req) => {
    console.log('client connected') 

    ws.on('message', (message) => {
        try{
            const mensaje = JSON.parse(message.toString()) 

            clients.forEach((client) => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify(mensaje))
                }
            })

        } catch(error){
            console.error(message.toString())
        }
    })

    ws.on('close', () => {
        console.log('client disconnected') 
    });

    ws.on('error', (err) => {
        console.error('Socket error:', err)
    })

    
})

app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/users', userRoutes);
app.use('/work-items', workItemsRoutes);
app.use('/sprints', sprintRoutes)
app.use('/sprintBoard', SprintBoardRoutes)
app.use('/costs', costsRoutes)
app.use('/blockers', blockersRoutes)
app.use('/suggestions', suggestionsRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/risks',     risksRoutes)
app.use('/audit',     auditRoutes)
app.use('/notifications', notificationsRoutes)
app.use('/projects/:id/alert-config', alertConfigRoutes)

app.use(errorHandler);

module.exports = app;