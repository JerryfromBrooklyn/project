import { supabase } from '../lib/supabaseClient';

/**
 * Service for managing linked user accounts functionality
 */
class LinkedAccountsService {
    /**
     * Get all user IDs linked to a given user
     * @param {string} userId - The user ID to check for linked accounts
     * @returns {Promise<string[]>} - Array of user IDs (including the original user ID)
     */
    static async getLinkedUserIds(userId) {
        if (!userId) return [userId];
        
        try {
            console.log(`[LINKED-ACCOUNTS] Checking for linked accounts for user ${userId}`);
            
            // Query the linked_accounts table to find all users in the same identity group
            const { data: linkedAccounts, error } = await supabase.rpc(
                'get_linked_accounts',
                { p_user_id: userId }
            );
            
            if (error) {
                console.error('[LINKED-ACCOUNTS] Error fetching linked accounts:', error);
                return [userId]; // Return only the current user ID on error
            }
            
            if (!linkedAccounts || !linkedAccounts.length) {
                console.log('[LINKED-ACCOUNTS] No linked accounts found');
                return [userId]; // Return only the current user ID
            }
            
            // Extract all user IDs (includes the current user)
            const userIds = linkedAccounts.map(account => account.user_id);
            console.log(`[LINKED-ACCOUNTS] Found ${userIds.length} linked accounts:`, userIds);
            
            return userIds;
        } catch (err) {
            console.error('[LINKED-ACCOUNTS] Exception fetching linked accounts:', err);
            return [userId]; // Return only the current user ID on error
        }
    }

