const API_BASE_URL = 'https://dz0w9fwc0k.execute-api.us-east-1.amazonaws.com/prod';

// Função para obter o parâmetro `order_id` da URL
function getOrderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('order_id');
}

// Função para buscar e exibir os detalhes do pedido
async function fetchOrderDetails() {
    const orderId = getOrderIdFromUrl();
    if (!orderId) {
        console.error('ID do pedido não encontrado na URL.');
        return;
    }

    console.log(`Buscando detalhes do pedido: ${orderId}...`);

    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        if (!response.ok) throw new Error(`Erro ao buscar detalhes: ${response.statusText}`);

        const order = await response.json();
        console.log('Pedido recebido:', order);

        // Preencher o formulário com os dados do pedido
        document.getElementById('order_id').value = order.order_id;
        document.getElementById('order_date').value = new Date(order.order_date).toLocaleDateString('pt-BR');
        document.getElementById('order_status').value = order.order_status;
        document.getElementById('customer_name').value = `${order.customer.first_name} ${order.customer.last_name}`;
        document.getElementById('customer_email').value = order.customer.email;
        document.getElementById('customer_phone').value = order.customer.phone;

        // Preencher os itens do pedido
        const itemsList = document.getElementById('items-list');
        itemsList.innerHTML = ''; // Limpar itens existentes
        order.items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item');
            listItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${item.description}</h5>
                    <small>Quantidade: ${item.quantity}</small>
                </div>
                <p class="mb-1">Preço Unitário: R$ ${parseFloat(item.unit_price).toFixed(2)}</p>
            `;
            itemsList.appendChild(listItem);
        });

        // Preencher informações de pagamento
        document.getElementById('payment_method').value = order.payment.method;
        document.getElementById('payment_amount').value = `R$ ${parseFloat(order.payment.amount).toFixed(2)}`;

        // Preencher informações de envio
        document.getElementById('shipping_method').value = order.shipping.method;

        const shippingAddress = `
            ${order.shipping.address.street}, ${order.shipping.address.number}, ${order.shipping.address.complement}
            ${order.shipping.address.neighborhood}, ${order.shipping.address.city} - ${order.shipping.address.state}
            CEP: ${order.shipping.address.zip_code}
        `;
        document.getElementById('shipping_address').value = shippingAddress.trim();
        document.getElementById('shipping_cost').value = `R$ ${parseFloat(order.shipping.cost).toFixed(2)}`;
        document.getElementById('shipping_date').value = new Date(order.shipping.expected_delivery_date).toLocaleDateString('pt-BR');

        // Ocultar o loader após carregar os dados
        document.getElementById('loader').style.display = 'none';
        document.getElementById('order-form').style.display = 'block';
    } catch (error) {
        console.error('Erro ao buscar detalhes do pedido:', error);
        // Exibir mensagem de erro ao usuário
        document.getElementById('order-form').innerHTML = `
            <div class="alert alert-danger" role="alert">
                Ocorreu um erro ao carregar os detalhes do pedido. Por favor, tente novamente mais tarde.
            </div>
        `;
        // Ocultar o loader
        document.getElementById('loader').style.display = 'none';
    }
}

// Carregar os detalhes ao carregar a página
document.addEventListener('DOMContentLoaded', fetchOrderDetails);
