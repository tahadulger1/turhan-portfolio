import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { supabase } from '../src/lib/supabase.js';

const app = express();

// Set up Multer to use Memory Storage instead of Disk Storage for Vercel
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Desteklenmeyen dosya formatı. (Sadece resim ve mp4/webm videolar)'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: fileFilter
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic auth middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization;
    if (token === process.env.ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// --- API Routes ---

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true, token: password });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.post('/api/upload', requireAuth, (req, res) => {
    upload.single('image')(req, res, async (err: any) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya seçilmedi veya geçersiz format' });
        }

        try {
            const ext = path.extname(req.file.originalname).toLowerCase() || '.png';
            const uniqueSuffix = crypto.randomBytes(16).toString('hex');
            const filename = `${uniqueSuffix}${ext}`;

            // Upload to Supabase Storage Bucket named "uploads"
            const { data, error } = await supabase
                .storage
                .from('uploads')
                .upload(filename, req.file.buffer, {
                    contentType: req.file.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error("Supabase Storage Error:", error);
                throw error;
            }

            // Get public URL
            const { data: publicData } = supabase
                .storage
                .from('uploads')
                .getPublicUrl(filename);

            res.json({ success: true, url: publicData.publicUrl });
        } catch (uploadError: any) {
            console.error("Upload Catch Error:", uploadError);
            res.status(500).json({ error: uploadError.message || 'Dosya yüklenirken bir hata oluştu.' });
        }
    });
});

app.get('/api/projects', async (req, res) => {
    try {
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        const { data: variations, error: variationsError } = await supabase
            .from('variations')
            .select('*');

        if (variationsError) throw variationsError;

        const result = projects.map(p => ({
            ...p,
            isMulti: p.isMulti === true || p.isMulti === 1,
            variations: variations.filter(v => v.projectId === p.id)
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', requireAuth, async (req, res) => {
    try {
        const { title, category, description, isMulti, variations, defaultBgColor } = req.body;

        // Insert project
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .insert([
                { title, category, description: description || '', isMulti: isMulti ? true : false, defaultBgColor: defaultBgColor || 'default' }
            ])
            .select()
            .single();

        if (projectError) throw projectError;
        const projectId = projectData.id;

        // Insert variations if any
        if (variations && Array.isArray(variations) && variations.length > 0) {
            const variationInserts = variations.map((v: any) => ({
                projectId: projectId,
                image: v.image,
                colorCode: v.colorCode || '',
                imageScale: v.imageScale !== undefined ? v.imageScale : 1
            }));

            const { error: variationError } = await supabase
                .from('variations')
                .insert(variationInserts);

            if (variationError) throw variationError;
        }

        res.json({ id: projectId, success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.put('/api/projects/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, description, isMulti, variations, defaultBgColor } = req.body;

        // Update project
        const { error: projectError } = await supabase
            .from('projects')
            .update({ title, category, description: description || '', isMulti: isMulti ? true : false, defaultBgColor: defaultBgColor || 'default' })
            .eq('id', id);

        if (projectError) throw projectError;

        // Delete existing variations
        const { error: deleteError } = await supabase
            .from('variations')
            .delete()
            .eq('projectId', id);

        if (deleteError) throw deleteError;

        // Insert new variations
        if (variations && Array.isArray(variations) && variations.length > 0) {
            const variationInserts = variations.map((v: any) => ({
                projectId: id,
                image: v.image,
                colorCode: v.colorCode || '',
                imageScale: v.imageScale !== undefined ? v.imageScale : 1
            }));

            const { error: variationError } = await supabase
                .from('variations')
                .insert(variationInserts);

            if (variationError) throw variationError;
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Deleting the project will cascade delete variations due to our DB foreign key ON DELETE CASCADE rule
        // Or we explicitly delete variations just to be sure if cascade isn't working
        await supabase.from('variations').delete().eq('projectId', id);

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Kategoriler API

app.get('/api/categories', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.post('/api/categories', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Category name is required' });

        const { data, error } = await supabase
            .from('categories')
            .insert([{ name }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error(error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Bu kategori zaten mevcut.' });
        }
        res.status(500).json({ error: 'Failed to create category' });
    }
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Export the express app as default for Vercel Serverless
export default app;
