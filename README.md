# Important Docker Information!
If you change the file structure (Renamed/Added/Deleted Files or Folders)
Rebuild the Image and Restart

This is because Docker caches builds:

```
docker compose down
docker compose build --no-cache
docker compose up
```

This ensures all are changes to project structure are reflected inside the container, and hopefully avoids docker errors. 

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
```
docker-compose exec mysql bash
mysql -u root -p
```

## Complete hard reset
```
docker-compose down
docker system prune -f
docker volume prune -f
docker network prune -f
rm -rf frontend/node_modules
rm -rf frontend/package-lock.json
```

##  Temporary test for generating SKEWTs
```
curl -X POST -H "Content-Type: application/json" \
-d '{"lat":52.537,"lon":13.376,"days":1,"user_id":"user_2sirXuIdmQh7eiB3GwHxZlcQYbI"}' \
http://localhost:5001/api/charts/generate