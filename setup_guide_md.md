# 🤖 Discord GitHub Bot - Guia Completo de Configuração

## 🚀 Instalação Local

### 1. Clone e instale dependências

```bash
# Clone o repositório
git clone seu-repo.git
cd discord-github-bot

# Instale as dependências
npm install
```

### 2. Crie o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto (veja seção Variáveis de Ambiente)

### 3. Execute o bot

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

---

## 🎮 Configuração do Discord

### 1. Criar o Bot

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em **New Application**
3. Dê um nome ao bot (ex: "GitHub Issues Bot")
4. Vá em **Bot** no menu lateral
5. Clique em **Add Bot**
6. **Copie o Token** e guarde (vai no `.env` como `DISCORD_TOKEN`)

### 2. Configurar Permissões

Ainda na aba **Bot**:

- ✅ Ative **MESSAGE CONTENT INTENT**
- ✅ Ative **SERVER MEMBERS INTENT**
- ✅ Ative **PRESENCE INTENT**

### 3. Adicionar o Bot ao Servidor

1. Vá em **OAuth2 → URL Generator**
2. Selecione os **scopes**:
   - ✅ `bot`
3. Selecione as **permissões**:
   - ✅ Send Messages
   - ✅ Create Public Threads
   - ✅ Send Messages in Threads
   - ✅ Read Message History
4. Copie a URL gerada e abra no navegador
5. Selecione seu servidor e autorize

### 4. Copiar IDs dos Canais

No Discord (ative o Modo Desenvolvedor em Configurações → Avançado):

1. **Canal de Triagem** (onde users criam threads → viram issues):
   - Clique direito no canal → **Copiar ID**
   - Cole no `.env` como `TRIAGE_CHANNEL_ID`

2. **Canal de Epics** (onde o bot cria threads de epics/stories):
   - Clique direito no canal → **Copiar ID**
   - Cole no `.env` como `EPIC_CHANNEL_ID`

---

## 🔑 Configuração do GitHub

### 1. Criar Personal Access Token (Classic)

