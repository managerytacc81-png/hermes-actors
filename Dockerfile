FROM apify/actor-node:20
COPY packages.json ./
RUN npm --quiet set progress=false \
 && npm install --omit=dev --omit=optional \
 && echo "Installed NPM packages:" && (npm list --omit=dev --all | head -20)
COPY . ./
CMD npm start --silent
