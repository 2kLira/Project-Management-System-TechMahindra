const supabase = require('../../supabase');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;
const VALID_ROLES = ['admin', 'pm', 'viewer'];

function normalizeRole(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : 'viewer';
}

async function login(req, res) {
  try {
    const { email_user, password } = req.body;

    const { data, error } = await supabase
      .from('users')
      .select('id_user, email, username, password_hash')
      .or(`email.eq.${email_user},username.eq.${email_user}`)
      .single();

    if (error || !data) {
      return res.status(401).json({ message: 'User not found' });
    }

    const validPassword = await argon2.verify(data.password_hash, password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id_user', data.id_user);

    const { data: roleData } = await supabase
      .from('role')
      .select('status')
      .eq('id_user', data.id_user)
      .single();

    const role = normalizeRole(roleData?.status);

    const token = jwt.sign(
      { id: data.id_user, role, username: data.username },
      secretKey,
      { expiresIn: "1h" }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600000
    });

    return res.status(200).json({
      message: 'Login success',
      id_user: data.id_user,
      username: data.username,
      email: data.email,
      role,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function register(req, res) {
  const { email, username, password, full_name, role } = req.body;

  try {
    if (!email || !username || !password || !full_name || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedRole = normalizeRole(role);

    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const hash = await argon2.hash(password);

    const { data, error } = await supabase
      .from('users')
      .insert({ email, username, full_name, password_hash: hash })
      .select();

    if (error) {
      return res.status(400).json({ message: 'Error creating user', detail: error.message });
    }

    const user = data[0];

    const { error: roleError } = await supabase
      .from('role')
      .insert({ id_user: user.id_user, status: normalizedRole });

    if (roleError) {
      return res.status(500).json({ message: 'Error assigning role', detail: roleError.message });
    }

    return res.status(201).json({ message: 'User created successfully', user });

  } catch (err) {
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

function verify_token(req, res) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    const payload = jwt.verify(token, secretKey);
    return res.status(200).json({
      message: "Access granted",
      user: { id: payload.id, role: payload.role, username: payload.username }
    });
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
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
