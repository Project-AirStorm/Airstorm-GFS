# Important Docker Information!
If You Changed the File Structure (Renamed/Added/Deleted Files or Folders)
Rebuild the Image and Restart

This is because docker caches builds:

```
docker compose down
docker compose build --no-cache
docker compose up
```

This ensures all are changes to project structure are reflected inside the container, and hopefully avoids docker eroors. 

## Command to rebuild docker image (useful after installing new dependency)
```
docker images
docker build -t <image_name> .
```

## Command to enter the docker container and inspect it
```
docker compose exec backend bash 
docker compose exec frontend bash 
```
## Command to enter the MySQL server
docker-compose exec mysql bash
mysql -u root -p
```