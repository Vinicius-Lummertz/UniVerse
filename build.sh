#!/usr/bin/env bash
set -o errexit

# 1. Instalar as dependências (isto está correto)
pip install -r core/requirements.txt

# --- INÍCIO DA CORREÇÃO ---

# 2. Definir o PYTHONPATH
# Diz ao Python para procurar módulos na raiz do projeto (onde 'config' está)
# E também dentro da pasta 'core' (onde 'manage.py' está)
export PYTHONPATH=".:./core"

# 3. Correr o 'collectstatic'
# Agora especificamos explicitamente onde estão os settings
python core/manage.py collectstatic --settings=config.settings --noinput

# 4. Correr as migrações
python core/manage.py migrate --settings=config.settings

# --- FIM DA CORREÇÃO ---