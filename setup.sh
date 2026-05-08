#!/bin/bash

# Script de Setup Automático para Argos IT Pro

set -e

echo "🚀 Argos IT Pro - Setup Automático"
echo "=================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Verificar Node.js
echo -e "\n${YELLOW}1. Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# 2. Verificar Docker (opcional)
echo -e "\n${YELLOW}2. Verificando Docker...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker disponible${NC}"
    USE_DOCKER=true
else
    echo -e "${YELLOW}⚠️  Docker no encontrado (opcional)${NC}"
    USE_DOCKER=false
fi

# 3. Copiar .env
echo -e "\n${YELLOW}3. Configurando variables de entorno...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ .env creado${NC}"
    echo -e "${RED}⚠️  EDITA .env Y AGREGA TU OPENAI_API_KEY${NC}"
else
    echo -e "${YELLOW}✓ .env ya existe${NC}"
fi

# 4. Backend Setup
echo -e "\n${YELLOW}4. Setup Backend...${NC}"
cd backend
npm install
echo -e "${GREEN}✅ Backend dependencias instaladas${NC}"
cd ..

# 5. Frontend Setup
echo -e "\n${YELLOW}5. Setup Frontend...${NC}"
cd frontend
npm install
echo -e "${GREEN}✅ Frontend dependencias instaladas${NC}"
cd ..

# 6. Base de Datos
if [ "$USE_DOCKER" = true ]; then
    echo -e "\n${YELLOW}6. Iniciando Docker...${NC}"
    docker-compose -f docker/docker-compose.yml up -d
    echo -e "${GREEN}✅ Servicios Docker iniciados${NC}"
    echo -e "${YELLOW}Esperando PostgreSQL...${NC}"
    sleep 5
else
    echo -e "\n${YELLOW}6. Base de Datos${NC}"
    echo -e "${YELLOW}Asegúrate de que PostgreSQL está corriendo en localhost:5432${NC}"
    echo -e "${YELLOW}Ejecuta: psql -U postgres -d argos_it < database/schema.sql${NC}"
fi

# 7. Mensaje final
echo -e "\n${GREEN}✅ Setup completado!${NC}"
echo -e "\n${YELLOW}Próximos pasos:${NC}"
if [ "$USE_DOCKER" = true ]; then
    echo "1. El backend está en http://localhost:4000"
    echo "2. El frontend está en http://localhost:3000"
    echo "3. Abre http://localhost:3000 en tu navegador"
    echo "4. Ver logs: docker-compose -f docker/docker-compose.yml logs -f"
else
    echo "1. En Terminal 1: cd backend && npm run dev"
    echo "2. En Terminal 2: cd frontend && npm run dev"
    echo "3. En Terminal 3: psql -U postgres -d argos_it < database/schema.sql"
    echo "4. Abre http://localhost:3000"
fi

echo -e "\n${GREEN}¡Listo para programar! 🎯${NC}\n"
