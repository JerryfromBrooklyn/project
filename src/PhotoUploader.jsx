import React from 'react';
import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import { Dashboard } from '@uppy/react';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

const PhotoUploader = () => {
  const uppy = new Uppy({
    autoProceed: false,
    restrictions: { allowedFileTypes: ['image/*'] },
  }).use(AwsS3, {
    async getUploadParameters(file) {
      // Fetch a presigned URL from your backend
      const response = await fetch('/api/s3-presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { url } = await response.json();
      return {
        method: 'PUT',
        url: url,
        headers: { 'Content-Type': file.type },
      };
    },
  });

  uppy.on('complete', (result) => {
    console.log('Upload complete:', result.successful);
  });

  return (
    <div>
      <Dashboard uppy={uppy} />
    </div>
  );
};

export default PhotoUploader;
