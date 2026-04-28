const supabase = require("../../config/supabase");

async function getSprint(req, res){
    const { id_sprint } = req.params

    try {
        const response = await supabase
            .from('sprint')
            .select()
            .eq('id_sprint', id_sprint)

        if (response.error){
            return res.status(401).json({ message: 'Sprint not found' });
        }
        
        return res.status(200).json({ message: 'Consult sprints success', data: response.data[0] });
        }

        catch(error){
            return res.status(500).json({ message: error.message });
    }
}


async function createWorkItem(req, res) {
    const {id_sprint} = req.params

    const {type, assignee, created_by, title, sp, weight, start_date, target_date, description } = req.body

    try{
        const response = await supabase
            .from('work_item')
            .insert({'id_sprint': id_sprint,
                    'type': type, 
                    'title': title, 
                    'assignee_id': assignee,
                    'created_by': created_by,
                    'story_points': sp,
                    'gamification_weight': weight,
                    'start_date': start_date,
                    'end_date': target_date,
                    'description':description                
                })
        

        if (response.error){
            console.error("Supabase error:", response.error)
            return res.status(400).json({ message: response.error.message });
        }
        
        return res.status(201).json({message: 'Creation of work item success', data: response})
    } catch(error){
        return res.status(500).json({ message: error.message });
    }
    
}

async function getWorkItem(req, res) {
    const { id_sprint } = req.params

    try {
        const response = await supabase
            .from('work_item')
            .select()
            .eq('id_sprint', id_sprint)


        if (response.error){
            console.error("Supabase error:", response.error)
            return res.status(400).json({ message: response.error.message });
        }
        
        return res.status(201).json({message: 'Consult of work items success', data: response})
    } catch(error){
        return res.status(500).json({ message: error.message });
    }
    
}
module.exports = { getSprint, createWorkItem, getWorkItem };
