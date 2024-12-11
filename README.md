# Getting started
To get started clone this repository:

# 1. Install Docker Deskop
Docker works by storing all of the dependencies for our project in a virtualized "container" so that you need only run the docker container. This helps avoid dependency conflicts that could arise if they were installed on the machine locally. By working in the same environment, this will help reduce problems that could arise as a result of us developing on different machines. 

https://www.docker.com/products/docker-desktop/

Verify the installation is working by executing the command: `docker --version`

# 2. Backend Development (Flask)
**Dependency management**  
All dependencies for the backend are stored within the `requirements.txt` file. Pip is the package management system we will use in the backend to manage these dependencies. Take a look at `requirements.txt`, it is just a plaintext file. 

**Important**  
Whenever a new package needs to be installed, you need to take these steps:
1. Ensure you are within a virtual environment: `python3 -m venv venv`  
2. Activate the virtual environment: `source venv/bin/activate`   
3. Whenever you install a new dependency via `pip` ensure that you freeze it with `pip freeze > requirements.txt` so that it is housed within the docker image. 

It is necessary that whenever you install a new package, you run the the command `pip freeze > requirements.txt`. This ensures that the dependencies are installed within the docker container so that when someone else pulls down your changes, they have access to the most recent version of the application with the required dependencies.

# 4. Frontend Development (React)
Whenever you install a new npm package within React, all of the dependencies are stored within a JSON file: `package.json`. Whenever you run the docker container, it should automatically install these dependencies.  
