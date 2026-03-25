const express = require('express');
const supabase = require('./supabase')
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/check-table', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id_user')
    .limit(1)

  if (error) return res.status(500).json({ exists: false, error: error.message })
  res.json({ exists: true, message: "Existe tabla users y id_user" })
})

app.post('/register', async(req, res) =>{
  const {email, username, password} = req.body

  const {data, error} = await supabase
    .from('users')
    .insert({email: email, username: username, password_hash: password})
    .select();

  if (error) {
    console.error(error);
    return;
  }

  const { error: roleError } = await supabase
    .from('role')
    .insert({
      id_user: data[0].id_user,
      status: 'viewer'
    });

  if (roleError) {
    console.error('Error asignando rol:', roleError);
  }

  res.status(201).json({ message: 'Usuario creado', user: data[0] }); 
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});