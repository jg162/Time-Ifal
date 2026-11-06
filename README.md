# TIME IFAL | Plataforma de Avaliação e Acompanhamento de Atletas de Voleibol

Uma plataforma web esportiva completa, moderna, funcional e responsiva, desenvolvida com identidade visual esportiva de alta performance (**preto e verde neon**), voltada para avaliação física, monitoramento de impulsão e acompanhamento técnico e coletivo de atletas de vôlei.

---

## 🏐 Principais Funcionalidades

### 1. Identidade Visual Esportiva & Tecnológica
- **Paleta de Cores**: Fundo escuro esportivo (`#070908`), destaques em verde vibrante/neon (`#00E676`), cinza sutil e branco.
- **Design de Alta Performance**: Bordas arredondadas, efeitos sutis de vidro e glow neon, cards responsivos e animações suaves.
- **100% Responsivo**: Layout otimizado para celulares, tablets e computadores desktop.

### 2. Autenticação e Gestão de Atletas
- Cadastro de novos atletas com validação completa.
- Login com persistência de sessão via cookies seguros e JWT.
- Fluxo de recuperação de senha com código de verificação de 6 dígitos.
- Encerramento de sessão (Logout).
- Isolamento de dados: cada atleta tem seu espaço individual.

### 3. Dashboard Principal
- Foto/Avatar do atleta e badge de posição em quadra.
- Resumo em tempo real das principais métricas:
  - **Alcance Vertical Pulando** (com destaque neon de ataque e bloqueio)
  - **Salto Vertical Líquido** (impulsão em cm calculada)
  - **Altura e Envergadura**
  - **Peso Corporal e IMC** (com badge de saúde atlética)
- Data da última atualização e contagem de avaliações.
- Objetivos e tipos de saque dominados.
- Gráficos de evolução integrados no painel.

### 4. Formulário "Minha Avaliação"
- **Dados Pessoais**: Nome completo, Data da avaliação e Data de nascimento.
- **Medidas Físicas**:
  - Peso (kg)
  - Altura (cm)
  - Alcance vertical parado (cm)
  - Alcance vertical pulando (cm)
  - Envergadura (cm)
- **Posição em Quadra**: Levantador, Central, Líbero, Ponteiro, Oposto.
- **Tipos de Saque**: Múltipla escolha (Saque por baixo, Saque por cima, Flutuante parado, Flutuante pulando, Híbrido, Viagem).
- **Objetivos e Metas**: Campo aberto para aspirações, dificuldades técnicas e metas de curto/longo prazo.
- Botão destacado em verde: **"SALVAR AVALIAÇÃO"**.
- Os dados são associados à conta do atleta e persistidos permanentemente no banco.

### 5. Área Coletiva "TIME"
- Lista/Grid completa dos atletas do time.
- Cards informativos com foto/avatar, nome, idade, altura, peso, posição, alcance parado, alcance pulando, salto e envergadura.
- **Pesquisa em Tempo Real**: Localize atletas pelo nome instantaneamente.
- **Filtro por Posição**: Filtre por Levantador, Central, Líbero, Ponteiro ou Oposto com contadores.
- **Ordenação Dinâmica**:
  - Por Alcance Vertical Pulando (maior primeiro)
  - Por Salto Vertical (+cm)
  - Por Altura (decrescente ou crescente)
  - Por Nome (A - Z)
  - Por Data da Última Atualização
- **Alternância de Visualização**: Grade de cards esportivos ou Tabela comparativa do elenco.
- **Página Individual do Atleta**: Modal detalhado ou rota `/time/[id]` com histórico completo do atleta.
- **Controle de Privacidade**: O atleta escolhe nas configurações quais medidas físicas, objetivos e históricos ficam visíveis para o time.

### 6. Histórico e Evolução Temporal
- Registro de avaliações em diferentes datas (não sobrescreve avaliações antigas, mantendo histórico completo).
- Gráficos interativos com Recharts:
  - **Evolução do Alcance Vertical & Salto (cm)**
  - **Evolução da Altura (cm)**
  - **Evolução do Peso (kg)**
  - **Evolução da Envergadura (cm)**
  - **Evolução do IMC**
- Tabela/Linha do tempo de testes com opção de exclusão protegida por modal de confirmação.

### 7. Cálculos Automáticos em Tempo Real
- **Idade**: Calculada automaticamente pela data de nascimento em relação à data da avaliação.
- **Salto Vertical**: $\text{Alcance Pulando} - \text{Alcance Parado}$ (com classificação: Bom, Excelente, Elite / Pro).
- **IMC**: $\text{Peso} \div (\text{Altura em metros})^2$ (com classificação: Abaixo do peso, Normal / Ideal, Sobrepeso / Massa Muscular, Obesidade).

---

## 🛠️ Tecnologias Utilizadas

- **Front-end**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React, Recharts.
- **Back-end**: Next.js Route Handlers (API RESTful), Autenticação via JWT e Bcrypt.
- **Banco de Dados Persistente**: SQLite relacional de alto desempenho via `better-sqlite3`.
- **Suporte a Supabase**: Esquema PostgreSQL completo com RLS (Row Level Security) pronto em `supabase/schema.sql`.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18+) instalado.

### 1. Iniciar em Modo de Desenvolvimento
```bash
npm run dev
```
O sistema estará disponível em: `http://localhost:3000`

### 2. Compilar e Iniciar em Modo de Produção
```bash
npm run build
npm start
```

### 3. Executar a Suíte de Testes Automatizados
```bash
npx tsx scripts/test-platform.ts
```

---

## 👥 Credenciais de Teste (Atletas Pré-cadastrados)

O banco de dados já inicializa automaticamente com um elenco realista do Time IFAL para demonstração imediata:

| Atleta | E-mail | Senha | Posição |
| :--- | :--- | :--- | :--- |
| **Matheus Santos** | `matheus.santos@ifal.edu.br` | `ifal1234` | Ponteiro |
| **Gabriel Silva** | `gabriel.silva@ifal.edu.br` | `ifal1234` | Central |
| **Lucas Oliveira** | `lucas.oliveira@ifal.edu.br` | `ifal1234` | Levantador |
| **Rafael Costa** | `rafael.costa@ifal.edu.br` | `ifal1234` | Líbero |
| **Thiago Almeida** | `thiago.almeida@ifal.edu.br` | `ifal1234` | Oposto |

*Você também pode criar uma conta nova a qualquer momento clicando em **"Criar Conta"**.*
