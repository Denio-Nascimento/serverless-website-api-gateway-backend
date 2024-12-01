# Entendendo CORS na Arquitetura Serverless com API Gateway, AWS Lambda, CloudFront e S3

Quando você hospeda um site estático no Amazon S3 e o distribui globalmente usando o CloudFront, muitas vezes precisa que esse site se comunique com uma API para obter ou enviar dados. Essa API é geralmente construída com o API Gateway e AWS Lambda. Para que essa comunicação funcione de maneira segura e eficiente, é fundamental configurar o CORS (Cross-Origin Resource Sharing) corretamente.

CORS é uma regra de segurança implementada pelos navegadores que impede que um site faça requisições para outro domínio sem permissão explícita. Por exemplo, se seu site estático está em `https://meusite.com` e a API está em `https://minhaapi.com`, o navegador bloqueará essas requisições por padrão para proteger os dados. Habilitar o CORS no API Gateway permite que seu site específico (`https://meusite.com`) acesse a API (`https://minhaapi.com`), garantindo que apenas origens autorizadas possam interagir com ela.

## Configurando CORS para GET e POST

Para configurar o CORS para os métodos GET e POST, você deve seguir alguns passos essenciais. Primeiro, no API Gateway, habilite o CORS para esses métodos, definindo os cabeçalhos permitidos (`Access-Control-Allow-Headers`), os métodos permitidos (`Access-Control-Allow-Methods`) e a origem permitida (`Access-Control-Allow-Origin`). Isso informa ao navegador que o seu site tem permissão para fazer requisições à API, evitando erros de bloqueio.

Além disso, é necessário adicionar um método OPTIONS para cada endpoint que utilizará CORS. Essas requisições OPTIONS são conhecidas como *Preflight Requests* e são enviadas automaticamente pelo navegador antes das requisições principais (como GET ou POST). Elas verificam se a API permite a operação que o site está tentando realizar. O API Gateway deve responder a essas requisições OPTIONS com os cabeçalhos CORS apropriados, como `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` e `Access-Control-Allow-Headers`, confirmando que a operação está autorizada.

## Incluindo Cabeçalhos de CORS no AWS Lambda

No AWS Lambda, que processa as requisições e gera as respostas da API, é crucial incluir os cabeçalhos de CORS na resposta. Isso garante que, quando a função Lambda retorna dados ao site estático, o navegador reconheça que essa resposta está permitida. Por exemplo, adicionar `"Access-Control-Allow-Origin": "https://meusite.com"` na resposta da Lambda permite que o navegador aceite os dados provenientes da API.

## Diferenças entre Métodos GET e POST

As diferenças entre os métodos GET e POST também influenciam a configuração de CORS. O método GET é utilizado para recuperar dados e geralmente não altera o estado do servidor. As requisições GET são simples e podem ser armazenadas em cache pelo navegador, melhorando a performance. Já o método POST é usado para enviar dados ao servidor, criando ou atualizando recursos, e não é armazenado em cache. Embora ambos os métodos necessitem de configuração CORS semelhante, é importante garantir que os cabeçalhos permitidos e os métodos estejam corretamente definidos para cada tipo de requisição.

## Usando o API Gateway como Proxy

Por fim, configurar o API Gateway como proxy simplifica o processo, pois ele encaminha automaticamente as respostas da Lambda, incluindo os cabeçalhos de CORS, diretamente para o site. Isso elimina a necessidade de gerenciar manualmente os cabeçalhos em cada resposta, tornando a integração mais eficiente e segura.

## Resumo

Em resumo, para que seu site estático no S3, distribuído pelo CloudFront, possa se comunicar de forma segura e sem bloqueios com sua API no API Gateway e Lambda, você precisa:

1. Habilitar CORS no API Gateway para os métodos GET e POST, definindo os cabeçalhos e métodos permitidos.
2. Adicionar métodos OPTIONS no API Gateway para responder às requisições *preflight*, garantindo que o navegador reconheça as permissões.
3. Incluir cabeçalhos de CORS nas respostas do AWS Lambda, permitindo que o navegador aceite os dados retornados pela API.
4. Configurar o API Gateway como proxy para facilitar o encaminhamento automático dos cabeçalhos de CORS.

Com essas configurações, você assegura que seu site estático possa acessar a API backend de maneira segura e eficiente, proporcionando uma experiência fluida para os usuários e permitindo que seus alunos apliquem esses conceitos na prática com confiança.
