/**
 * Google Drive Gallery Routes
 * Fetches images from public Google Drive folders using API Key
 */

const express = require('express');
const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * Extract folder ID from various Google Drive URL formats
 * Supports:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
 * - https://drive.google.com/open?id=FOLDER_ID
 * - Just the FOLDER_ID directly
 */
function extractFolderId(url) {
    if (!url) return null;

    const patterns = [
        /\/folders\/([a-zA-Z0-9_-]+)/,      // /folders/ID format
        /[?&]id=([a-zA-Z0-9_-]+)/,          // ?id=ID format
        /^([a-zA-Z0-9_-]{25,})$/            // Just the ID (25+ chars)
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * GET /api/v1/gallery/drive
 * Fetch images from a Google Drive folder
 * 
 * Query params:
 * - folderUrl: Google Drive folder URL or ID (required)
 * - pageSize: Number of images to fetch (default: 100, max: 1000)
 */
router.get('/', async (req, res) => {
    try {
        const { folderUrl, pageSize = 100 } = req.query;

        // Validate API key is configured
        if (!GOOGLE_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Google API key not configured'
            });
        }

        // Validate folderUrl parameter
        if (!folderUrl) {
            return res.status(400).json({
                success: false,
                error: 'folderUrl query parameter is required'
            });
        }

        // Extract folder ID from URL
        const folderId = extractFolderId(folderUrl);
        if (!folderId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Google Drive folder URL. Please provide a valid folder URL or ID.'
            });
        }

        // Build Google Drive API request
        const query = `'${folderId}' in parents and mimeType contains 'image'`;
        const fields = 'files(id,name,mimeType,createdTime,size)';

        const apiUrl = new URL('https://www.googleapis.com/drive/v3/files');
        apiUrl.searchParams.set('q', query);
        apiUrl.searchParams.set('key', GOOGLE_API_KEY);
        apiUrl.searchParams.set('fields', fields);
        apiUrl.searchParams.set('pageSize', Math.min(parseInt(pageSize), 1000));
        apiUrl.searchParams.set('orderBy', 'createdTime desc');

        // Fetch from Google Drive API
        const response = await fetch(apiUrl.toString());
        const data = await response.json();

        // Handle API errors
        if (data.error) {
            console.error('Google Drive API Error:', data.error);

            // Provide user-friendly error messages
            if (data.error.code === 404) {
                return res.status(404).json({
                    success: false,
                    error: 'Folder not found. Make sure the folder is shared as "Anyone with the link".'
                });
            }
            if (data.error.code === 403) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. Make sure the folder is shared as "Anyone with the link → Viewer".'
                });
            }

            return res.status(400).json({
                success: false,
                error: data.error.message || 'Failed to fetch from Google Drive'
            });
        }

        // Transform files to include URLs
        const images = (data.files || []).map(file => ({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            createdTime: file.createdTime,
            size: file.size,
            // Direct view URL
            url: `https://drive.google.com/uc?id=${file.id}`,
            // Thumbnail URL (resized for gallery)
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`,
            // Large preview URL
            previewUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1200`
        }));

        // Return success response
        res.json({
            success: true,
            folderId,
            totalImages: images.length,
            images
        });

    } catch (error) {
        console.error('Drive Gallery Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch images from Google Drive'
        });
    }
});

/**
 * GET /api/v1/gallery/drive/all
 * Fetch images from ALL active drive folders
 */
router.get('/all', async (req, res) => {
    try {
        // Validate API key is configured
        if (!GOOGLE_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Google API key not configured'
            });
        }

        // Import supabaseAdmin - using require inline to avoid circular deps
        const { supabaseAdmin } = require('../config/supabase');

        // Get all active drive folders
        const { data: folders, error } = await supabaseAdmin
            .from('drive_folders')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch folder configurations'
            });
        }

        if (!folders || folders.length === 0) {
            return res.json({
                success: true,
                totalFolders: 0,
                totalImages: 0,
                folders: []
            });
        }

        // Helper to extract folder ID
        const extractFolderId = (url) => {
            if (!url) return null;
            const patterns = [
                /\/folders\/([a-zA-Z0-9_-]+)/,
                /[?&]id=([a-zA-Z0-9_-]+)/,
                /^([a-zA-Z0-9_-]{25,})$/
            ];
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) return match[1];
            }
            return null;
        };

        // Fetch images from each folder in parallel
        const folderPromises = folders.map(async (folder) => {
            const folderId = extractFolderId(folder.folder_url);
            if (!folderId) return { folder, images: [], error: 'Invalid folder URL' };

            try {
                const query = `'${folderId}' in parents and mimeType contains 'image'`;
                const fields = 'files(id,name,mimeType,createdTime,size)';

                const apiUrl = new URL('https://www.googleapis.com/drive/v3/files');
                apiUrl.searchParams.set('q', query);
                apiUrl.searchParams.set('key', GOOGLE_API_KEY);
                apiUrl.searchParams.set('fields', fields);
                apiUrl.searchParams.set('pageSize', '100');
                apiUrl.searchParams.set('orderBy', 'createdTime desc');

                const response = await fetch(apiUrl.toString());
                const data = await response.json();

                if (data.error) {
                    return { folder, images: [], error: data.error.message };
                }

                const images = (data.files || []).map(file => ({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    url: `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`,
                    previewUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1200`,
                    // Add folder metadata
                    event_name: folder.name,
                    category: folder.category
                }));

                return { folder, images, error: null };
            } catch (err) {
                return { folder, images: [], error: err.message };
            }
        });

        const results = await Promise.all(folderPromises);

        // Flatten all images and count
        const allImages = results.flatMap(r => r.images);
        const foldersData = results.map(r => ({
            id: r.folder.id,
            name: r.folder.name,
            category: r.folder.category,
            imageCount: r.images.length,
            error: r.error
        }));

        res.json({
            success: true,
            totalFolders: folders.length,
            totalImages: allImages.length,
            folders: foldersData,
            images: allImages
        });

    } catch (error) {
        console.error('Drive Gallery All Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch images from Google Drive'
        });
    }
});

module.exports = router;
