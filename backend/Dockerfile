FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

ARG INSTALL_DEV=false
RUN if [ "$INSTALL_DEV" = "true" ]; then npm ci; else npm ci --omit=dev; fi

COPY . .

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["npm", "start"]
