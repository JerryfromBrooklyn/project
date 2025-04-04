// ... existing code ...

// After capturing the face image and getting face attributes:
// Find this section in handleRegister or saveFaceData
// where the face registration is complete

// Example location:
// After the successful face registration but before the final success message

// Add this code to verify face attributes were saved
try {
  console.log('Verifying face attributes are saved in the user profile...');
  
  // Use the admin function to verify face data
  const { data: verifyResult, error: verifyError } = await supabase.rpc(
    'admin_check_user_face_attributes',
    { p_user_id: userId }
  );
  
  if (verifyError) {
    console.error('Error verifying face attributes:', verifyError);
  } else {
    console.log('Face attribute verification result:', verifyResult);
    
    // If verification shows missing data, try to save it directly
    if (!verifyResult.user_data?.has_user_record || !verifyResult.face_data?.has_face_data) {
      console.log('Face attributes not properly saved, attempting direct save...');
      
      // Try direct admin function
      const { data: updateResult, error: updateError } = await supabase.rpc(
        'admin_update_user_face_attributes',
        {
          p_user_id: userId,
          p_face_id: faceId,
          p_attributes: attributes
        }
      );
      
      if (updateError) {
        console.error('Error saving face attributes via admin function:', updateError);
      } else {
        console.log('Face attributes saved successfully via admin function:', updateResult);
      }
    } else {
      console.log('Face attributes already saved correctly');
    }
  }
} catch (attributeError) {
  console.error('Exception during face attribute verification:', attributeError);
}

// Continue with existing code for completion message
// ... existing code ... 