// === Series Directory Scanner (calls local API) ===
async function scanSeriesDirectory(title) {
  try {
    console.log('Scanning directory for series:', title);
    const resp = await fetch(`http://localhost:3000/api/scan?title=${encodeURIComponent(title)}`);
    
    if (!resp.ok) {
      console.error('API scan failed', resp.statusText);
      return null;
    }
    
    const data = await resp.json();
    console.log('API response:', data);
    
    if (data && data.episodes) {
      return data.episodes;
    }
    
    return null;
  } catch (err) {
    console.error('Error calling scan API:', err);
    return null;
  }
}

// Add click handlers when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Setting up click handlers for carousel items');
  document.querySelectorAll('.carousel-item').forEach(item => {
    item.addEventListener('click', async () => {
      const title = item.querySelector('h3').textContent.trim();
      console.log('Clicked series:', title);
      
      try {
        const episodes = await scanSeriesDirectory(title);
        console.log('Scanned episodes:', episodes);
        
        if (episodes && Object.keys(episodes).length > 0) {
          const params = new URLSearchParams({
            title: title,
            episodes: JSON.stringify(episodes)
          });
          const url = `details.html?${params.toString()}`;
          console.log('Redirecting to:', url);
          location.href = url;
        } else {
          console.error('No episodes found in directory');
          const url = `details.html?title=${encodeURIComponent(title)}`;
          location.href = url;
        }
      } catch (error) {
        console.error('Error handling series click:', error);
        const url = `details.html?title=${encodeURIComponent(title)}`;
        location.href = url;
      }
    });
  });
});