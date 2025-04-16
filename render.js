const selectFolderBtn = document.getElementById('select-folder');
const playlist = document.getElementById('playlist');
const player = document.getElementById('player');

selectFolderBtn.addEventListener('click', async () => {
  const files = await window.electronAPI.openFolder();
  playlist.innerHTML = '';

  files.forEach(file => {
    const li = document.createElement('li');
    li.textContent = file.name;
    li.addEventListener('click', () => {
      player.src = file.path;
      player.play();
    });
    playlist.appendChild(li);
  });
});
