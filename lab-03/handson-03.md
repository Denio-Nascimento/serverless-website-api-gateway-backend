# Documentação Aprimorada: Criação e Hospedagem Segura de um Site Estático

Nesta documentação, detalharemos passo a passo como **criar**, **configurar** e **hospedar de forma segura** um site estático que exibe os pedidos gerenciados pelo sistema utilizando AWS Lambda e API Gateway. Este guia abrange desde a criação dos arquivos HTML e JavaScript até a publicação segura do site usando Amazon S3 e CloudFront com **Controle de Acesso à Origem (OAC)**, garantindo que o site não fique público.

## Sumário

1. [Criação do Site Estático](#1-criação-do-site-estático)
   - [1.1. Arquivos Necessários](#11-arquivos-necessários)
   - [1.2. Estilo e Layout](#12-estilo-e-layout)
   - [1.3. Teste Local do Site](#13-teste-local-do-site)
2. [Publicação Segura no S3 e CloudFront](#2-publicação-segura-no-s3-e-cloudfront)
   - [2.1. Configuração do Bucket S3](#21-configuração-do-bucket-s3)
   - [2.2. Configuração do CloudFront com Controle de Acesso à Origem (OAC)](#22-configuração-do-cloudfront-com-controle-de-acesso-à-origem-oac)
   - [2.3. Atualização da URL da API no Código](#23-atualização-da-url-da-api-no-código)
3. [Conclusão](#3-conclusão)

---

## 1. Criação do Site Estático

### 1.1. Arquivos Necessários

O site é composto por cinco arquivos principais, que estão organizados dentro de pastas específicas no repositório:

1. **index.html**: Exibe uma lista de pedidos. Cada pedido listado tem um link para visualizar seus detalhes completos.

2. **details.html**: Exibe os detalhes completos de um pedido específico. O formulário é preenchido dinamicamente com os dados recebidos da API.

3. **list.js**: Este script JavaScript busca todos os pedidos da API e os exibe na tabela do arquivo `index.html`. Veja o início do arquivo para saber onde atualizar a URL da API Gateway:

   ```javascript
   const API_BASE_URL = 'https://{SEU_API_GATEWAY_URL}/prod';
   ```

   Certifique-se de substituir `{SEU_API_GATEWAY_URL}` pelo endpoint correto da API Gateway.

4. **details_form.js**: Este script busca os detalhes de um pedido específico e preenche o formulário em `details.html`. Veja o início do arquivo para saber onde atualizar a URL da API Gateway:

   ```javascript
   const API_BASE_URL = 'https://{SEU_API_GATEWAY_URL}/prod';
   ```

   Certifique-se de substituir `{SEU_API_GATEWAY_URL}` pelo endpoint correto da API Gateway.

5. **styles.css**: Contém os estilos globais para padronizar o layout e melhorar a usabilidade do site.

### 1.2. Estilo e Layout

Para tornar o site visualmente atraente e de fácil navegação, recomenda-se utilizar um arquivo CSS (`styles.css`) com estilos globais que padronizam o layout, aplicam espaçamentos adequados e melhoram a usabilidade.

### 1.3. Teste Local do Site

Antes de hospedar o site, é fundamental testá-lo localmente. Você pode simplesmente abrir os arquivos HTML no seu navegador, mas para evitar problemas de CORS durante as requisições à API, é recomendável servir os arquivos HTML localmente usando uma ferramenta como o [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) do VS Code ou um servidor HTTP simples como o `http-server` do Node.js.

---

## 2. Publicação Segura no S3 e CloudFront

Para garantir que o site **não fique público** e seja acessado de forma segura, utilizaremos o Amazon S3 em conjunto com o Amazon CloudFront, implementando o **Controle de Acesso à Origem (OAC)**.

### 2.1. Configuração do Bucket S3

1. **Crie um Bucket S3**:

   - No console da AWS, acesse o Amazon S3 e crie um novo bucket para hospedar o site.
   - **Nome do Bucket**: Escolha um nome exclusivo, como `translogistica-site-0001`.
   - **Região**: Selecione a região que melhor se adequa às suas necessidades.
   - **Configuração Pública**: **Mantenha o bucket privado** para restringir o acesso público.

2. **Desative o Acesso Público**:

   - Nas configurações do bucket, verifique se o bloqueio de acesso público está ativado para todas as opções.
   - Isso garantirá que o bucket não possa ser acessado diretamente por usuários não autorizados.

3. **Carregue os Arquivos do Site**:

   - Carregue os arquivos `index.html`, `details.html`, `list.js`, `details_form.js`, `styles.css` e quaisquer outros recursos necessários no bucket.

4. **Desabilite a Hospedagem de Site Estático do S3**:

   - Não habilite a hospedagem de site estático no S3, já que iremos servir o conteúdo através do CloudFront, que oferecerá o acesso seguro ao conteúdo.

### 2.2. Configuração do CloudFront com Controle de Acesso à Origem (OAC)

1. **Crie uma Distribuição CloudFront**:

   - No console da AWS, acesse o Amazon CloudFront e crie uma nova distribuição.
   - **Origem**: Selecione o bucket S3 que hospeda o site.
     - Ao selecionar a origem, escolha o bucket através do ARN (Amazon Resource Name) para garantir a configuração correta.

2. **Configure o Controle de Acesso à Origem (OAC)**:

   - Na seção **"Identity and Access"**, selecione **"Create a new origin access control"**.
   - Nomeie o OAC de forma significativa, como `OAC-Sistema-Pedidos`.
   - **Signing Behavior**: Certifique-se de que a opção de assinatura está habilitada para que o CloudFront possa acessar o conteúdo privado do S3.

3. **Atualize a Política do Bucket S3**:

   - O CloudFront irá gerar uma política que precisa ser associada ao bucket S3.
   - No bucket S3, acesse a seção **Permissões** e adicione a política fornecida pelo CloudFront.
   - Essa política permitirá que o CloudFront acesse o conteúdo do bucket, enquanto bloqueia o acesso direto ao S3.

4. **Configurações Adicionais da Distribuição CloudFront**:

   - **Defina o Comportamento Padrão**:
     - **Viewer Protocol Policy**: Selecione **Redirect HTTP to HTTPS** para garantir que todo o tráfego seja criptografado.
     - **Cache Policy**: Selecione **CachingOptimized** ou crie uma política personalizada, se necessário.
     - **Allowed HTTP Methods**: Selecione os métodos HTTP necessários (GET, HEAD, etc.).
   - **Configurações de Segurança**:
     - Habilite o SSL (TLS) para garantir a segurança das comunicações.
     - Se necessário, configure um certificado SSL personalizado através do AWS Certificate Manager (ACM).

5. **Testar a Distribuição CloudFront**:

   - Após a distribuição ser implantada (isso pode levar alguns minutos), acesse a URL da distribuição CloudFront.
   - Verifique se o site está acessível e funcionando corretamente.
   - **Importante**: Tente acessar diretamente o bucket S3; você deve receber um erro de acesso negado, confirmando que o acesso direto está bloqueado.

### 2.3. Atualização da URL da API no Código

1. **Atualize a variável `API_BASE_URL`** nos arquivos `list.js` e `details_form.js`:

   - Substitua `{SEU_API_GATEWAY_URL}` pelo URL do seu API Gateway.
   - Certifique-se de que o endpoint do API Gateway está configurado para aceitar requisições do domínio do CloudFront, se houver restrições de CORS.

2. **Configurações de CORS**:

   - Se a API Gateway tiver restrições de CORS, configure os headers adequadamente para permitir as requisições do domínio do CloudFront.
   - Nas configurações do API Gateway, adicione o domínio do CloudFront à lista de origens permitidas.

---

## 3. Conclusão

Esta documentação aprimorada detalha todas as etapas necessárias para **criar** e **hospedar de forma segura** um site estático integrado com a API de pedidos, utilizando Amazon S3 e CloudFront com **Controle de Acesso à Origem (OAC)**. A configuração proposta garante que o site **não seja público**, oferecendo uma camada adicional de segurança ao restringir o acesso direto ao bucket S3 e servindo o conteúdo exclusivamente através do CloudFront.

Ao seguir este guia, você criará uma interface amigável e segura para visualizar e gerenciar pedidos, implementando as melhores práticas de segurança e escalabilidade da AWS.

---

**Nota para Instrutores**: Esta documentação foi elaborada com o objetivo de ser utilizada em aulas sobre hospedagem segura de sites estáticos na AWS. Ela aborda conceitos importantes como restrição de acesso público, configuração de OAC no CloudFront e boas práticas de segurança em ambientes de nuvem. Recomenda-se que os alunos sigam cada passo atentamente e compreendam os motivos por trás de cada configuração, fortalecendo assim o aprendizado sobre segurança e gerenciamento de recursos na AWS.

---
