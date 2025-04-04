// Fix for FaceRegistration.js to correctly format face attributes before saving
// This code should be copied into your FaceRegistration.js file or used as a reference

// Replace the verification and save section with this improved version
try {
  console.log('Verifying face attributes are saved in the user profile...');
  
  // Use the admin function to verify face data
  const { data: verifyResult, error: verifyError } = await supabase.rpc(
    'admin_check_user_face_attributes',
    { p_user_id: user.id }
  );
  
  if (verifyError) {
    console.error('Error verifying face attributes:', verifyError);
  } else {
    console.log('Face attribute verification result:', verifyResult);
    
    // Always perform a direct save to ensure data is properly formatted
    console.log('Ensuring face attributes are properly saved...');
    
    // Format the attributes in the expected structure
    const formattedAttributes = {
      gender: indexedFaceAttributes.Gender ? {
        value: indexedFaceAttributes.Gender.Value,
        confidence: indexedFaceAttributes.Gender.Confidence
      } : null,
      age_range: indexedFaceAttributes.AgeRange ? {
        low: indexedFaceAttributes.AgeRange.Low,
        high: indexedFaceAttributes.AgeRange.High
      } : null,
      emotions: indexedFaceAttributes.Emotions ? 
        indexedFaceAttributes.Emotions.map(e => ({
          type: e.Type,
          confidence: e.Confidence
        })) : [],
      smile: indexedFaceAttributes.Smile ? {
        value: indexedFaceAttributes.Smile.Value,
        confidence: indexedFaceAttributes.Smile.Confidence
      } : null,
      quality: indexedFaceAttributes.Quality || null,
      confidence: indexedFaceAttributes.Confidence
    };
    
    // Update the user directly in the database (this is the most reliable approach)
    const { data: directUpdateData, error: directUpdateError } = await supabase
      .from('users')
      .update({
        face_id: faceId,
        face_attributes: formattedAttributes,
        face_updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (directUpdateError) {
      console.error('Error updating user face data directly:', directUpdateError);
      
      // Try the admin function as a fallback
      try {
        const { data: updateResult, error: updateError } = await supabase.rpc(
          'admin_update_user_face_attributes',
          {
            p_user_id: user.id,
            p_face_id: faceId,
            p_attributes: formattedAttributes // Use the properly formatted attributes here
          }
        );
        
        if (updateError) {
          console.error('Error saving face attributes via admin function:', updateError);
        } else {
          console.log('Face attributes saved successfully via admin function:', updateResult);
        }
      } catch (adminError) {
        console.error('Exception during admin function call:', adminError);
      }
    } else {
      console.log('Face attributes saved successfully via direct update');
    }
    
    // Also make sure the user_faces table is updated
    try {
      const { error: userFacesError } = await supabase
        .from('user_faces')
        .insert({
          user_id: user.id,
          face_id: faceId
        })
        .onConflict(['user_id', 'face_id'])
        .merge();
      
      if (userFacesError) {
        console.error('Error updating user_faces table:', userFacesError);
      } else {
        console.log('Successfully updated user_faces table');
      }
    } catch (facesError) {
      console.error('Exception updating user_faces table:', facesError);
    }
  }
} catch (attributeError) {
  console.error('Exception during face attribute verification:', attributeError);
} 