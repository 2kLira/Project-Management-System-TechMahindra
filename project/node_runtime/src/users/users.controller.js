const supabase = require('../../supabase');

// GET USERS
async function getUsers(req, res) {
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      return res.status(500).json({ error: usersError.message });
    }

    const { data: roles, error: rolesError } = await supabase
      .from('role')
      .select('id_user, status');

    if (rolesError) {
      return res.status(500).json({ error: rolesError.message });
    }

    const usersWithRoles = users.map(u => {
      const role = roles.find(r => r.id_user === u.id_user);
      return {
        ...u,
        role: role ? { status: role.status } : null
      };
    });

    res.json(usersWithRoles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// UPDATE STATUS
async function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id_user', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Status updated", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// UPDATE ROLE
async function updateRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const { data, error } = await supabase
      .from('role')
      .update({ status: role })
      .eq('id_user', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Role updated", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getUsers, updateStatus, updateRole };
