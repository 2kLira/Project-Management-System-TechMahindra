const supabase = require('../../supabase');

/**
 * Agregar un viewer a un proyecto
 * CA-01: Solo usuarios con rol Viewer
 * CA-02: Solo PM del proyecto puede agregar (verificado por middleware)
 * CA-03: El mismo viewer puede estar en múltiples proyectos
 */
async function addViewerToProject(req, res) {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // CA-01: Verificar que el usuario a agregar tiene rol "viewer"
    const { data: roleData, error: roleError } = await supabase
      .from('role')
      .select('status')
      .eq('id_user', userId)
      .single();

    if (roleError || !roleData) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (roleData.status !== 'viewer') {
      return res.status(400).json({ 
        message: 'Only users with Viewer role can be added to projects',
        currentRole: roleData.status
      });
    }

    // Verificar que el proyecto existe
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id_project')
      .eq('id_project', projectId)
      .single();

    if (projectError || !projectData) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verificar si el viewer ya está en el proyecto
    const { data: existingViewer } = await supabase
      .from('project_viewers')
      .select('id_user')
      .eq('id_project', projectId)
      .eq('id_user', userId)
      .single();

    if (existingViewer) {
      return res.status(409).json({ message: 'Viewer is already assigned to this project' });
    }

    // Agregar el viewer al proyecto
    const { data, error } = await supabase
      .from('project_viewers')
      .insert({
        id_project: projectId,
        id_user: userId
      })
      .select();

    if (error) {
      console.error('Error adding viewer:', error);
      return res.status(500).json({ message: 'Error adding viewer to project', detail: error.message });
    }

    res.status(201).json({ 
      message: 'Viewer added successfully',
      data: data[0]
    });

  } catch (error) {
    console.error('Error in addViewerToProject:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Eliminar un viewer de un proyecto
 */
async function removeViewerFromProject(req, res) {
  try {
    const { projectId, userId } = req.params;

    const { data, error } = await supabase
      .from('project_viewers')
      .delete()
      .eq('id_project', projectId)
      .eq('id_user', userId)
      .select();

    if (error) {
      console.error('Error removing viewer:', error);
      return res.status(500).json({ message: 'Error removing viewer', detail: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Viewer not found in this project' });
    }

    res.status(200).json({ message: 'Viewer removed successfully' });

  } catch (error) {
    console.error('Error in removeViewerFromProject:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Obtener todos los viewers de un proyecto
 */
async function getProjectViewers(req, res) {
  try {
    const { projectId } = req.params;

    const { data, error } = await supabase
      .from('project_viewers')
      .select(`
        id_user,
        added_at,
        users:id_user (
          id_user,
          email,
          username
        )
      `)
      .eq('id_project', projectId);

    if (error) {
      console.error('Error getting viewers:', error);
      return res.status(500).json({ message: 'Error getting viewers', detail: error.message });
    }

    const viewers = data.map(item => ({
      id: item.users.id_user,
      email: item.users.email,
      username: item.users.username,
      addedAt: item.added_at
    }));

    res.status(200).json({ viewers });

  } catch (error) {
    console.error('Error in getProjectViewers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Obtener proyectos del usuario actual
 * CA-04: Viewers solo ven proyectos a los que están vinculados
 * PMs ven proyectos que gestionan
 */
async function getMyProjects(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let projects = [];

    if (userRole === 'pm') {
      // PM ve los proyectos que gestiona
      const { data, error } = await supabase
        .from('project_managers')
        .select(`
          projects:id_project (
            id_project,
            name,
            description,
            created_at
          )
        `)
        .eq('id_user', userId);

      if (error) {
        console.error('Error getting PM projects:', error);
        return res.status(500).json({ message: 'Error getting projects' });
      }

      projects = data.map(item => ({
        ...item.projects,
        role: 'pm'
      }));

    } else if (userRole === 'viewer') {
      // CA-04: Viewer solo ve proyectos a los que está vinculado
      const { data, error } = await supabase
        .from('project_viewers')
        .select(`
          projects:id_project (
            id_project,
            name,
            description,
            created_at
          )
        `)
        .eq('id_user', userId);

      if (error) {
        console.error('Error getting viewer projects:', error);
        return res.status(500).json({ message: 'Error getting projects' });
      }

      projects = data.map(item => ({
        ...item.projects,
        role: 'viewer'
      }));
    }

    res.status(200).json({ projects });

  } catch (error) {
    console.error('Error in getMyProjects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Obtener todos los usuarios con rol viewer disponibles para agregar
 */
async function getAvailableViewers(req, res) {
  try {
    const { projectId } = req.params;

    // Obtener todos los usuarios con rol viewer
    const { data: allViewers, error: viewersError } = await supabase
      .from('role')
      .select(`
        id_user,
        users:id_user (
          id_user,
          email,
          username
        )
      `)
      .eq('status', 'viewer');

    if (viewersError) {
      console.error('Error getting viewers:', viewersError);
      return res.status(500).json({ message: 'Error getting viewers' });
    }

    // Obtener viewers ya asignados al proyecto
    const { data: assignedViewers, error: assignedError } = await supabase
      .from('project_viewers')
      .select('id_user')
      .eq('id_project', projectId);

    if (assignedError) {
      console.error('Error getting assigned viewers:', assignedError);
      return res.status(500).json({ message: 'Error getting assigned viewers' });
    }

    const assignedIds = assignedViewers.map(v => v.id_user);

    // Filtrar viewers no asignados
    const availableViewers = allViewers
      .filter(v => !assignedIds.includes(v.id_user))
      .map(v => ({
        id: v.users.id_user,
        email: v.users.email,
        username: v.users.username
      }));

    res.status(200).json({ viewers: availableViewers });

  } catch (error) {
    console.error('Error in getAvailableViewers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  addViewerToProject,
  removeViewerFromProject,
  getProjectViewers,
  getMyProjects,
  getAvailableViewers
};
