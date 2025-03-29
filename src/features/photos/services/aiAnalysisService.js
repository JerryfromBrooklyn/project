import { supabase } from '../../../lib/supabaseClient';
import photoService from './photoService';

/**
 * Service for handling AI analysis of photos
 */
export const aiAnalysisService = {
  /**
   * Analyze a photo and get scene, mood, and tag suggestions
   * @param {string|Object} photoOrId - Photo object or ID to analyze
   * @returns {Promise<Object>} Analysis results
   */
  analyzePhoto: async (photoOrId) => {
    try {
      // Get photo if ID was provided
      let photo;
      if (typeof photoOrId === 'string') {
        photo = await photoService.getPhotoById(photoOrId);
        if (!photo) throw new Error('Photo not found');
      } else {
        photo = photoOrId;
      }

      // Call the AI service for analysis
      const analysisResult = await aiAnalysisService.callExternalAIService(photo.url);
      
      // Store the results
      await aiAnalysisService.storeAnalysisResults(photo.id, analysisResult);
      
      return analysisResult;
    } catch (error) {
      console.error('AI analysis error:', error);
      throw error;
    }
  },
  
  /**
   * Call external AI service to analyze photo
   * @param {string} imageUrl - URL of the image to analyze
   * @returns {Promise<Object>} AI analysis results
   */
  callExternalAIService: async (imageUrl) => {
    try {
      // In a real implementation, this would call an external AI API
      // For now, we'll simulate a response

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate realistic looking analysis based on the image URL
      // In a real implementation, this would be the response from the AI API
      const hashCode = Array.from(imageUrl).reduce(
        (hash, char) => (((hash << 5) - hash) + char.charCodeAt(0)) | 0, 0
      );
      
      // Use the hash to generate deterministic but varied results
      const scenes = [
        'beach', 'mountain', 'city', 'forest', 'party', 'concert', 
        'wedding', 'restaurant', 'office', 'home', 'park', 'nightclub'
      ];
      const moods = [
        'joyful', 'energetic', 'calm', 'nostalgic', 'romantic', 
        'mysterious', 'dramatic', 'peaceful', 'exciting', 'celebratory'
      ];
      const tagOptions = [
        'friends', 'family', 'vacation', 'work', 'celebration', 'nature',
        'food', 'music', 'art', 'technology', 'travel', 'outdoor', 'indoor',
        'sunset', 'architecture', 'portrait', 'group', 'landscape', 'animal',
        'sports', 'holiday', 'weekend', 'summer', 'winter', 'spring', 'fall'
      ];
      
      // Select scene, mood, and tags based on the hash
      const scene = scenes[Math.abs(hashCode) % scenes.length];
      const mood = moods[Math.abs(hashCode >> 3) % moods.length];
      
      // Select 3-5 tags
      const tagCount = 3 + (Math.abs(hashCode >> 6) % 3);
      const tagSet = new Set();
      while (tagSet.size < tagCount) {
        const tagIndex = Math.abs((hashCode >> (tagSet.size * 3)) % tagOptions.length);
        tagSet.add(tagOptions[tagIndex]);
      }
      
      // Add scene as a tag if not already included
      tagSet.add(scene);
      
      // Convert Set to Array
      const tags = Array.from(tagSet);
      
      // Generate colors
      const colors = [
        { name: "Deep Blue", hex: "#0000FF", percentage: 20 + (Math.abs(hashCode) % 30) },
        { name: "Forest Green", hex: "#228B22", percentage: 15 + (Math.abs(hashCode >> 4) % 25) },
        { name: "Soft Beige", hex: "#F5F5DC", percentage: 10 + (Math.abs(hashCode >> 8) % 20) }
      ];
      
      // Calculate confidence scores (between 0.7 and 0.98)
      const sceneConfidence = 0.7 + ((Math.abs(hashCode) % 28) / 100);
      const moodConfidence = 0.7 + ((Math.abs(hashCode >> 4) % 28) / 100);
      
      // Return the analysis result
      return {
        scene: {
          label: scene,
          confidence: sceneConfidence
        },
        mood: {
          label: mood,
          confidence: moodConfidence
        },
        suggestedTags: tags,
        colors: colors,
        analyzed_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calling AI service:', error);
      throw new Error('Failed to analyze image with AI service');
    }
  },
  
  /**
   * Store analysis results in database and localStorage
   * @param {string} photoId - Photo ID
   * @param {Object} analysisResult - Analysis results to store
   */
  storeAnalysisResults: async (photoId, analysisResult) => {
    try {
      // First, store in the database
      try {
        const { error } = await supabase
          .from('simple_photos')
          .update({
            ai_analysis: analysisResult,
            // Add suggested tags to the photo's tags array
            tags: supabase.sql`array_distinct(coalesce(tags, '{}') || ${analysisResult.suggestedTags}::text[])`
          })
          .eq('id', photoId);
          
        if (error) {
          console.error('Database update error:', error);
          // Continue execution to update localStorage
        } else {
          console.log('Successfully updated analysis in database');
        }
      } catch (dbError) {
        console.error('Failed to update database with analysis:', dbError);
        // Continue to localStorage backup
      }
      
      // Then, update in localStorage as backup
      try {
        // Get current photo data from localStorage
        const storageKey = `photo_metadata_${photoId}`;
        const photoDataStr = localStorage.getItem(storageKey);
        
        if (photoDataStr) {
          const photoData = JSON.parse(photoDataStr);
          
          // Update with AI analysis
          photoData.ai_analysis = analysisResult;
          
          // Add suggested tags to existing tags (avoiding duplicates)
          const existingTags = Array.isArray(photoData.tags) ? photoData.tags : [];
          const newTags = [...new Set([...existingTags, ...analysisResult.suggestedTags])];
          photoData.tags = newTags;
          
          // Save back to localStorage
          localStorage.setItem(storageKey, JSON.stringify(photoData));
          console.log('Successfully updated analysis in localStorage');
        }
      } catch (localStorageError) {
        console.error('Failed to update localStorage with analysis:', localStorageError);
      }
    } catch (error) {
      console.error('Error storing analysis results:', error);
      throw error;
    }
  },
  
  /**
   * Get analysis results for a photo
   * @param {string} photoId - Photo ID
   * @returns {Promise<Object|null>} Analysis results or null if not found
   */
  getAnalysisResults: async (photoId) => {
    try {
      // First check localStorage (fastest)
      try {
        const storageKey = `photo_metadata_${photoId}`;
        const photoDataStr = localStorage.getItem(storageKey);
        
        if (photoDataStr) {
          const photoData = JSON.parse(photoDataStr);
          if (photoData.ai_analysis) {
            return photoData.ai_analysis;
          }
        }
      } catch (localStorageError) {
        console.error('Error reading from localStorage:', localStorageError);
      }
      
      // Then check database
      try {
        const { data, error } = await supabase
          .from('simple_photos')
          .select('ai_analysis')
          .eq('id', photoId)
          .single();
          
        if (error) {
          console.error('Database query error:', error);
          return null;
        }
        
        return data?.ai_analysis || null;
      } catch (dbError) {
        console.error('Error reading from database:', dbError);
        return null;
      }
    } catch (error) {
      console.error('Error getting analysis results:', error);
      return null;
    }
  }
};

export default aiAnalysisService; 