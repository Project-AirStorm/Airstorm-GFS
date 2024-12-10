# Use an official Node.js image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package files first (this is important for caching)
COPY package.json package-lock.json ./

# Install dependencies with clean npm install
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]