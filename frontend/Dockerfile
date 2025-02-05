# Use an official Node.js image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm cache clean --force && \
    npm install && \
    npm install -g react-scripts && \
    npm install --save lucide-react@0.263.1 && \
    npm install --save react-icons@4.x.x && \
    npm install --save @maptiler/sdk && \
    npm install --save recharts && \
    npm install --save maplibre-gl && \
    npm install --save axios \
    npm install react-feather

# Hotfix ESLINT error
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# Copy the rest of the application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]