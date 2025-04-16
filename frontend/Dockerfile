# Use a newer Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies - combine all npm installs into one command to reduce layers
RUN npm cache clean --force && \
    npm install && \
    npm install -g react-scripts && \
    npm install --save \
    react-image-crop \
    lucide-react@0.263.1 \
    react-icons@4.x.x \
    @maptiler/sdk \
    recharts \
    maplibre-gl \
    axios \
    react-feather \
    @clerk/themes \
    three \
    dotenv \
    stream-chat \
    stream-chat-react \
    @stream-io/stream-chat-css \
    crypto-js

# Hotfix ESLINT error
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# Copy the rest of the application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]