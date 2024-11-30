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
