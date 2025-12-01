# Serviço de Gerenciamento de Veículos

Uma API REST para gerenciar o inventário de veículos construída com Express.js, TypeScript e Prisma.

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Desenvolvimento](#desenvolvimento)
- [Testes](#testes)
  - [Testes Unitários](#testes-unitários)
  - [Testes de Integração](#testes-de-integração)
- [Endpoints da API](#endpoints-da-api)

## Pré-requisitos

- **Node.js** 22 ou superior
- **Docker** e **Docker Compose**
- **k6** (para testes de integração)

### Instalando o k6

O k6 é necessário para executar os testes de integração. Instale-o de acordo com o seu sistema operacional:

#### macOS (Homebrew)

```bash
brew install k6
```

#### Windows (Chocolatey)

```bash
choco install k6
```

#### Windows (winget)

```bash
winget install k6 --source winget
```

#### Linux (Debian/Ubuntu)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Linux (Fedora/RHEL)

```bash
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

#### Docker (Alternativa)

```bash
docker pull grafana/k6
```

Para mais opções de instalação, visite: https://k6.io/docs/get-started/installation/

## Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

4. Inicie o ambiente de desenvolvimento:

```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

5. Execute as migrações do banco de dados:

```bash
npm run prisma:migrate
```

## Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Ou usando Docker Compose:

```bash
docker-compose -f infra/docker/docker-compose.yml up
```

O servidor estará disponível em `http://localhost:3000`.

## Testes

### Testes Unitários

Execute os testes unitários com cobertura:

```bash
npm test
```

Execute os testes em modo watch:

```bash
npm run test:watch
```

### Testes de Integração

Os testes de integração usam k6 para testar os endpoints da API contra um banco de dados real.

**Pré-requisitos:**
- Docker e Docker Compose instalados
- k6 instalado (veja [Instalando o k6](#instalando-o-k6))

Execute os testes de integração:

```bash
npm run test:integration
```

Este comando irá:
1. Iniciar PostgreSQL e a aplicação em containers Docker
2. Aguardar o serviço ficar saudável
3. Executar os testes de integração com k6
4. Parar e limpar os containers

**Testes de integração manuais:**

Se você quiser executar os testes manualmente:

```bash
# Inicie o ambiente de teste
docker-compose -f infra/docker/docker-compose.test.yml up -d

# Aguarde os serviços ficarem prontos
docker-compose -f infra/docker/docker-compose.test.yml exec app wget -q --spider http://localhost:3000/health

# Execute os testes k6
k6 run k6/integration-tests.js

# Pare e limpe
docker-compose -f infra/docker/docker-compose.test.yml down -v
```

## Endpoints da API

### Health Check

- `GET /health` - Verifica a saúde do serviço

### Veículos

- `GET /api/vehicles` - Lista todos os veículos (suporta filtros de query: `status`, `brand`, `year`)
- `POST /api/vehicles` - Cria um novo veículo
- `GET /api/vehicles/:id` - Obtém veículo por ID
- `PUT /api/vehicles/:id` - Atualiza veículo
- `DELETE /api/vehicles/:id` - Deleta veículo

### Schema do Veículo

```json
{
  "brand": "string (obrigatório)",
  "model": "string (obrigatório)",
  "year": "number (1900 - ano atual + 1)",
  "color": "string (obrigatório)",
  "price": "number (positivo)",
  "status": "AVAILABLE | SOLD (padrão: AVAILABLE)"
}
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 3000 |
| `DATABASE_URL` | URL de conexão PostgreSQL | - |
| `SALES_SERVICE_URL` | URL do serviço de vendas para sincronização | - |
| `NODE_ENV` | Ambiente (development, test, production) | development |

## Deploy no Kubernetes (Minikube)

Este serviço pode ser implantado em um cluster Minikube local.

### Pré-requisitos

- **Minikube** instalado e em execução
- **kubectl** configurado para usar Minikube
- **Docker** (para construir imagens)

#### Instalando o Minikube

**macOS (Homebrew):**
```bash
brew install minikube
```

**Linux:**
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

**Windows:**
```bash
# Usando Chocolatey
choco install minikube

# Ou baixe de: https://minikube.sigs.k8s.io/docs/start/
```

**Iniciar Minikube:**
```bash
minikube start
```

**Verificar instalação:**
```bash
minikube status
kubectl get nodes
```

**Nota:** Certifique-se de que o Minikube está em execução antes de usar os comandos `k8s:*`. Se você ver um erro como "cluster does not exist", execute `minikube start` primeiro.

### Construindo e Implantando

**Início Rápido (Tudo em um):**

```bash
npm run k8s:start
```

Isso irá construir a imagem Docker, carregá-la no Minikube e implantar todos os recursos do Kubernetes.

**Passo a passo:**

1. **Construa a imagem Docker:**

```bash
npm run k8s:build
```

Ou manualmente:

```bash
docker build -f infra/docker/Dockerfile -t vehicle-management-service:latest .
```

2. **Carregue a imagem no Minikube:**

```bash
npm run k8s:load
```

3. **Aplique os manifests do Kubernetes:**

```bash
npm run k8s:deploy
```

Isso irá criar:
- StatefulSet do PostgreSQL com PersistentVolumeClaim
- ConfigMap com configuração da aplicação
- Secret com credenciais do banco de dados
- Deployment para o serviço de gerenciamento
- Service do tipo LoadBalancer

4. **Obtenha a URL do serviço:**

```bash
npm run k8s:url
```

**Acessando o Serviço do Postman/Ferramentas Externas:**

Existem várias formas de acessar os serviços:

**Opção 1: Usando Minikube Service Tunnel (Recomendado)**
```bash
minikube service vehicle-management-service --url
```
Isso irá exibir uma URL como `http://127.0.0.1:XXXXX` que você pode usar diretamente no Postman.

**Opção 2: Usando NodePort com IP do Minikube**
```bash
# Obtenha o IP do Minikube
minikube ip

# Acesse o serviço (substitua <MINIKUBE_IP> pelo IP real)
http://<MINIKUBE_IP>:<NODE_PORT>
```

Para encontrar o NodePort:
```bash
kubectl get service vehicle-management-service -o jsonpath='{.spec.ports[0].nodePort}'
```

**Opção 3: Usando kubectl port-forward (Recomendado para Postman)**
```bash
npm run k8s:port-forward
```
Ou manualmente:
```bash
kubectl port-forward service/vehicle-management-service 3000:80
```
Depois acesse via: `http://localhost:3000`

**Nota:** Mantenha o comando port-forward em execução em um terminal enquanto usa o Postman. A conexão estará ativa enquanto o comando estiver rodando.

**Outros comandos úteis:**

- `npm run k8s:logs` - Visualiza os logs da aplicação
- `npm run k8s:status` - Verifica o status dos pods, serviços e deployments
- `npm run k8s:restart` - Reinicia o deployment
- `npm run k8s:delete` - Deleta todos os recursos do Kubernetes

### Notas Importantes

- **URL do Serviço de Vendas**: Após implantar o serviço de vendas, atualize o `SALES_SERVICE_URL` em `infra/k8s/configmap.yaml` com a URL real do serviço de vendas do Minikube, depois execute `kubectl apply -f infra/k8s/configmap.yaml` para atualizar a configuração.

- **Credenciais do Banco de Dados**: As credenciais padrão estão em `infra/k8s/secret.yaml` (codificadas em base64). Altere-as para uso em produção.

- **Service Discovery**: A URL do serviço de vendas no ConfigMap usa DNS de serviço do Kubernetes (`http://vehicle-sales-service:80`). Se você precisar da URL externa, atualize-a após obter a URL do serviço do Minikube.

### Atualizando a Configuração

Para atualizar a URL do serviço de vendas após o serviço de vendas ser implantado:

1. Obtenha a URL do serviço de vendas:
```bash
minikube service vehicle-sales-service --url
```

2. Atualize `infra/k8s/configmap.yaml` com a URL
3. Aplique o ConfigMap atualizado:
```bash
kubectl apply -f infra/k8s/configmap.yaml
```

4. Reinicie o deployment para aplicar as mudanças:
```bash
kubectl rollout restart deployment/vehicle-management-service
```

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento com hot reload |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm run docker:build` | Constrói a imagem Docker do serviço |
| `npm test` | Executa testes unitários com cobertura |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run test:integration` | Executa testes de integração com k6 |
| `npm run lint` | Executa ESLint |
| `npm run lint:fix` | Corrige erros do ESLint |
| `npm run format` | Formata o código com Prettier |
| `npm run prisma:migrate` | Executa migrações do Prisma |
| `npm run prisma:generate` | Gera o cliente Prisma |
| `npm run prisma:studio` | Abre o Prisma Studio |
| `npm run k8s:build` | Constrói a imagem Docker para Kubernetes |
| `npm run k8s:load` | Carrega a imagem Docker no Minikube |
| `npm run k8s:deploy` | Implanta os manifests do Kubernetes |
| `npm run k8s:start` | Constrói, carrega e implanta no Kubernetes (tudo em um) |
| `npm run k8s:url` | Obtém a URL do serviço do Minikube |
| `npm run k8s:port-forward` | Faz port-forward do serviço para localhost (use para Postman) |
| `npm run k8s:logs` | Visualiza os logs da aplicação |
| `npm run k8s:status` | Verifica o status dos recursos do Kubernetes |
| `npm run k8s:restart` | Reinicia o deployment do Kubernetes |
| `npm run k8s:delete` | Deleta todos os recursos do Kubernetes |
