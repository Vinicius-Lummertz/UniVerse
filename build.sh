#!/usr/bin/env bash
# Sair imediatamente se um comando falhar
set -o errexit

# 1. Instalar as dependências do Python
pip install -r core/requirements.txt

# 2. Correr o 'collectstatic' do Django
# (Isto recolhe o CSS/JS do Admin para o STATIC_ROOT)
python core/manage.py collectstatic --noinput

# 3. Correr as migrações do banco de dados
python core/manage.py migrate