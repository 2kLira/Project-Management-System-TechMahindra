const supabase = require('../../supabase')

async function login(req, res) { 
  const {email_user, password} = req.body;

  const {data: data_login, error: error_login} = await supabase
    .from('users')
    .select('email, username, password_hash')
    .or(`email.eq.${email_user},username.eq.${email_user}`)
    .eq('password_hash', password)
    .limit(1)
    .single()

  if (error_login || !data_login) {
    return res.status(401).json({ message: 'User not found' });
  }

  res.status(200).json({ message: 'Login success', user: data_login }); 

}
async function register(req, res){
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
    return res.status(401).json({ message: 'Role not applied' });
  }

  res.status(201).json({ message: 'Usuario creado', user: data[0] }); 
}

module.exports = { login, register };