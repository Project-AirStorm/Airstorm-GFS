# Getting started
To get started clone this repository:

# 1. Install Docker 
Docker will make dependency management in this process exponentially easier and will fix the "it works on my machine" problems that we may encounter while working on this project. Docker works by storing all of the dependencies for our project in a virtualized "container" so that you need only run the docker container and avoid dependency conflicts installed as if you installed them locally. 

### Windows 
 https://docs.docker.com/desktop/setup/install/windows-install/
### Linux 
https://docs.docker.com/desktop/setup/install/linux/
### Mac
https://docs.docker.com/desktop/setup/install/mac-install/

Verify the installation is working by executing the command: `docker --version`

# 2. Install Docker Compose 

### Windows & Mac 
Docker Desktop is available for Windows and MacOS: https://www.docker.com/products/docker-desktop/
### Linux (this likely also works on Mac)
Download from the latest release from the repo:
`sudo curl -L "https://github.com/docker/compose/releases/download/v2.31.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose`  

Make it Executable & Verify Installation: 
- `sudo chmod +x /usr/local/bin/docker-compose`
- `docker-compose --version`

## Run the entire application
The application is split into two containers
docker-compose up --build

# 3. Backend Development (Flask)
**Dependency management**  
Pip is a package management system we will use in the backend. 
1. Create a virtual environment: `python3 -m venv venv`  
2. Activate the virtual environment: `source venv/bin/activate`   
3. Whenever you install a new dependency via `pip` ensure that you freeze it with `pip freeze > requirements.txt` so that it is housed within the docker image. 

