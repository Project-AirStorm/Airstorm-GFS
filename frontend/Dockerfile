# Use an official Node.js image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies including MapTiler SDK and other requirements
RUN npm install && \
    npm install -g react-scripts && \
    npm install react-icons --save && \
    npm install @maptiler/sdk && \
    npm install recharts && \
    npm install maplibre-gl && \
    npm cache clean --force

# Hotfix ESLINT error
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# Copy the rest of the application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]
