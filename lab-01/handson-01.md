# Passo a Passo da Atividade Prática

Nesta atividade, você irá:

- Criar um bucket Amazon S3 com um prefixo para receber os pedidos.
- Fazer o upload de um arquivo de pedido para o bucket S3.
- Criar uma tabela no Amazon DynamoDB para armazenar os pedidos válidos.
- Criar uma função AWS Lambda que lê o pedido do S3 e insere no DynamoDB.
- Configurar as permissões IAM necessárias, incluindo as políticas para a role da Lambda.
- Testar a função Lambda manualmente através da console da AWS.

---

### **Pré-requisitos**

- **Conta AWS ativa** com permissões para criar recursos (S3, DynamoDB, Lambda, IAM).
- **Acesso à console da AWS** via navegador web.

---

## **Etapa 1: Criar o Bucket S3 e o Prefixo para os Pedidos**

1. **Acessar o Amazon S3:**

   - Faça login na console da AWS.
   - No menu de serviços, selecione **S3** (pode usar a barra de pesquisa).
   - **AWS Region:** Certifique-se de estar na região em que pretende trabalhar. (por exemplo, **us-east-1**).

2. **Criar um Bucket:**

   - Clique em **Create bucket**.
   - **Bucket name:** `translogistica-pedidos` (os nomes de bucket devem ser exclusivos globalmente; se esse nome não estiver disponível, escolha outro nome exclusivo, como `translogistica-pedidos-seu-nome`).
   - Mantenha as demais configurações padrão.
   - Clique em **Create bucket**.

3. **Criar o Prefixo (Pasta) "novos-pedidos/":**

   - Clique no nome do bucket criado para acessá-lo.
   - Clique em **Create folder**.
   - **Folder name:** `novos-pedidos`
   - Clique em **Create folder**.

---

## **Etapa 2: Fazer o Upload do Arquivo de Pedido**

1. **Preparar o Arquivo de Pedido:**

   - Abra um editor de texto (como o Notepad, VS Code ou outro de sua preferência).
   - Copie e cole o conteúdo do pedido abaixo:

     ```json
     {
       "order_id": "ORD-20231001-0001",
       "company": {
         "name": "Tech Solutions Ltda",
         "cnpj": "12.345.678/0001-99"
       },
       "customer": {
         "first_name": "Mariana",
         "last_name": "Alves",
         "cpf": "123.456.789-00",
         "email": "mariana.alves@example.com",
         "phone": "+55 21 91234-5678",
         "address": {
           "street": "Avenida das Américas",
           "number": "5000",
           "complement": "Bloco 2, Apt 301",
           "neighborhood": "Barra da Tijuca",
           "city": "Rio de Janeiro",
           "state": "RJ",
           "zip_code": "22640-102"
         }
       },
       "order_date": "2023-10-01T10:30:00Z",
       "items": [
         {
           "product_id": "PRD-1001",
           "description": "Smartphone XYZ",
           "quantity": 1,
           "unit_price": 2500.00
         },
         {
           "product_id": "PRD-2002",
           "description": "Fone de Ouvido Bluetooth",
           "quantity": 2,
           "unit_price": 150.00
         }
       ],
       "payment": {
         "method": "Cartão de Crédito",
         "transaction_id": "TXN-9876543210",
         "amount": 2800.00
       },
       "shipping": {
         "method": "Express",
         "cost": 50.00,
         "address": {
           "street": "Avenida das Américas",
           "number": "5000",
           "complement": "Bloco 2, Apt 301",
           "neighborhood": "Barra da Tijuca",
           "city": "Rio de Janeiro",
           "state": "RJ",
           "zip_code": "22640-102"
         },
         "expected_delivery_date": "2023-10-03"
       },
       "order_status": "Pendente",
       "notes": "Entregar no período da tarde."
     }
     ```

   - Salve o arquivo com o nome **`pedido-ORD-20231001-0001.json`**.

2. **Fazer o Upload para o Bucket S3:**

   - Na console do S3, dentro do bucket **`translogistica-pedidos`**, acesse a pasta **`novos-pedidos/`**.
   - Clique em **Upload**.
   - Arraste e solte o arquivo **`pedido-ORD-20231001-0001.json`** ou clique em **Add files** para selecioná-lo.
   - Clique em **Upload** para enviar o arquivo.

---

## **Etapa 3: Criar a Tabela DynamoDB para os Pedidos Válidos**

1. **Acessar o Amazon DynamoDB:**

   - No menu de serviços da AWS, selecione **DynamoDB**.

2. **Criar uma Nova Tabela:**

   - Clique em **Create table**.
   - **Table name:** `PedidosValidos`
   - **Partition key:** `order_id` (Tipo: **String**)
   - Em **Table settings** Selecione **Customize settings**
   - Logo abaixo certifique-se que em **Capacity mode** está como **On-demand**
   - Mantenha as demais configurações padrão.
   - Clique em **Create table**.

---

## **Etapa 4: Criar a Função AWS Lambda**

