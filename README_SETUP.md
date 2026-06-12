# Setup rápido para ejecutar el proyecto localmente

Pasos resumidos:

1. Instalar dependencias del sistema (Node.js, npm, paquetes python venv). En Debian/Ubuntu:

```bash
sudo apt update
# instalar Python venv
sudo apt install -y python3-venv python3-pip
# instalar Node.js (usa NodeSource para una versión reciente)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

2. Instalar dependencias Node y Python en el proyecto:

```bash
# desde la raíz del repo
npm install

# crear y activar virtualenv para Python (emulador)
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements-emulator.txt
```

3. Configurar la base de datos PostgreSQL:

Opción rápida con Docker (recomendado si no quieres instalar Postgres localmente):

```bash
docker run --name bands-postgres -e POSTGRES_USER=bands_user -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=bands_db -p 5432:5432 -d postgres:15
```

Rellena `.env` con los valores correctos (puedes copiar `.env.example`).

4. Inicializar esquema y arrancar la API:

```bash
# exportar variables desde .env
set -a; source .env; set +a
# ejecutar migraciones y arrancar
npm run migrate
npm start
```

5. Ejecutar el emulador MQTT (opcional):

```bash
# activar .venv antes
source .venv/bin/activate
python3 simulador/main.py
```

Si quieres, puedo intentar instalar los paquetes de sistema (Node.js, python3-venv) automáticamente ahora — necesitaré permiso sudo. ¿Deseas que lo haga? 
