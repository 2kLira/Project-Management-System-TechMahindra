const jwt = require('jsonwebtoken');
const supabase = require('../../supabase');

const secretKey = process.env.JWT_SECRET;

async function authenticateToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  try {
    const payload = jwt.verify(token, secretKey);
    
    // Obtener información del usuario y su rol
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id_user, email, username')
      .eq('id_user', payload.id)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { data: roleData, error: roleError } = await supabase
      .from('role')
      .select('status')
      .eq('id_user', payload.id)
      .single();

    if (roleError || !roleData) {
      return res.status(401).json({ message: 'Role not found' });
    }

    req.user = {
      id: userData.id_user,
      email: userData.email,
      username: userData.username,
      role: roleData.status
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token not valid' });
  }
}

// Middleware para verificar que el usuario es PM
function requirePM(req, res, next) {
  if (req.user.role !== 'pm') {
    return res.status(403).json({ message: 'Access denied. PM role required.' });
  }
  next();
}

// Middleware para verificar que el usuario es PM del proyecto específico
async function requireProjectPM(req, res, next) {
  const projectId = req.params.projectId;
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('project_managers')
    .select('id_project')
    .eq('id_project', projectId)
    .eq('id_user', userId)
    .single();

  if (error || !data) {
    return res.status(403).json({ message: 'Access denied. You are not the PM of this project.' });
  }

  next();
}

module.exports = { authenticateToken, requirePM, requireProjectPM };
