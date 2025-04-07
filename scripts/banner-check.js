
  setTimeout(() => {
    console.log('\n🔍 Running banner visibility check...');
    if (window.diagnoseBannerIssues) {
      window.diagnoseBannerIssues();
    } else {
      console.log('❌ Banner diagnostic tool not available');
    }
  }, 5000);
  