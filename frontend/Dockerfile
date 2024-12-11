# Use an official Node.js image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Install react-scripts globally
RUN npm install -g react-scripts

# Copy the rest of the application code
COPY . .

# Expose port 3000 (this is the port React runs on)
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]