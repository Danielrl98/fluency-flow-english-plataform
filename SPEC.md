# SPEC: Plataforma de Estudos Diários de Inglês (FluencyFlow)

## 1. Visão Geral do Projeto

Mini plataforma web para estudantes de inglês praticarem diariamente leitura interativa, compreensão auditiva (_listening_) e escrita guiada (_dictation/ditado_). A plataforma gera lições personalizadas sob demanda usando a API Google Gemini (`gemini-3.8-flash`), adaptadas ao nível de proficiência do estudante (CEFR A, B ou C), com controle de acesso simples baseado em credenciais configuradas em arquivo `.env`.

---

## 2. Requisitos Atendidos & Funcionalidades

### 2.1. Entrada de Assunto & Nível de Dificuldade

- **Tema Livre / Prompt:** Campo de texto onde o estudante digita qualquer assunto do seu interesse (ex.: _"Software Engineer Job Interview"_, _"Weekend trip to London"_).
- **Sugestões Rápidas de Temas:** Chips clicáveis com tópicos do cotidiano (_Morning Routine, Tech Interview, Airport & Travel, Ordering Food, AI Future of Work_).
- **Seletor de Nível CEFR:**
  - **Nível A (Básico / A1-A2):** Frases curtas, tempos verbais simples, vocabulário cotidiano.
  - **Nível B (Intermediário / B1-B2):** Phrasal verbs, conectivos, expressões idiomáticas e estruturas compostas.
  - **Nível C (Avançado / C1-C2):** Linguagem sofisticada, nuances formais/coloquiais e construções complexas.
- **Motor de IA:** Integração direta com Google Gemini utilizando o modelo oficial `gemini-3.8-flash` através do pacote `@google/genai`.

---

### 2.2. Aba 1: Leitura Interativa (Reading & Vocabulary)

- **Texto Completo Formatado:** Exibição do texto gerado organizado em sentenças numeradas.
- **Tradução com Hover / Clique (Word Tooltip):**
  - Ao passar o mouse ou tocar em qualquer palavra em inglês, abre um balão (_popover_) com:
    - Tradução contextual para o português.
    - Transcrição fonética (IPA).
    - Botão de pronúncia em áudio da palavra individual.
    - Botão de marcador (_Bookmark_) para salvar a palavra no Banco de Vocabulário pessoal.
- **Leitura em Voz Alta Contínua:** Botão "Ouvir Texto Completo" que lê o texto sequencialmente com destaque visual da sentença ativa.
- **Tradução Completa (Sanfona/Accordion):** Opção de revelar ou ocultar a tradução integral do texto em português.
- **Expressões-Chave & Vocabulário Destaque:** Cards com 3 a 5 phrasal verbs e expressões presentes no texto, com significado e exemplos práticos com áudio.
- **Botão de Transição Rápida:** Atalho no final da página para avançar direto ao treino de listening.

---

### 2.3. Aba 2: Listening & Ditado (Dictation Challenge)

- **Particionamento de Áudio:** O texto é fatiado em sentenças individuais com contador de progresso (ex.: _"Frase 1 de 5"_, barra de progresso visual).
- **Player de Áudio por Sentença:**
  - Botão central grande de Play / Replay.
  - Animação de ondas sonoras durante a reprodução.
  - Controle de velocidade (0.75x, 1.0x, 1.25x).
  - Botões de ação rápida no formulário: "Ouvir de Novo" e opção de "Pausar" áudio ativa durante a reprodução da frase.
  - Atalhos de teclado (`Alt + P` ou `Ctrl + Espaço` para tocar / pausar, `Enter` para verificar).
- **Campo de Digitação do Ditado:**
  - O estudante ouve a frase e digita em inglês o que escutou.
- **Validação Inteligente & Flexível (Decisão do Usuário):**
  - Normaliza pontuações secundárias, aspas, espaços duplos e maiúsculas/minúsculas.
  - Exibe feedback colorido palavra por palavra:
    - 🟩 **Verde:** Palavras corretas.
    - 🟨 **Amarelo:** Quase lá (erro de digitação leve / typo detectado via distância de Levenshtein, mostrando o que foi digitado vs o correto).
    - 🟥 **Vermelho / Tracejado:** Palavras faltantes ou incorretas.
- **Sistema de Dicas Progressivas (_Hints_):**
  - **Dica 1:** Revela estrutura e quantidade de palavras (`_ _ _`).
  - **Dica 2:** Revela a primeira letra de cada palavra.
  - **Dica 3:** Revela a sentença completa (para não travar os estudos).
