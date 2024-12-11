# Use an official Node.js image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Possible fix!
RUN rm -rf node_modules && npm cache clean --force

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 3000 (this is the port React runs on)
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]
