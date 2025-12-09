// Csak a valós oldalak
const categories = [
  "/home.html",
  "/movies.html",
  "/series.html",
  "/animes.html"
];

// JAVÍTVA: A megadott Windows elérési utak alapján
// 1. E:\TVZone\data\Movies\Batman Begins.mp4 -> /video/Movies/Batman%20Begins.mp4
// 2. E:\TVZone\data\Series\Sherlock\Season 1\A Study in Pink.mp4 -> /video/Series/Sherlock/Season%201/A%20Study%20in%20Pink.mp4
const mockVideos = [
  { 
    title: "Batman Begins", 
    path: "/video/Movies/Batman%20Begins.mp4" 
  },
  { 
    title: "Sherlock", 
    path: "/video/Series/Sherlock/Season%201/A%20Study%20in%20Pink.mp4" 
  }
];

function generateUser(context, events, done) {
  const randomId = Math.floor(Math.random() * 100000);
  const username = `user${randomId}`;
  context.vars.username = username;
  context.vars.email = `${username}@test.com`;
  context.vars.password = "pass123";
  return done();
}

function randomNavigation(context, events, done) {
  const idx = Math.floor(Math.random() * categories.length);
  context.vars.navUrl = categories[idx];
  return done();
}

function getVideoPath(context, events, done) {
  const video = mockVideos[Math.floor(Math.random() * mockVideos.length)];
  context.vars.videoTitle = encodeURIComponent(video.title);
  context.vars.videoPath = video.path;
  return done();
}

module.exports = {
  generateUser,
  randomNavigation,
  getVideoPath
};