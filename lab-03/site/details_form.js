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
            listItem.innerHTML = `
                <div class="item-header">${item.description}</div>
                <div>Quantidade: ${item.quantity}</div>
                <div>Preço Unitário: R$ ${parseFloat(item.unit_price).toFixed(2)}</div>
            `;
            itemsList.appendChild(listItem);
        });

        document.getElementById('payment_method').value = order.payment.method;
        document.getElementById('payment_amount').value = `R$ ${parseFloat(order.payment.amount).toFixed(2)}`;
        document.getElementById('shipping_method').value = order.shipping.method;

        const shippingAddress = `
            ${order.shipping.address.street}, ${order.shipping.address.number}, ${order.shipping.address.complement}
            ${order.shipping.address.neighborhood}, ${order.shipping.address.city} - ${order.shipping.address.state}
            CEP: ${order.shipping.address.zip_code}
        `;
        document.getElementById('shipping_address').value = shippingAddress;
        document.getElementById('shipping_cost').value = `R$ ${parseFloat(order.shipping.cost).toFixed(2)}`;
        document.getElementById('shipping_date').value = new Date(order.shipping.expected_delivery_date).toLocaleDateString('pt-BR');
    } catch (error) {
        console.error('Erro ao buscar detalhes do pedido:', error);
    }
}

// Carregar os detalhes ao carregar a página
document.addEventListener('DOMContentLoaded', fetchOrderDetails);
