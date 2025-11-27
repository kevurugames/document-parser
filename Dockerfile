FROM node:20-bookworm

RUN apt-get update && apt-get install -y python3 python3-pip wget && \
    pip3 install --break-system-packages pymupdf pymupdf4llm && \
    wget -qO- https://github.com/jgm/pandoc/releases/download/3.8.2.1/pandoc-3.8.2.1-linux-amd64.tar.gz | tar xz -C /opt && \
    rm -rf /var/lib/apt/lists/*

ENV PANDOC_PATH=/opt/pandoc-3.8.2.1/bin/pandoc

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY index.js .

ENV PORT=5003
EXPOSE 5003

CMD ["npm", "start"]
