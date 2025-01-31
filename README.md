# Important Docker Information!
If You Changed the File Structure (Renamed/Added/Deleted Files or Folders)
Rebuild the Image and Restart

This is because docker caches builds:

```
docker-compose down
docker-compose build --no-cache
docker-compose up
```

This ensures all are changes to project structure are reflected inside the container, and hopefully avoids docker eroors. 

