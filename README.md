. Visão Geral do Projeto "UniVerse"
O UniVerse é uma rede social completa, similar ao Twitter ou Instagram, mas com um forte nicho em ambientes universitários. O projeto é um monorepo que contém:

client/: Uma aplicação Frontend moderna em React (Vite + TailwindCSS).

core/: Uma API Backend robusta em Django (DRF + Channels).

db.sqlite3: O banco de dados de desenvolvimento atual, populado com dados de teste.

media/: Diretório de arquivos de upload do usuário (fotos de perfil, imagens de posts).

O objetivo é criar uma plataforma onde estudantes possam interagir, seguir uns aos outros, criar posts em um feed global, participar de comunidades (privadas ou públicas) ligadas a seus cursos e receber anúncios de professores.

2. Análise da Stack Tecnológica
Sua assistência deve ser fluente nas seguintes tecnologias:

Backend (Django / core/ e config/)
Framework: Django (core/models.py, core/views.py).

API: Django Rest Framework (DRF) é usado extensivamente com ModelSerializer e Views genéricas (ListCreateAPIView, RetrieveUpdateDestroyAPIView).

Autenticação: Simple JWT (JSON Web Tokens) para autenticação stateless. O MyTokenObtainPairSerializer customiza o token para incluir o username.

Tempo Real (Chat): Django Channels é usado para o chat 1-para-1. A configuração (config/asgi.py) usa ProtocolTypeRouter e um TokenAuthMiddleware customizado (core/middleware.py) que autentica WebSockets via parâmetros de URL.

Banco de Dados: SQLite (db.sqlite3) é o banco de dados de desenvolvimento.

Dependências Principais: django-cors-headers (para permitir o React), Pillow (para imagens), django-filter (para filtros de API).

Frontend (React / client/)
Framework: React 19 (package.json).

Build Tool: Vite (vite.config.js).

Estilização: TailwindCSS e DaisyUI são as principais bibliotecas de UI. O ThemeContext.jsx gerencia múltiplos temas do DaisyUI.

Roteamento: React Router v7 (App.jsx), incluindo o uso de PrivateRoute e AdminRoute para proteger rotas.

Comunicação API: Axios. Um axiosInstance.js centralizado intercepta requisições para injetar o token JWT e, crucialmente, implementa a lógica de refresh token automaticamente.

Estado Global: React Context API.

AuthContext.jsx: Gerencia tokens, informações do usuário (persistidas no localStorage) e a flag showOnboardingModal.

ThemeContext.jsx: Gerencia a troca de temas.

Tempo Real (Chat): react-use-websocket é usado no ChatDetailPage.jsx para se conectar ao backend Django Channels.

3. Análise do Estado Atual do Projeto
O projeto está em estágio avançado de desenvolvimento, com a maioria das features principais funcionais.

Banco de Dados e Modelos (core/models.py)
A arquitetura de dados (core/models.py) é o coração da aplicação:

User e Profile: O User padrão do Django é estendido via OneToOneField para um Profile. O Profile armazena bio, profile_pic, cover_photo e o sistema de following (M2M consigo mesmo).

Onboarding Universitário: Profile contém campos-chave: universidade, curso, atletica, ano_inicio e um booleano onboarding_complete.

Posts: Modelo central. Suporta content, image, video e attachment. Pode ser global (community=NULL) ou pertencer a uma Community.

Community e CommunityMembership: Sistema de grupos com admin, privacy ('public', 'private') e um modelo de CommunityMembership que armazena status ('pending', 'approved').

Interações: Comment (ForeignKey para Post), Reaction (ForeignKey para Post) e Tag (M2M com Post).

Chat: Conversation (M2M com User) e Message (ForeignKey para Conversation e User).

Gamificação/Admin: Badge (M2M com Profile) para emblemas (ex: "Professor").

Notificações: O modelo Notification existe. core/signals.py já cria notificações automaticamente para follow, comment e membership_approved.

Dados de Teste: O db.sqlite3 contém dados de teste, incluindo usuários ("FreddyFazbear", "HatsuneMiku") e posts com conteúdo de meme ("cala boca cadela", "INDIRETA PRA MIM FOFA?"). Isso indica um ambiente de desenvolvimento ativo e informal.

Backend (API e Lógica)
API core/views.py: A API está bem segmentada:

Auth: UserCreateAPIView (Registro), MyTokenObtainPairView (Login).

Posts: CRUD completo em PostListAPIView (Feed Global) e PostDetailsAPIView.

Interações: Endpoints dedicados para /react/, /save/ (salvar post) e /follow/.

Perfis: UserDetailView (público), UserUpdateView e ProfileUpdateView (privado).

Comunidades: Views para criar, listar, detalhar, entrar (JoinCommunityView), aprovar (ApproveMemberView) e ver feeds de comunidade (CommunityFeedView).

Chat: Views para iniciar (StartConversationView), listar (ConversationListView) e buscar mensagens (MessageListView).

Admin: Endpoints protegidos (IsAdminUser) para listar/editar usuários (AdminUserListView, AdminUserDetailView) e listar badges/posts.

Permissões (core/permissions.py): Permissões customizadas como IsOwnerOrReadOnly e IsCommunityAdmin controlam o acesso a posts e gerenciamento de comunidades.

Frontend (Componentes e Fluxos)
Arquitetura de Componentes: O frontend é bem componentizado. O Feed.jsx é um componente reutilizável crucial, usado em HomePage.jsx (feed global), FollowingFeedPage.jsx (feed de quem segue) e ProfilePage.jsx (posts do usuário).

Fluxo de Autenticação: LoginPage.jsx e RegisterPage.jsx funcionam. AuthContext.jsx armazena os tokens e dados do usuário no localStorage.

Fluxo de Onboarding: Após o login, AuthContext checa a flag onboarding_complete do perfil. Se false, o OnboardingModal.jsx é exibido, coletando dados universitários e tentando inscrever o usuário na comunidade do seu curso.

Interação em Tempo Real: ChatDetailPage.jsx usa WebSockets para enviar e receber mensagens em tempo real.

Features de UI: SearchUser.jsx (com useDebounce), Reactions.jsx (com lógica otimista) e ThemeSwitcher.jsx demonstram uma UI reativa e moderna.