1. **Acessar o AWS Lambda:**

   - No menu de serviços, selecione **Lambda**.

2. **Criar uma Nova Função:**

   - Clique em **Create function**.
   - **Function name:** `put_orders`
   - **Runtime:** **Python 3.12** (ou a versão mais recente disponível)
   - **Permissions:**

     - Em **Change default execution role**, selecione **Create a new role with basic Lambda permissions**.

   - Clique em **Create function**.

3. **Inserir o Código da Função Lambda:**

   - Na página da função criada, role para baixo até a seção **Code source**.
   - Apague o código existente e cole o código abaixo:

     ```python
     import json
     import boto3
     import os
     import logging
     from decimal import Decimal
     
     # Configurar o logger básico
     logging.basicConfig(level=logging.INFO)
     logger = logging.getLogger()
     
     # Função auxiliar para converter Decimal para float ou string
     def decimal_default(obj):
         if isinstance(obj, Decimal):
             return float(obj)  # Ou use str(obj) se preferir strings
         raise TypeError
     
     def lambda_handler(event, context):
         # Obter o nome da tabela DynamoDB a partir das variáveis de ambiente
         dynamodb_table_name = os.environ.get('DYNAMODB_TABLE')
     
         # Extrair informações do evento
         bucket_name = event['Records'][0]['s3']['bucket']['name']
         object_key = event['Records'][0]['s3']['object']['key']
     
         logger.info(f"Bucket: {bucket_name}")
         logger.info(f"Objeto: {object_key}")
     
         # Criar clientes do S3 e DynamoDB
         s3_client = boto3.client('s3')
         dynamodb = boto3.resource('dynamodb')
      
         # Ler o arquivo do S3
         response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
         content = response['Body'].read().decode('utf-8')
         pedido = json.loads(content, parse_float=Decimal)  # Converte float para Decimal
     
         # Exibir o pedido nos logs
         logger.info("Pedido recebido:")
         logger.info(json.dumps(pedido, indent=4, ensure_ascii=False, default=decimal_default))
     
         # Inserir o pedido na tabela DynamoDB
         table = dynamodb.Table(dynamodb_table_name)
         table.put_item(Item=pedido)
         logger.info("Pedido inserido no DynamoDB com sucesso.")
     
         return {
             'statusCode': 200,
             'body': json.dumps('Processamento concluído com sucesso.')
         }     
     ```
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

## **Etapa 5: Configurar as Permissões IAM para a Role da Lambda**

Para que a função Lambda possa acessar o Amazon S3 e o DynamoDB, precisamos adicionar as políticas de permissão adequadas à role de execução da Lambda.

1. **Acessar a Role IAM da Função Lambda:**

   - Na página da função Lambda, vá para a seção **Configuration** > **Permissions**.
   - Em **Execution role**, clique no nome da role (será algo como `put_orders-role-abc123`), o que abrirá a console do IAM em uma nova aba.

2. **Adicionar Política de Acesso ao S3:**

   - Na página da role no IAM, clique em **Add permissions** e escolha **Create inline policy**.

   - **Definir a Política:**

     - Selecione a aba **JSON** e cole o seguinte código, substituindo `<YOUR_BUCKET_NAME>` pelo nome do seu bucket (por exemplo, `translogistica-pedidos`):

       ```json
       {
         "Version": "2012-10-17",
         "Statement": [
           {
             "Effect": "Allow",
             "Action": [
                      "s3:GetObject",
                      "s3:ListBucket"
                ],
             "Resource": [
                      "arn:aws:s3:::<YOUR_BUCKET_NAME>/novos-pedidos/*",
                      "arn:aws:s3:::<YOUR_BUCKET_NAME>/novos-pedidos"
                ]
           }
         ]
       }
       ```

   - Clique em **Next**.

   - Em **Policy name** digite `LambdaS3GetObjectPolicy`

   - Clique em **Create policy**.

