# Stage 1: Build
FROM node:20-alpine as build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx for production-grade performance and SPA routing
FROM nginx:alpine

# Copy built files from the build stage to Nginx directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Replace default config with our custom one to enable SPA routing
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
