const express = require('express');
const supabase = require('./supabase')
const cors = require('cors');
const cookieParser = require('cookie-parser')


const authRoutes = require('./src/auth/auth.routes');
const projectRoutes = require('./src/projects/projects.routes');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());


app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

