import SimplePhotoUpload from './components/workaround/SimplePhotoUpload';

function App() {
  return (
    <div className="app-container">
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Workaround Solution</h2>
        <p className="mb-4">Use this simplified uploader until the database issue is fixed:</p>
        <SimplePhotoUpload />
      </div>
    </div>
  );
}

export default App; 