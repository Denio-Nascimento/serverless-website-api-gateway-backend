# Documentação do Projeto: Sistema de Pedidos

Esta documentação descreve os passos para criar e configurar um sistema de pedidos completo usando AWS Lambda, API Gateway, um site estático hospedado em S3, e CloudFront. Ela cobre desde a criação das funções Lambda até a publicação do site, com todos os detalhes técnicos necessários.

## Índice
- [1: Criar a Função AWS Lambda](#1-criação-da-função-lambda)
  - [1.1. Criação do Lambda para Listar Pedidos](#11-criação-do-lambda-para-listar-pedidos)
  - [1.2. Criação do Lambda para Detalhes do Pedido](#12-criação-do-lambda-para-detalhes-do-pedido)
  - [1.3. Criação das Políticas IAM](#14-criação-das-políticas-iam)
  - [1.4. Teste das Funções Lambda](#13-teste-das-funções-lambda)
- [2. Configuração do API Gateway](#2-configuração-do-api-gateway)
  - [2.1. Criação dos Métodos](#21-criação-dos-métodos)
  - [2.2. Configuração do Proxy e CORS](#22-configuração-do-proxy-e-cors)
- [3. Criação e Hospedagem do Site Estático](#3-criação-e-hospedagem-do-site-estático)
  - [3.1. Criação do Site Estático](#31-criação-do-site-estático)
  - [3.2. Publicação no S3 e CloudFront](#32-publicação-no-s3-e-cloudfront)

## 1. Criação da função lambda

Nesta seção, vamos criar duas funções Lambda: uma para listar todos os pedidos e outra para mostrar os detalhes de um pedido específico.

### 1.1. Criação do Lambda para Listar Pedidos

1. **Acessar o AWS Lambda:**

   - No menu de serviços, selecione **Lambda**.

2. **Criar uma Nova Função:**

   - Clique em **Create function**.
   - **Function name:** `list_orders`
   - **Runtime:** **Python 3.12** (ou a versão mais recente disponível)
   - **Permissions:**

     - Em **Change default execution role**, selecione **Create a new role with basic Lambda permissions**.

   - Clique em **Create function**.

3. **Inserir o Código da Função Lambda:**

   - Na página da função criada, role para baixo até a seção **Code source**.
   - Apague o código existente e cole o código abaixo:

   ~~~python
    import boto3
    import json
    import os
    
    def lambda_handler(event, context):
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ.get('DYNAMODB_TABLE', 'PedidosValidos')
        table = dynamodb.Table(table_name)
        
        try:
            response = table.scan(
                ProjectionExpression="#oi, order_date, order_status, #cust.#fname, #cust.#lname",
                ExpressionAttributeNames={
                    '#oi': 'order_id',
                    '#cust': 'customer',
                    '#fname': 'first_name',
                    '#lname': 'last_name'
                }
            )
            items = response.get('Items', [])
            
            return {
                'statusCode': 200,
                'body': json.dumps(items),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
            
        except Exception as e:
            print(f"Erro ao fazer scan na tabela DynamoDB: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Não foi possível recuperar os pedidos'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
   ~~~
 - Clique no botão **Deploy**

4. **Configurar a Variável de Ambiente:**

   - Na aba **Configuration**, selecione **Environment variables**.
   - Clique em **Edit**.
   - Clique em **Add environment variable**.
     - **Key:** `DYNAMODB_TABLE`
     - **Value:** `PedidosValidos`
   - Clique em **Save**.

5. **Configurar o Timeout da Lambda:**
   - Na aba **Configuration**, selecione **General configuration**  (**Configuraçãos gerais**).
   - Clique em **Edit**.
   - Em **Timeout** configure para 10 segundos `0` min `10` sec
   - Clique em **Save**.
  
6. **Acessar a Role IAM da Função Lambda:**
   Para que a função Lambda possa acessar o DynamoDB, precisamos adicionar as políticas de permissão adequadas 
à role de execução da Lambda.

   - Na página da função Lambda, vá para a seção **Configuration** > **Permissions**.
   - Em **Execution role**, clique no nome da role (será algo como `put_orders-role-abc123`), o que abrirá a console do IAM em uma nova aba.

2. **Adicionar Política de Acesso ao DynamoDB:**

   - Na página da role IAM, clique novamente em **Add permissions**.

   - Escolha **Create inline policy**.

   - **Definir a Política:**

     - Selecione a aba **JSON** e cole o seguinte código, substituindo `<YOUR_REGION>` pela sua região (por exemplo, `us-east-1`) e `<YOUR_ACCOUNT_ID>` pelo ID da sua conta AWS (este pode ser encontrado no canto superior direito da console da AWS; clique no nome do usuário e o ID da conta aparecerá como 'Account ID: 123456789012'; é um número de 12 dígitos):

       ```json
       {
         "Version": "2012-10-17",
         "Statement": [
           {
             "Effect": "Allow",
             "Action": [
               "dynamodb:Scan",
               "dynamodb:GetItem"
             ],
             "Resource": "arn:aws:dynamodb:<YOUR_REGION>:<YOUR_ACCOUNT_ID>:table/PedidosValidos"
           }
         ]
       }
       ```

   - Clique em **Next**.

   - Em **Policy name** digite `LambdaDynamoDBPolicy`

   - Clique em **Create policy**.

**Nota:** Certifique-se de substituir `<YOUR_REGION>` e `<YOUR_ACCOUNT_ID>` pelos valores corretos.

---

### 1.2. Criação do Lambda para Detalhes do Pedido
1. **Acessar o AWS Lambda:**

   - No menu de serviços, selecione **Lambda**.

2. **Criar uma Nova Função:**

   - Clique em **Create function**.
   - **Function name:** `get_order`
   - **Runtime:** **Python 3.12** (ou a versão mais recente disponível)
   - **Permissions:**

     - Em **Change default execution role**, selecione **Create a new role with basic Lambda permissions**.

   - Clique em **Create function**.

3. **Inserir o Código da Função Lambda:**

   - Na página da função criada, role para baixo até a seção **Code source**.
   - Apague o código existente e cole o código abaixo:

   ~~~python
   import boto3
   import json
   import os

   def lambda_handler(event, context):
       dynamodb = boto3.resource('dynamodb')
       table_name = os.environ.get('TABLE_NAME', 'PedidosValidos')
       table = dynamodb.Table(table_name)
       
       # Obter o order_id dos parâmetros de caminho
       order_id = event.get('pathParameters', {}).get('order_id')
       
       if not order_id:
           return {
               'statusCode': 400,
               'body': json.dumps({'error': 'Parâmetro order_id ausente'}),
               'headers': {
                   'Content-Type': 'application/json',
                   'Access-Control-Allow-Origin': '*'
               }
           }
       
       try:
           response = table.get_item(Key={'order_id': order_id})
           item = response.get('Item')
           
           if not item:
               return {
                   'statusCode': 404,
                   'body': json.dumps({'error': 'Pedido não encontrado'}),
                   'headers': {
                       'Content-Type': 'application/json',
                       'Access-Control-Allow-Origin': '*'
                   }
               }
           
           return {
               'statusCode': 200,
               'body': json.dumps(item, default=str),
               'headers': {
                   'Content-Type': 'application/json',
                   'Access-Control-Allow-Origin': '*'
               }
           }
           
       except Exception as e:
           print(f"Erro ao obter item da tabela DynamoDB: {e}")
           return {
               'statusCode': 500,
               'body': json.dumps({'error': 'Não foi possível recuperar o pedido'}),
               'headers': {
                   'Content-Type': 'application/json',
                   'Access-Control-Allow-Origin': '*'
               }
           }
   ~~~
 - Clique no botão **Deploy**

4. **Configurar a Variável de Ambiente:**

   - Na aba **Configuration**, selecione **Environment variables**.
   - Clique em **Edit**.
   - Clique em **Add environment variable**.
     - **Key:** `DYNAMODB_TABLE`
     - **Value:** `PedidosValidos`
   - Clique em **Save**.

5. **Configurar o Timeout da Lambda:**
   - Na aba **Configuration**, selecione **General configuration**  (**Configuraçãos gerais**).
   - Clique em **Edit**.
   - Em **Timeout** configure para 10 segundos `0` min `10` sec
   - Clique em **Save**.
---


6. **Acessar a Role IAM da Função Lambda:**
   Para que a função Lambda possa acessar o DynamoDB, precisamos adicionar as políticas de permissão adequadas 
à role de execução da Lambda.

   - Na página da função Lambda, vá para a seção **Configuration** > **Permissions**.
   - Em **Execution role**, clique no nome da role (será algo como `put_orders-role-abc123`), o que abrirá a console do IAM em uma nova aba.

6.1. **Adicionar Política de Acesso ao DynamoDB:**

   - Na página da role IAM, clique novamente em **Add permissions**.

   - Escolha **Create inline policy**.

   - **Definir a Política:**

     - Selecione a aba **JSON** e cole o seguinte código, substituindo `<YOUR_REGION>` pela sua região (por exemplo, `us-east-1`) e `<YOUR_ACCOUNT_ID>` pelo ID da sua conta AWS (este pode ser encontrado no canto superior direito da console da AWS; clique no nome do usuário e o ID da conta aparecerá como 'Account ID: 123456789012'; é um número de 12 dígitos):

       ```json
       {
         "Version": "2012-10-17",
         "Statement": [
           {
             "Effect": "Allow",
             "Action": [
               "dynamodb:Scan",
               "dynamodb:GetItem"
             ],
             "Resource": "arn:aws:dynamodb:<YOUR_REGION>:<YOUR_ACCOUNT_ID>:table/PedidosValidos"
           }
         ]
       }
       ```

   - Clique em **Next**.

   - Em **Policy name** digite `LambdaDynamoDBPolicy`

   - Clique em **Create policy**.

**Nota:** Certifique-se de substituir `<YOUR_REGION>` e `<YOUR_ACCOUNT_ID>` pelos valores corretos.

---

### 1.3. Teste das Funções Lambda

1. Teste ambas as funções Lambda no console da AWS.
3. **Teste de Listagem de Pedidos**:
   - Acesse a função `list_orders`.
   - Clique em "Test" e crie um evento de teste. Você pode criar um evento vazio, já que a função não depende de um evento específico.
   - Clique em "Save" e depois em "Test" para executar.
4. **Teste de Obtenção de Detalhes do Pedido**:
   - Acesse a função `get_order`.
   - Clique em "Test" e crie um evento de teste com o seguinte JSON:
     ~~~json
     {
       "pathParameters": {
         "order_id": "ORD-20231001-0001"
       }
     }
     ~~~
   - Clique em "Save" e depois em "Test" para verificar a resposta.


## 2. Configuração do API Gateway

### 2.1. Criação dos Métodos

1. No console do API Gateway, crie um novo API REST.
2. Adicione um método `GET` chamado `/orders` e vincule-o à função Lambda `list_orders_lambda`.
3. Adicione outro método `GET` para `/orders/{order_id}` e vincule-o ao `get_order_lambda`.

### 2.2. Configuração do Proxy e CORS

1. **Proxy**: Marque a opção de integração do Lambda como "Lambda Proxy" para ambos os métodos, permitindo que a função Lambda processe o evento inteiro.
2. **CORS**: Habilite o CORS em todos os recursos e métodos para permitir que o site estático acesse o API Gateway.
   - No console do API Gateway, clique em "Ações" e depois "Enable CORS".

## 3. Criação e Hospedagem do Site Estático

### 3.1. Criação do Site Estático

1. Crie dois arquivos HTML:
   - `list.html`: para listar os pedidos.
   - `details.html`: para exibir os detalhes do pedido.
2. Crie dois arquivos JavaScript correspondentes:
   - `list.js`: para buscar e exibir todos os pedidos usando a API.
   - `details.js`: para buscar e exibir os detalhes do pedido específico.
3. Organize o layout e o estilo dos arquivos HTML para tornar o site amigável e apresentável.

### 3.2. Publicação no S3 e CloudFront

1. **S3 Bucket**:
   - Crie um bucket S3 para hospedar o site estático.
   - Configure as permissões para tornar os objetos públicos e habilitar hospedagem de site estático.
   - Carregue todos os arquivos HTML, JavaScript, e CSS no bucket S3.
2. **CloudFront**:
   - Crie uma distribuição CloudFront apontando para o bucket S3 como origem.
   - Configure o bucket S3 para restringir o acesso apenas através do CloudFront.
   - Teste a URL da distribuição do CloudFront para garantir que o site está acessível.

---

## Conclusão

Este guia fornece todos os passos necessários para criar um sistema de pedidos usando AWS Lambda, API Gateway, S3, e CloudFront. A solução inclui desde a criação das funções Lambda até a publicação do site. Sinta-se à vontade para ajustar e melhorar as funções, APIs e layout conforme necessário.

Se precisar de mais ajuda, consulte a documentação oficial da AWS ou os exemplos fornecidos neste repositório.
