FROM node:22-alpine AS build
WORKDIR /app

# העתקת קבצי ניהול תלויות (מינימום)
COPY package.json package-lock.json ./
RUN npm ci

# העתקת כל הפרויקט ובנייה
COPY . .
RUN npm run build

FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
