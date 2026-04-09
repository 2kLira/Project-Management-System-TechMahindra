const supabase = require('../../supabase')
const argon2 = require('argon2')
const jwt = require('jsonwebtoken')

const secretKey = process.env.JWT_SECRET;

async function login(req, res) { 
  try{
    const {email_user, password} = req.body;

    const {data: data_login, error: error_login} = await supabase
      .from('users')
      .select('id_user, email, username, password_hash')
      .or(`email.eq.${email_user},username.eq.${email_user}`)
      .limit(1)
      .single()

    if (error_login || !data_login) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (await argon2.verify(data_login.password_hash, password)){
      const token = jwt.sign({ id: data_login.id_user }, secretKey, { expiresIn: "1h" })
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        maxAge: 3600000,
        sameSite: 'lax'
      })

      const { data: roleData } = await supabase
        .from('role')
        .select('status')
        .eq('id_user', data_login.id_user)
        .single();

      return res.status(200).json({
        message: 'Login success',
        id_user: data_login.id_user,
        username: data_login.username,
        email: data_login.email,
        role: roleData?.status || null,
      });
    }
    else{
        return res.status(401).json({ message: 'Password fail' });
    }
  } catch(error){
    console.error(error)
  }
}

function verify_token(req, res){
  const token = req.cookies?.token

  if(!token) {
    return res.status(401).json({message: "Token not provied"})
  }
  try{
    const payload = jwt.verify(token, secretKey);
    return res.status(200).json({ message: "You have access", user: payload });

  } catch(error){
    return res.status(403).json({message: "Token not valid"})
  }
}

async function register(req, res){
  const {email, username, password} = req.body

  const hash = await argon2.hash(password)
  
  const {data, error} = await supabase
    .from('users')
    .insert({email: email, username: username, password_hash: hash})
    .select();

  if (error) {
    return res.status(400).json({ message: 'Error al crear usuario', detail: error.message });
  }

  const { error: roleError } = await supabase
    .from('role')
    .insert({
      id_user: data[0].id_user,
      status: 'pm'
    });

  if (roleError) {
    console.error('Error asignando rol:', roleError);
    return res.status(500).json({ message: 'Role not applied' });
  }

  res.status(201).json({ message: 'Usuario creado', user: data[0] }); 
}


function logout(req, res) {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logout success' });
}

// GET /auth/me — devuelve el usuario autenticado con su rol
function me(req, res) {
  return res.status(200).json(req.user);
}

module.exports = { login, register, verify_token, logout, me };