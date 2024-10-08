let transacoes = [];
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
    carregarTransacoes();
    exibirTransacoes();
    document.getElementById('mes-atual').textContent = `${obterNomeMes(mesAtual)} ${anoAtual}`;

    document.getElementById('adicionar').addEventListener('click', adicionarTransacao);
    document.getElementById('mes-anterior').addEventListener('click', () => mudarMes(-1));
    document.getElementById('mes-proximo').addEventListener('click', () => mudarMes(1));
});

function obterNomeMes(mes) {
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[mes];
}

function adicionarTransacao() {
    const dataTransacao = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.querySelector('input[name="tipo"]:checked').value; // Obtém o valor do rádio selecionado

    if (!dataTransacao || !descricao || isNaN(valor) || valor <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    const dataFormatada = new Date(dataTransacao);
    
    const transacao = {
        data: dataFormatada.toLocaleDateString(),
        descricao,
        valor,
        tipo,
        mes: dataFormatada.getMonth(),
        ano: dataFormatada.getFullYear()
    };

    transacoes.push(transacao);
    salvarTransacoes();
    exibirTransacoes();
    limparCampos();
}

function mudarMes(direcao) {
    mesAtual += direcao;
    if (mesAtual < 0) {
        mesAtual = 11;
        anoAtual--;
    } else if (mesAtual > 11) {
        mesAtual = 0;
        anoAtual++;
    }
    document.getElementById('mes-atual').textContent = `${obterNomeMes(mesAtual)} ${anoAtual}`;
    exibirTransacoes();
}

function exibirTransacoes() {
    const historicosMeses = document.getElementById('historicos-meses');
    historicosMeses.innerHTML = ''; // Limpa o conteúdo anterior

    const transacoesFiltradas = transacoes.filter(transacao => transacao.mes === mesAtual && transacao.ano === anoAtual);

    if (transacoesFiltradas.length === 0) {
        historicosMeses.innerHTML = `<p class="text-light"><h5>Nenhuma transação encontrada para ${obterNomeMes(mesAtual)} ${anoAtual}.</p>`;
        return;
    }

    const tabela = document.createElement('div');
    tabela.classList.add('table-container');
    tabela.innerHTML = `
        <table class="table table-dark">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Tipo</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
            ${transacoesFiltradas.map((transacao, index) => `
                <tr class="${transacao.tipo === 'entrada' ? 'historico-entrada' : 'historico-saida'}">
                    <td>${transacao.data}</td>
                    <td>${transacao.descricao}</td>
                    <td>R$ ${transacao.valor.toFixed(2)}</td>
                    <td>${transacao.tipo.charAt(0).toUpperCase() + transacao.tipo.slice(1)}</td>
                    <td>
                        <button class="btn btn-warning btn-editar" onclick="editarTransacao(${index})">Editar</button>
                        <button class="btn btn-danger btn-excluir" onclick="confirmarExcluirTransacao(${index})">Excluir</button>
                    </td>
                </tr>
            `).join('')}
            </tbody>
        </table>
    `;
    historicosMeses.appendChild(tabela);

    atualizarTotais(transacoesFiltradas);
}

function editarTransacao(index) {
    const transacao = transacoes[index];
    document.getElementById('data').value = transacao.data;
    document.getElementById('descricao').value = transacao.descricao;
    document.getElementById('valor').value = transacao.valor;
    document.querySelector(`input[name="tipo"][value="${transacao.tipo}"]`).checked = true; // Seleciona o rádio correspondente

    // Remove a transação atual antes de editar
    excluirTransacao(index);
}

function confirmarExcluirTransacao(index) {
    const confirmar = confirm('Você tem certeza que deseja excluir esta transação?');
    if (confirm) {
        excluirTransacao(index);
    }
}

function excluirTransacao(index) {
    transacoes.splice(index, 1);
    salvarTransacoes();
    exibirTransacoes();
}

function atualizarTotais(transacoesFiltradas) {
    const totalEntradas = transacoesFiltradas.reduce((acc, transacao) => acc + (transacao.tipo === 'entrada' ? transacao.valor : 0), 0);
    const totalSaidas = transacoesFiltradas.reduce((acc, transacao) => acc + (transacao.tipo === 'saida' ? transacao.valor : 0), 0);
    const saldo = totalEntradas - totalSaidas;

    const totaisDiv = document.createElement('div');
    totaisDiv.classList.add('totais');
    totaisDiv.innerHTML = `
        <h5>Entradas: <span class="valor total-entrada">${formatarValor(totalEntradas)}</span></h5>
        <h5>Saídas: <span class="valor total-saida">${formatarValor(totalSaidas)}</span></h5>
        <h3>Saldo: <span class="valor saldo" style="color: ${saldo >= 0 ? '#0877e5' : 'red'};">${formatarValor(saldo)}</span></h3>
    `;

    const container = document.querySelector('.table-container');
    container.appendChild(totaisDiv);
}

function formatarValor(valor) {
    return `R$ ${valor.toFixed(2)}`;
}

function limparCampos() {
    document.getElementById('data').value = '';
    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('entrada').checked = true; // Resetando para 'Entrada'
}

function salvarTransacoes() {
    localStorage.setItem('transacoes', JSON.stringify(transacoes));
}

function carregarTransacoes() {
    const transacoesSalvas = JSON.parse(localStorage.getItem('transacoes'));
    if (transacoesSalvas) {
        transacoes = transacoesSalvas;
    }
}
