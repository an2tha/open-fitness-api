FROM node:22-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY apps/web/.next/standalone ./
COPY apps/web/.next/static ./.next/static
COPY apps/web/.next/static ./apps/web/.next/static
COPY apps/web/public ./public
COPY apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["sh", "-c", "if [ -f server.js ]; then exec node server.js; elif [ -f apps/web/server.js ]; then exec node apps/web/server.js; else echo 'server.js not found'; exit 1; fi"]