3. **Adicionar Política de Acesso ao DynamoDB:**

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
             "Action": "dynamodb:PutItem",
             "Resource": "arn:aws:dynamodb:<YOUR_REGION>:<YOUR_ACCOUNT_ID>:table/PedidosValidos"
           }
         ]
       }
       ```

   - Clique em **Next**.

   - Em **Policy name** digite `LambdaDynamoDBPutItemPolicy`

   - Clique em **Create policy**.

**Nota:** Certifique-se de substituir `<YOUR_REGION>` e `<YOUR_ACCOUNT_ID>` pelos valores corretos.

---

## **Etapa 6: Configurar o Evento de Teste na Função Lambda**

1. **Voltar para a Função Lambda:**

   - Retorne à aba onde está a função Lambda `ValidaPedido`.

2. **Criar um Evento de Teste:**

   - Clique em **Test** no topo da página da função Lambda.
   - Dê um nome ao evento de teste, como `TestePedidoS3`.
   - Em **Template - optional** selecione **S3-Put**.
   - Preencha os campos com as informações do bucket e do arquivo:
     - **Bucket:** `translogistica-pedidos`
     - **Object key:** `novos-pedidos/pedido-ORD-20231001-0001.json`
   - Ou substitua o texto do **Bloco Event JSON** pelo texto abaixo:
     - Substitua o **Bucket:** `translogistica-pedidos` pelo nome do bucket que você criou na Etapa 1    
     
      ```json
      {
        "Records": [
          {
            "eventVersion": "2.0",
            "eventSource": "aws:s3",
            "awsRegion": "us-east-1",
            "eventTime": "1970-01-01T00:00:00.000Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
              "principalId": "EXAMPLE"
            },
            "requestParameters": {
              "sourceIPAddress": "127.0.0.1"
            },
            "responseElements": {
              "x-amz-request-id": "EXAMPLE123456789",
              "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
            },
            "s3": {
              "s3SchemaVersion": "1.0",
              "configurationId": "testConfigRule",
              "bucket": {
                "name": "translogistica-pedidos",
                "ownerIdentity": {
                  "principalId": "EXAMPLE"
                },
                "arn": "arn:aws:s3:::translogistica-pedidos"
              },
              "object": {
                "key": "novos-pedidos/pedido-ORD-20231001-0001.json",
                "size": 1024,
                "eTag": "0123456789abcdef0123456789abcdef",
                "sequencer": "0A1B2C3D4E5F678901"
              }
            }
          }
        ]
      }
      ```
   - Clique em **Save**.
   - Clique em **Test**

3. **Executar o Evento de Teste:**

   - Clique em **Test** novamente para executar a função Lambda usando o evento de teste criado.
   - Verifique os logs e a saída da execução para confirmar se o pedido foi processado e inserido na tabela DynamoDB com sucesso.

---

## **Etapa 7: Validar o Pedido no DynamoDB**

1. **Acessar a Tabela DynamoDB:**

   - No menu de serviços da AWS, acesse **DynamoDB**.
   - No menu lateral do lado esquerdo, clique em **Tables**.
   - Selecione a tabela **PedidosValidos**.

2. **Verificar o Item Inserido:**

   - Clique em **Explore table items**.
   - Verifique se o pedido que foi inserido pelo Lambda aparece na tabela.
   - Certifique-se de que os dados estão corretos clicando no registro **order_id** 'ORD-20231001-0001'.

---

## **Etapa 8: Automatizar a Execução da Função Lambda**

1. **Configurar a Trigger no S3:**

   - Volte à página da função Lambda **ValidaPedido**.
   - Clique em **Add trigger** localizado na parte de cima da Lambda.
   - Selecione **S3** como o tipo de trigger.
   - **Bucket:** Selecione o bucket `translogistica-pedidos`.
   - **Event type:** Selecione **All object create events**.
   - **Prefix:** `novos-pedidos/`
   - **Suffix:** `.json`
   - Marque a opção **(X) I acknowledge that using the same S3 bucket ...**
   - Clique em **Add**.

2. **Testar a Automação:**

   - Faça o upload de um novo arquivo de pedido para o bucket S3, dentro da pasta **novos-pedidos/**.
   - Verifique se a função Lambda é disparada automaticamente e o pedido é inserido no DynamoDB.

     ```json
     {
       "order_id": "ORD-20231002-0002",
       "company": {
         "name": "Alpha Tech Solutions",
         "cnpj": "23.456.789/0001-88"
       },
       "customer": {
         "first_name": "Carlos",
         "last_name": "Silva",
         "cpf": "234.567.890-11",
         "email": "carlos.silva@example.com",
         "phone": "+55 11 99876-5432",
         "address": {
           "street": "Rua dos Inventores",
           "number": "100",
           "complement": "Sala 3",
           "neighborhood": "Centro",
           "city": "São Paulo",
           "state": "SP",
           "zip_code": "01000-000"
         }
       },
       "order_date": "2023-10-02T14:45:00Z",
       "items": [
         {
           "product_id": "PRD-3003",
           "description": "Notebook ABC",
           "quantity": 1,
           "unit_price": 3500.00
         },
         {
           "product_id": "PRD-4004",
           "description": "Mouse Gamer",
           "quantity": 1,
           "unit_price": 200.00
         }
       ],
       "payment": {
         "method": "Boleto Bancário",
         "transaction_id": "TXN-1234567890",
         "amount": 3700.00
       },
       "shipping": {
         "method": "Normal",
         "cost": 30.00,
         "address": {
           "street": "Rua dos Inventores",
           "number": "100",
           "complement": "Sala 3",
           "neighborhood": "Centro",
           "city": "São Paulo",
           "state": "SP",
           "zip_code": "01000-000"
         },
         "expected_delivery_date": "2023-10-05"
       },
       "order_status": "Pendente",
       "notes": "Entregar durante o horário comercial."
     }
     ```
---

## **Conclusão**

Você concluiu a atividade prática, criando uma solução **serverless** para processar pedidos de forma automatizada, utilizando **S3**, **DynamoDB** e **Lambda** na **AWS**. Essa arquitetura permite a integração entre um site estático e serviços de backend, garantindo escalabilidade e facilidade de manutenção.