1. Acesse [GitHub Settings → Developer Settings](https://github.com/settings/tokens)
2. Vá em **Personal access tokens → Tokens (classic)**
3. Clique em **Generate new token (classic)**
4. Configure:
   - **Note:** `Discord Bot Integration`
   - **Expiration:** Escolha a duração (recomendado: 90 dias ou No expiration)
   - **Scopes necessários:**
     - ✅ `repo` (acesso completo a repositórios)
     - ✅ `write:discussion` (para GitHub Projects v2)
     - ✅ `read:org` (se usar repos de organização)
5. Clique em **Generate token**
6. **⚠️ COPIE O TOKEN AGORA** (não vai aparecer novamente!)
7. Cole no `.env` como `GITHUB_TOKEN=ghp_xxxxx`

### 2. Criar/Configurar Repositórios

#### Repositório Público (Triagem)

Repo onde issues de triagem do Discord serão criadas:

1. Crie um repositório público no GitHub
2. Exemplo: `seu-usuario/triagem-issues`
3. Anote o nome do usuário/org e nome do repo

#### Repositório Privado (Epics/Stories)

Repo onde você cria epics e stories que viram threads no Discord:

1. Crie um repositório privado no GitHub
2. Exemplo: `seu-usuario/projeto-interno`
3. Anote o nome do usuário/org e nome do repo

### 3. Configurar Labels

No **repositório privado**, crie as seguintes labels:

1. Vá em **Issues → Labels → New label**
2. Crie:
   - **Label:** `epic`
     - **Descrição:** "Epic-level feature or initiative"
     - **Cor:** `#d73a4a` (vermelho) ou `#a371f7` (roxo)
   - **Label:** `story`
     - **Descrição:** "User story"
     - **Cor:** `#0075ca` (azul) ou `#00ff00` (verde)

### 4. (Opcional) GitHub Projects v2

Se quiser adicionar issues automaticamente a um GitHub Project:

#### Pegar o Project ID

Use o [GitHub GraphQL Explorer](https://docs.github.com/en/graphql/overview/explorer):

```graphql
query {
  user(login: "seu-usuario") {
    projectsV2(first: 10) {
      nodes {
        id
        title
      }
    }
  }
}
```

Ou para organizações:

```graphql
query {
  organization(login: "sua-org") {
    projectsV2(first: 10) {
      nodes {
        id
        title
      }
    }
  }
}
```

O `id` retornado é o que você usa na função `addIssueToProject()`.

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# ===== DISCORD =====
# Token do bot (da Discord Developer Portal)
DISCORD_TOKEN=seu_token_do_bot_aqui

# ID do canal onde users criam threads que viram issues
TRIAGE_CHANNEL_ID=123456789012345678

# ID do canal onde o bot cria threads de epics/stories
EPIC_CHANNEL_ID=987654321098765432

# ===== GITHUB =====
# Personal Access Token com permissões: repo, write:discussion
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx

# Repositório PÚBLICO para issues de triagem
PUBLIC_REPO_OWNER=seu-usuario-github
PUBLIC_REPO_NAME=nome-do-repo-publico

# Repositório PRIVADO de onde vêm epics/stories
PRIVATE_REPO_OWNER=seu-usuario-github
PRIVATE_REPO_NAME=nome-do-repo-privado
```

### ⚠️ Importante

- **Não use espaços** antes ou depois do `=`
- **Não use aspas** nos valores
- O arquivo `.env` deve estar na **raiz do projeto** (mesmo nível do `package.json`)
- **Nunca faça commit do `.env`** (já está no `.gitignore`)

---

## ☁️ Deploy no Render.com

### 1. Preparar o Repositório

Certifique-se que seu código está no GitHub com:

- Código-fonte na pasta `src/`
- `package.json` configurado
- `.gitignore` incluindo `.env`

### 2. Criar Web Service no Render

1. Acesse [Render.com](https://render.com) e faça login
2. Clique em **New +** → **Background Worker**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** `discord-github-bot`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (ou pago se preferir)

### 3. Adicionar Variáveis de Ambiente

No dashboard do Render:

1. Vá em **Environment**
2. Clique em **Add Environment Variable**
3. Adicione **todas** as variáveis do `.env`:

```plaintext
DISCORD_TOKEN = seu_token_aqui
TRIAGE_CHANNEL_ID = 123456789012345678
EPIC_CHANNEL_ID = 987654321098765432
GITHUB_TOKEN = ghp_xxxxxxxxxxxxx
PUBLIC_REPO_OWNER = seu-usuario
PUBLIC_REPO_NAME = repo-publico
PRIVATE_REPO_OWNER = seu-usuario
PRIVATE_REPO_NAME = repo-privado
```

### 4. Deploy

1. Clique em **Create Web Service**
2. O Render fará o build automaticamente
3. Monitore os logs para verificar se está tudo OK

### 5. Verificar Status

- ✅ Status deve ficar "Live" em verde
- 📊 Logs mostrarão: `✅ Bot conectado como SeuBot#1234`
- 🔄 Bot reinicia automaticamente se cair

---

## 🐛 Troubleshooting

### Bot não conecta no Discord

```plaintext
Error: Invalid token
```

**Solução:** Verifique se o `DISCORD_TOKEN` está correto no `.env`

---

### Erro 404 ao buscar issues do GitHub

```plaintext
GET /repos///issues - 404 Not Found
```

**Solução:**

- Verifique se as variáveis `PUBLIC_REPO_OWNER`, `PUBLIC_REPO_NAME`, etc. estão preenchidas
- Confirme que não há espaços em branco
- Execute `npm run dev` e veja se aparece o log de configurações

---

### Bot não cria threads para epics/stories

**Verificar:**

1. As issues no repo privado têm a label `epic` ou `story`?
2. O token do GitHub tem permissão `repo`?
3. O bot está rodando? Verifique os logs
4. O polling está funcionando? (executa a cada 2 minutos)

---

### Permission Denied no GitHub

```plaintext
Error: Resource not accessible by personal access token
```

**Solução:**

- Recrie o token com os scopes corretos: `repo`, `write:discussion`
- Se for repo de organização, adicione `read:org`

---

### Thread não é criada quando user posta no Discord

**Verificar:**

1. O canal está configurado como **Thread-enabled** no Discord?
2. O `TRIAGE_CHANNEL_ID` está correto?
3. O bot tem permissões para criar threads no canal?
4. Verifique os logs para ver se há erros

---

## 📚 Recursos Úteis

- [Discord.js Documentation](https://discord.js.org/)
- [Octokit/Rest.js Documentation](https://octokit.github.io/rest.js/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Render Documentation](https://render.com/docs)

---

## 🎯 Checklist Final

Antes de fazer deploy, certifique-se:

- [ ] Bot criado no Discord Developer Portal
- [ ] Token do bot copiado
- [ ] Bot adicionado ao servidor Discord
- [ ] IDs dos canais copiados
- [ ] Personal Access Token do GitHub criado
- [ ] Repositórios público e privado criados
- [ ] Labels `epic` e `story` criadas no repo privado
- [ ] Arquivo `.env` configurado corretamente
- [ ] Bot rodando localmente sem erros
- [ ] Variáveis de ambiente configuradas no Render

---

## 🔄 Fluxos de Funcionamento

### Fluxo 1: Discord → GitHub (Triagem)

1. Usuário cria uma thread no canal de triagem
2. Bot detecta a criação da thread
3. Bot cria uma issue no repositório público
4. Issue recebe labels `triagem` e `discord`
5. Bot posta o link da issue na thread

### Fluxo 2: GitHub → Discord (Epics/Stories)

1. Você cria uma issue no repositório privado
2. Adiciona label `epic` ou `story`
3. Bot detecta a nova issue (polling a cada 2 min)
4. Bot cria uma thread no canal de epics
5. Thread inclui título, descrição e link da issue
