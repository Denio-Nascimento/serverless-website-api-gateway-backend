const API_BASE_URL = 'https://dz0w9fwc0k.execute-api.us-east-1.amazonaws.com/prod';

async function fetchOrders() {
    console.log('Iniciando fetchOrders...');
    try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) throw new Error(`Erro ao buscar pedidos: ${response.statusText}`);

        const data = await response.json();
        const orders = Array.isArray(data) ? data : (data.body || []);
        if (orders.length === 0) {
            console.warn('Nenhum pedido encontrado.');
            return;
        }

        const ordersBody = document.getElementById('orders-body');
        ordersBody.innerHTML = ''; // Limpar tabela antes de preencher

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.order_id}</td>
                <td>${new Date(order.order_date).toLocaleDateString('pt-BR')}</td>
                <td>${order.order_status}</td>
                <td>${order.customer.first_name} ${order.customer.last_name}</td>
                <td><a href="details.html?order_id=${order.order_id}">Ver Detalhes</a></td>
            `;
            ordersBody.appendChild(row);
        });

        console.log('Pedidos carregados com sucesso.');
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
    }
}

// Carregar os pedidos ao carregar a página
document.addEventListener('DOMContentLoaded', fetchOrders);
