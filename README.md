# Trabalho Final de Integração de Sistemas

## Engenharia Informática

**Ano Letivo:** 2024/2025

**Autores:** Jorge Ribeiro e Leonardo Magalhães

---

## Descrição do Projeto

O objetivo deste trabalho prático final é desenvolver um sistema integrado que permita a comunicação entre diferentes tecnologias: gRPC (RPC Server), REST API, GraphQL e RabbitMQ. Cada módulo está isolado em containers Docker e utiliza volumes partilhados para armazenamento de ficheiros CSV e XML.

---

## Tecnologias Utilizadas

- Python
- Docker & Docker Compose
- gRPC
- Django REST Framework
- GraphQL
- RabbitMQ
- PostgreSQL
- XPATH/XQuery
- Nominatim Search API

---

## Requisitos Implementados

### 1. RPC Server (gRPC)
- Conversão CSV para XML com validação.
- Consulta XML usando XPath/XQuery (pesquisa, filtros, agrupamento, ordenação).
- Integração com PostgreSQL para persistência dos dados.

### 2. REST API
- Desenvolvida com Django REST Framework.
- Endpoints específicos para comunicação direta com o RPC server.

### 3. GraphQL
- Consultas diretas à base PostgreSQL.
- Consulta via REST API com intermediação do RabbitMQ.

### 4. RabbitMQ
- Comunicação assíncrona entre GraphQL Server e REST API.

### 5. Frontend
- Interface para realizar consultas através da REST API e GraphQL.

---

## Volumes Docker
- **csv**: Local para armazenamento dos ficheiros CSV a serem importados.
- **xml**: Local para armazenamento dos ficheiros XML gerados.

---

## Execução do Projeto

### Pré-requisitos
- Docker instalado
- Docker Compose instalado

### Instruções de Execução
1. Clonar o repositório:
```bash
git clone <URL_DO_REPOSITÓRIO>
```

2. Navegar até ao diretório do projeto:
```bash
cd project
```
3. Iniciar os containers Docker:
```bash
docker-compose up --build
```
