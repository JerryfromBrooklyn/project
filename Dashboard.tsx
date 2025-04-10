import PhotoMatchStats from './photo-match-dashboard';

// ... existing Dashboard function ...

// In the return statement of the Dashboard component, add the PhotoMatchStats component
return (
  <div className="dashboard-container">
    {/* ... existing dashboard content ... */}
    
    {/* Add PhotoMatchStats component */}
    {user && <PhotoMatchStats userId={user} />}
    
    {/* ... rest of existing content ... */}
  </div>
); 