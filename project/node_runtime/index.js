const express = require('express');
const supabase = require('./supabase')

const app = express();
app.use(express.json())

app.get('/check-table', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id_user')
    .limit(1)

  if (error) return res.status(500).json({ exists: false, error: error.message })
  res.json({ exists: true, message: "Existe tabla users y id_user" })
})

app.use((req, res) => {
    res.redirect('/check-table');;
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});