- **Avanço de Etapa:** Ao validar com sucesso, exibe animação positiva e avança automaticamente para a próxima sentença até concluir 100%.

---

### 2.4. Finalização e Histórico de Concluídos

- **Gravação Automática em Disco:**
  - Ao terminar a última frase, o sistema dispara confetes celebratórios (`canvas-confetti`) e envia os dados via `POST /api/complete`.
  - Um arquivo Markdown formatado (`.md`) é gravado automaticamente na pasta local `concluidos/` no formato `YYYY-MM-DD_HH-mm-ss_{slug}_level-{level}.md`.
  - **Conteúdo do arquivo Markdown:**
    - Cabeçalho: Título em inglês e português, Nível, Tema, Data/Hora, Precisão e Tentativas.
    - Texto Completo em Inglês.
    - Tradução em Português.
    - Lista de Sentenças Praticadas com traduções.
    - Expressões-chave com exemplos.
- **Modal de Histórico na Interface:**
  - Permite visualizar a lista de todas as aulas concluídas e ler o arquivo Markdown correspondente sem sair do navegador.

---

### 2.5. Recursos Criativos Adicionados (Evolução Contínua)

1. **Banco de Vocabulário Pessoal (Word Bank):**
   - Palavras salvas durante as leituras ficam armazenadas em `data/vocabulary.json`.
   - Busca/filtro por palavra ou tradução.
2. **Modo Flashcards:**
   - Modo de estudo dentro do modal de vocabulário com efeito de virar a carta (_flip card_) para testar retenção de memória com áudio.
3. **Streak & Métricas Diárias:**
   - Contador de dias consecutivos de estudo (`🔥 X dias`), total de aulas concluídas e palavras aprendidas salvo em `data/stats.json`.
4. **Sotaques de Áudio:**
   - Seletor de voz nativa no cabeçalho: Inglês Americano (US 🇺🇸) ou Britânico (UK 🇬🇧).

---

### 2.6. Autenticação e Proteção Simples (.env)

- **Tela de Login Dedicada:**
  - O sistema bloqueia todo o acesso caso o usuário não esteja autenticado.
  - Formulário com campos de E-mail e Senha, validação de erros e indicador de carregamento.
- **Credenciais em `.env`:**
  - As credenciais são definidas pelas variáveis de ambiente:
    - `AUTH_EMAIL`: E-mail autorizado para acesso.
    - `AUTH_PASSWORD`: Senha autorizada para acesso.
- **Sessão Local e Middleware de Segurança:**
  - Ao logar com sucesso, um token de sessão SHA-256 é armazenado em `localStorage` (`fluency_auth_token`).
  - Todas as chamadas de API (`/api/generate`, `/api/complete`, `/api/history`, `/api/stats`, `/api/vocabulary`) exigem o cabeçalho `Authorization: Bearer <token>`. Requisições não autorizadas retornam `401 Unauthorized`.
  - Botão de **Logout** disponível no cabeçalho para desconectar com um clique.

---

## 3. Histórico de Decisões e Perguntas ao Usuário

| Pergunta / Solicitação do Usuário                                       | Opções / Decisão                                     | Implementação                                                                                                                                                     |
| ----------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Como gerar os áudios particionados de listening?**                    | Web Speech API nativa / Edge-TTS backend / Híbrido   | **Web Speech API nativa** (rápida, sem delay, controle instantâneo de velocidade, sem limite de cota, suporte a sotaques US/UK).                                  |
| **Qual o nível de rigor na validação do que você digita no listening?** | Validação flexível com dicas / Validação estrita     | **Validação flexível com dicas** (ignora maiúsculas e pontuações secundárias, destaca erros de grafia em amarelo e palavras faltantes em vermelho).               |
| **Em qual formato salvar os arquivos na pasta concluidos/?**            | Markdown (.md) / Texto simples (.txt) / JSON (.json) | **Markdown (.md) organizado** (com título, nível, texto em inglês, resumo e vocabulário chave da lição).                                                          |
| **Tela de login com credenciais no .env?**                              | Solicitação direta do usuário                        | Implementada tela de login simples validando `AUTH_EMAIL` e `AUTH_PASSWORD` do `.env`, protegendo todas as rotas com token Bearer e botão de logout no cabeçalho. |
| **Pausar áudio no ListeningTab (linha 496)?**                           | Adicionar opção de pausar áudio                      | Adicionado botão "Pausar" visível durante a reprodução da frase ao lado de "Ouvir de Novo", além de suporte aos atalhos `Alt+P` e `Ctrl+Espaço` para alternar play/pause e limpeza de áudio na troca de sentenças. |

