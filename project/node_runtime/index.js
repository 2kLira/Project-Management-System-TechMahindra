const express = require('express');
const supabase = require('./supabase')
const cors = require('cors');

const authRoutes = require('./src/auth/auth.routes');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

