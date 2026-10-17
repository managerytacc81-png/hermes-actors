FROM apify/actor-node:20
COPY package.json ./
RUN npm --quiet set progress=false \
 && npm install --omit=dev --omit=optional \
 && echo "Node:" && node --version
COPY . ./
CMD npm start --silent