---

## 4. Estrutura de Pastas e Arquivos

```
english-plataform/
├── .env                       # GEMINI_API_KEY, AUTH_EMAIL, AUTH_PASSWORD
├── package.json               # Scripts e dependências raiz (express, @google/genai, cors, etc.)
├── SPEC.md                    # Especificação técnica completa do projeto
├── concluidos/                # Pasta onde os arquivos .md das aulas finalizadas são gravados
│   └── 2026-10-03_..._level-A.md
├── data/
│   ├── vocabulary.json        # Palavras salvas pelo estudante
│   └── stats.json             # Estatísticas de streak e aulas concluídas
├── server/
│   ├── index.js               # Servidor Express (Rotas de Auth, API e fallback estático do client)
│   ├── gemini.js              # Serviço de integração com Google Gemini 3.8 Flash
│   └── storage.js             # Gerenciamento de arquivos em concluidos/ e data/
└── client/
    ├── index.html             # Ponto de entrada com fontes e título
    ├── vite.config.js         # Configuração Vite com Tailwind CSS e proxy /api -> :8072
    └── src/
        ├── App.jsx            # Componente raiz, verificação de auth e navegação
        ├── index.css          # Estilos globais e Tailwind v4
        ├── components/
        │   ├── LoginScreen.jsx      # Tela de login simples com validação via .env
        │   ├── Header.jsx           # Cabeçalho, Streak, abas, seletor de voz, logout
        │   ├── GeneratorBar.jsx     # Campo de busca de tema, chips rápidos e seletor A/B/C
        │   ├── ReadingTab.jsx       # Aba 1: Leitura com tooltips em hover e áudio contínuo
        │   ├── ListeningTab.jsx     # Aba 2: Áudio particionado, ditado, validação diff e salvamento
        │   ├── WordTooltip.jsx      # Balão flutuante com tradução, fonética e pronúncia
        │   ├── HistoryModal.jsx     # Visualizador das aulas salvas em concluidos/
        │   └── VocabularyModal.jsx  # Lista de palavras salvas e modo Flashcards
        └── utils/
            ├── diff.js              # Algoritmo de normalização, distância Levenshtein e dicas
            └── speech.js            # Wrapper do Web Speech API (vozes US/UK e velocidade)
```

---

## 5. Endpoints da API (Backend Express na porta 8072)

| Método   | Endpoint                 | Protegido por Token? | Descrição                                                            |
| -------- | ------------------------ | :------------------: | -------------------------------------------------------------------- |
| `GET`    | `/api/health`            |         Não          | Healthcheck do servidor                                              |
| `POST`   | `/api/auth/login`        |         Não          | Autentica e-mail e senha com base no `.env`                          |
| `GET`    | `/api/auth/verify`       |         Sim          | Verifica validade do token de sessão                                 |
| `POST`   | `/api/generate`          |         Sim          | Gera lição completa com o Gemini (`{ topic, level }`)                |
| `POST`   | `/api/complete`          |         Sim          | Salva a aula concluída em `concluidos/<arquivo>.md` e atualiza stats |
| `GET`    | `/api/history`           |         Sim          | Retorna lista das aulas concluídas gravadas na pasta                 |
| `GET`    | `/api/history/:filename` |         Sim          | Retorna conteúdo Markdown da aula selecionada                        |
| `GET`    | `/api/stats`             |         Sim          | Retorna estatísticas de estudo (streak, total completado)            |
| `GET`    | `/api/vocabulary`        |         Sim          | Retorna lista de vocabulário do estudante                            |
| `POST`   | `/api/vocabulary`        |         Sim          | Adiciona palavra ao vocabulário                                      |
| `DELETE` | `/api/vocabulary/:word`  |         Sim          | Remove palavra do vocabulário                                        |

---

## 6. Configuração do `.env`

Exemplo das variáveis configuradas no arquivo `.env`:

```env
GEMINI_API_KEY=
AUTH_EMAIL=
AUTH_PASSWORD=
```

> O usuário pode alterar livremente o e-mail e senha no `.env`.

---

## 7. Como Executar

### Modo Completo (Recomendado para Uso Diário):

```bash
npm run dev
```

Inicia simultaneamente o servidor backend (`http://localhost:8072`) e o frontend com hot-reloading (`http://localhost:5173`).

### Modo Produção / Servidor Único:

```bash
npm run build
npm start
```

Compila o frontend e serve tudo na porta `http://localhost:8072`.
