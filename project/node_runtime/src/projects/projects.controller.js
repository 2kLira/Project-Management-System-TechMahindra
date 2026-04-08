const supabase = require('../../supabase');

// Obtener todos los proyectos
async function getProjects(req, res) {
    try {
        const { data, error } = await supabase
            .from('project')
            .select('*');

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// Crear un proyecto
async function createProject(req, res) {
    try {
        const {
            id_pm,
            project_name,
            description,
            start_date,
            deadline,
            client_name,
            estimated_sp
        } = req.body;

        const { data, error } = await supabase
            .from('project')
            .insert([
                {
                    id_pm,
                    project_name,
                    description,
                    start_date,
                    deadline,
                    client_name,
                    estimated_sp
                }
            ])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getProjects,
    createProject
};