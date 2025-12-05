// Új kód a netflix-player.html végére:
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const src = params.get('src');
    const title = params.get('title');
    const embedded = params.get('embedded') === 'true';
    
    if (src) {
        const sourceEl = document.getElementById('videoSource');
        const srcDecoded = decodeURIComponent(src);
        sourceEl.src = srcDecoded;
        
        // Set correct type for MKV files
        if (srcDecoded.toLowerCase().endsWith('.mkv')) {
            sourceEl.type = 'video/x-matroska';
        }
        
        video.load();

        // Ne menjen teljes képernyőre, ha beágyazott módban van
        if (!embedded) {
            document.querySelector('.fullscreen-video').style.display = 'flex';
        }
    }
    
    if (title) {
        document.querySelector('.title').textContent = decodeURIComponent(title);
        document.title = decodeURIComponent(title) + ' - Netflix Player';
    }
});