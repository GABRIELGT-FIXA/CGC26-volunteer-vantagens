# Deploy na VPS com PM2

Guia para hospedar o Volunteer Vantagens numa VPS Linux (Ubuntu/Debian) usando PM2.
O banco (Neon) e o WhatsApp (Evolution) são serviços externos — nada de banco para instalar.

---

## 1. Pré-requisitos na VPS

```bash
# Node.js 20+ (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20

# PM2 e Git
npm install -g pm2
sudo apt update && sudo apt install -y git
```

---

## 2. Clonar o repositório (privado)

O repositório é privado, então use um Personal Access Token do GitHub:

```bash
cd ~
git clone https://github.com/GABRIELGT-FIXA/CGC26-volunteer-vantagens.git
# Usuário: GABRIELGT-FIXA
# Senha: cole o Personal Access Token (não a senha da conta)
cd CGC26-volunteer-vantagens
```

---

## 3. Configurar variáveis de ambiente

### Backend (`backend/.env`)

```bash
nano backend/.env
```

```env
DATABASE_URL=postgresql://USER:PASS@HOST-pooler.../neondb?sslmode=require&channel_binding=require
DIRECT_URL=postgresql://USER:PASS@HOST.../neondb?sslmode=require&channel_binding=require

JWT_SECRET=troque_por_um_secret_forte
JWT_REFRESH_SECRET=troque_por_outro_secret_forte
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

PORT=3001
UPLOAD_DIR=./uploads
TIMEZONE=America/Sao_Paulo

EVOLUTION_API_URL=https://sua-evolution.com
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE=admin

ADMIN_PHONE=11999999999
ADMIN_PASSWORD=senha_admin_forte
```

### Frontend (`frontend/.env.local`)

```bash
nano frontend/.env.local
```

```env
# Use o domínio/IP público da VPS apontando para o backend
NEXT_PUBLIC_API_URL=https://seudominio.com/api
```

---

## 4. Instalar, migrar e buildar

```bash
# Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:push      # cria as tabelas (só na primeira vez)
npm run prisma:seed      # cria o admin (só na primeira vez)
npm run build            # gera dist/
cd ..

# Frontend
cd frontend
npm install
npm run build            # gera .next/
cd ..
```

---

## 5. Subir com PM2

```bash
pm2 start ecosystem.config.js
pm2 save                 # salva a lista de processos
pm2 startup              # gera o comando para iniciar no boot (rode o que ele mostrar)
```

Comandos úteis:

```bash
pm2 status               # ver status
pm2 logs                 # ver logs (todos)
pm2 logs cgc26-backend   # logs só do backend
pm2 restart all          # reiniciar tudo
pm2 stop all             # parar tudo
```

---

## 6. Nginx como proxy reverso (recomendado)

Backend roda na 3001, frontend na 3000. O Nginx expõe tudo na porta 80/443.

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/cgc26
```

```nginx
server {
    listen 80;
    server_name seudominio.com;

    client_max_body_size 10M;   # uploads de foto

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API (Express) + arquivos enviados
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cgc26 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS gratuito (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

> **Importante:** o app só permite câmera (check-in, foto de perfil) em contexto seguro — **HTTPS é obrigatório** para a câmera funcionar fora de `localhost`.

---

## 7. Atualizações futuras

```bash
cd ~/CGC26-volunteer-vantagens
git pull
cd backend && npm install && npm run build && cd ..
cd frontend && npm install && npm run build && cd ..
pm2 restart all
```