    /**
     * Link two user accounts together
     * @param {string} primaryUserId - The primary user ID
     * @param {string} secondaryUserId - The secondary user ID to link
     * @returns {Promise<object>} - Result object with success status
     */
    static async linkUserAccounts(primaryUserId, secondaryUserId) {
        if (!primaryUserId || !secondaryUserId) {
            return { success: false, error: 'Missing user IDs' };
        }

        try {
            const { data, error } = await supabase.rpc(
                'link_user_accounts',
                { 
                    p_primary_user_id: primaryUserId,
                    p_secondary_user_id: secondaryUserId
                }
            );

            if (error) {
                console.error('[LINKED-ACCOUNTS] Error linking accounts:', error);
                return { success: false, error: error.message };
            }

            return data || { success: true, message: 'Accounts linked successfully' };
        } catch (err) {
            console.error('[LINKED-ACCOUNTS] Exception linking accounts:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Unlink a user account from its identity group
     * @param {string} userId - The user ID to unlink
     * @returns {Promise<object>} - Result object with success status
     */
    static async unlinkUserAccount(userId) {
        if (!userId) {
            return { success: false, error: 'Missing user ID' };
        }

        try {
            const { data, error } = await supabase.rpc(
                'unlink_user_account',
                { p_user_id: userId }
            );

            if (error) {
                console.error('[LINKED-ACCOUNTS] Error unlinking account:', error);
                return { success: false, error: error.message };
            }

            return data || { success: true, message: 'Account unlinked successfully' };
        } catch (err) {
            console.error('[LINKED-ACCOUNTS] Exception unlinking account:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Update photos for all linked accounts - ensures all photos match all linked users
     * @param {string} userId - The user ID to update photos for
     * @param {string} faceId - The face ID associated with the user
     * @returns {Promise<object>} - Result object with success status and counts
     */
    static async updatePhotosForLinkedAccounts(userId, faceId) {
        if (!userId || !faceId) {
            console.error('[LINKED-UPDATE] Missing required parameters');
            return { success: false, error: 'Missing required parameters' };
        }
        
        try {
            console.group('[LINKED-UPDATE] Updating photos for linked accounts');
            
            // Get all linked user IDs
            const linkedUserIds = await this.getLinkedUserIds(userId);
            console.log(`[LINKED-UPDATE] Found ${linkedUserIds.length} linked accounts to update`);
            
            // For each linked user ID, use debug_force_update_photo to update the specific photos
            // First, find all photos that have any linked user ID
            let allPhotoIds = new Set();
            
            // First, get photos from the usual methods
            const { data: userPhotos, error: photosError } = await supabase
                .from('photos')
                .select('id')
                .contains('matched_users', [{ userId: userId }]);
                
            if (photosError) {
                console.error('[LINKED-UPDATE] Error fetching user photos:', photosError);
            } else if (userPhotos?.length) {
                userPhotos.forEach(photo => allPhotoIds.add(photo.id));
                console.log(`[LINKED-UPDATE] Found ${userPhotos.length} photos directly matched to user`);
            }
            
            // Also check for photos matching linked accounts
            for (const linkedId of linkedUserIds) {
                if (linkedId === userId) continue; // Skip the current user
                
                const { data: linkedPhotos, error: linkedError } = await supabase
                    .from('photos')
                    .select('id')
                    .contains('matched_users', [{ userId: linkedId }]);
                    
                if (linkedError) {
                    console.error(`[LINKED-UPDATE] Error fetching photos for linked account ${linkedId}:`, linkedError);
                } else if (linkedPhotos?.length) {
                    linkedPhotos.forEach(photo => allPhotoIds.add(photo.id));
                    console.log(`[LINKED-UPDATE] Found ${linkedPhotos.length} photos matched to linked account ${linkedId}`);
                }
            }
            
            // Now we have all photo IDs from all linked accounts
            const allPhotoIdsArray = Array.from(allPhotoIds);
            console.log(`[LINKED-UPDATE] Total unique photos found: ${allPhotoIdsArray.length}`);
            
            // For each photo, add all linked users as matches
            let updatedCount = 0;
            let errorCount = 0;
            
            for (const photoId of allPhotoIdsArray) {
                // Get current matched users
                const { data: photo, error: photoError } = await supabase
                    .from('photos')
                    .select('matched_users')
                    .eq('id', photoId)
                    .single();
                    
                if (photoError) {
                    console.error(`[LINKED-UPDATE] Error fetching photo ${photoId}:`, photoError);
                    errorCount++;
                    continue;
                }
                
                // Get user data for all linked accounts
                const usersData = [];
                for (const linkedId of linkedUserIds) {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('id, full_name, email, avatar_url')
                        .eq('id', linkedId)
                        .single();
                        
                    if (!userError && userData) {
                        usersData.push(userData);
                    }
                }
                
                // Create match objects for all linked users
                const matchedUsers = [];
                for (const userData of usersData) {
                    matchedUsers.push({
                        userId: userData.id,
                        fullName: userData.full_name || userData.email || 'Unknown User',
                        email: userData.email || null,
                        avatarUrl: userData.avatar_url,
                        confidence: 99.0,
                        similarity: 99.0,
                        matchedAt: new Date().toISOString(),
                        matchType: 'linked_account'
                    });
                }
                
                // Update the photo
                const { error: updateError } = await supabase
                    .from('photos')
                    .update({ 
                        matched_users: matchedUsers,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', photoId);
                    
                if (updateError) {
                    console.error(`[LINKED-UPDATE] Error updating photo ${photoId}:`, updateError);
                    
                    // Fallback - use debug_force_update_photo
                    console.log(`[LINKED-UPDATE] Trying fallback method for photo ${photoId}`);
                    
                    try {
                        const { data: debugResult, error: debugError } = await supabase.rpc(
                            'debug_force_update_photo',
                            { 
                                p_id: photoId,
                                user_id: userId
                            }
                        );
                        
                        if (debugError) {
                            console.error(`[LINKED-UPDATE] Debug fallback also failed for photo ${photoId}:`, debugError);
                            errorCount++;
                        } else {
                            console.log(`[LINKED-UPDATE] Debug fallback succeeded for photo ${photoId}`);
                            updatedCount++;
                        }
                    } catch (fallbackError) {
                        console.error(`[LINKED-UPDATE] Exception in fallback method:`, fallbackError);
                        errorCount++;
                    }
                } else {
                    console.log(`[LINKED-UPDATE] Successfully updated photo ${photoId}`);
                    updatedCount++;
                }
            }
            
            console.log(`[LINKED-UPDATE] Completed: ${updatedCount} photos updated, ${errorCount} failed`);
            console.groupEnd();
            
            return { 
                success: true, 
                updated: updatedCount, 
                failed: errorCount, 
                total: allPhotoIdsArray.length 
            };
        } catch (error) {
            console.error('[LINKED-UPDATE] Unexpected error:', error);
            console.groupEnd();
            return { success: false, error: error.message };
        }
    }
}

// Add to window for debugging
if (typeof window !== 'undefined') {
    window.LinkedAccountsService = LinkedAccountsService;
}

export default LinkedAccountsService; 