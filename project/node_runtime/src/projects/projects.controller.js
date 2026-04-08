const supabase = require('../../supabase');

// GET /projects — CA-04: viewer solo ve sus proyectos, PM solo los suyos
async function getProjects(req, res) {
    try {
        const { id, role } = req.user;
        let data, error;

        if (role === 'viewer') {
            ({ data, error } = await supabase
                .from('project_member')
                .select('project(*)')
                .eq('id_user', id));

            if (error) return res.status(500).json({ error: error.message });
            data = data.map(m => m.project);
        } else {
            ({ data, error } = await supabase
                .from('project')
                .select('*')
                .eq('id_pm', id));

            if (error) return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// POST /projects/create
async function createProject(req, res) {
    try {
        const {
            name,
            client,
            pm_id,
            start_date,
            deadline,
            story_points,
            description,
            viewer_ids
        } = req.body;

        const { data, error } = await supabase
            .from('project')
            .insert([{
                id_pm: parseInt(pm_id),
                project_name: name,
                description: description || null,
                start_date: start_date || null,
                deadline: deadline || null,
                client_name: client,
                estimated_sp: story_points ? parseInt(story_points) : null
            }])
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });

        // CA-03: insertar viewers en project_member (un viewer puede estar en varios proyectos)
        if (viewer_ids && viewer_ids.length > 0) {
            const members = viewer_ids.map(uid => ({
                id_project: data.id_project,
                id_user: parseInt(uid)
            }));
            const { error: memberError } = await supabase
                .from('project_member')
                .insert(members);

            if (memberError) return res.status(500).json({ error: memberError.message });
        }

        return res.status(201).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// GET /projects/managers
async function getManagers(_req, res) {
    try {
        const { data, error } = await supabase
            .from('role')
            .select('users(id_user, username, email)')
            .eq('status', 'project_manager');

        if (error) return res.status(500).json({ error: error.message });

        const pms = data.map(r => r.users);
        return res.status(200).json({ pms });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// GET /projects/viewers — CA-01: solo usuarios con rol viewer
async function getViewers(_req, res) {
    try {
        const { data, error } = await supabase
            .from('role')
            .select('users(id_user, username, email)')
            .eq('status', 'viewer');

        if (error) return res.status(500).json({ error: error.message });

        const viewers = data.map(r => r.users);
        return res.status(200).json({ viewers });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// GET /projects/:id/viewers
async function getProjectViewers(req, res) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('project_member')
            .select('users(id_user, username, email)')
            .eq('id_project', id);

        if (error) return res.status(500).json({ error: error.message });

        const viewers = data.map(m => m.users);
        return res.status(200).json({ viewers });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// POST /projects/:id/viewers — CA-01 + CA-02
async function addViewerToProject(req, res) {
    try {
        const { id } = req.params;
        const { viewer_id } = req.body;
        const { id: userId } = req.user;

        // CA-02: verificar que el usuario autenticado es el PM del proyecto
        const { data: project, error: projectError } = await supabase
            .from('project')
            .select('id_pm')
            .eq('id_project', id)
            .single();

        if (projectError || !project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.id_pm !== userId) {
            return res.status(403).json({ message: 'CA-02: You are not the PM of this project' });
        }

        // CA-01: verificar que el usuario a agregar tiene rol viewer
        const { data: viewerRole } = await supabase
            .from('role')
            .select('status')
            .eq('id_user', viewer_id)
            .single();

        if (!viewerRole || viewerRole.status !== 'viewer') {
            return res.status(400).json({ message: 'CA-01: User does not have viewer role' });
        }

        // CA-03: insertar (un viewer puede estar en varios proyectos)
        const { error: insertError } = await supabase
            .from('project_member')
            .insert({ id_project: parseInt(id), id_user: parseInt(viewer_id) });

        if (insertError) return res.status(500).json({ error: insertError.message });

        return res.status(201).json({ message: 'Viewer added successfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// DELETE /projects/:id/viewers/:viewerId — CA-02
async function removeViewerFromProject(req, res) {
    try {
        const { id, viewerId } = req.params;
        const { id: userId } = req.user;

        // CA-02: verificar que el usuario autenticado es el PM del proyecto
        const { data: project, error: projectError } = await supabase
            .from('project')
            .select('id_pm')
            .eq('id_project', id)
            .single();

        if (projectError || !project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.id_pm !== userId) {
            return res.status(403).json({ message: 'CA-02: You are not the PM of this project' });
        }

        const { error } = await supabase
            .from('project_member')
            .delete()
            .eq('id_project', parseInt(id))
            .eq('id_user', parseInt(viewerId));

        if (error) return res.status(500).json({ error: error.message });

        return res.status(200).json({ message: 'Viewer removed successfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getProjects,
    createProject,
    getManagers,
    getViewers,
    getProjectViewers,
    addViewerToProject,
    removeViewerFromProject
};
