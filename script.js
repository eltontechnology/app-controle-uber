let transacoes = [];
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
    inicializarDatepicker();
    carregarTransacoes();
    atualizarTituloMes();
    exibirTransacoes();

    document.getElementById('adicionar').addEventListener('click', adicionarTransacao);
    document.getElementById('mes-anterior').addEventListener('click', () => mudarMes(-1));
    document.getElementById('mes-proximo').addEventListener('click', () => mudarMes(1));
});

function inicializarDatepicker() {
    $('.datepicker').datepicker({
        format: 'dd/mm/yyyy',
        language: 'pt-BR',
        autoclose: true,
        todayHighlight: true
    });
}

function obterNomeMes(mes) {
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[mes];
}

function atualizarTituloMes() {
    document.getElementById('mes-atual').textContent = `${obterNomeMes(mesAtual)} ${anoAtual}`;
}

function adicionarTransacao() {
    const dataTransacao = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.querySelector('input[name="tipo"]:checked').value;

    if (!dataTransacao || !descricao || isNaN(valor) || valor <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    const dataFormatada = new Date(dataTransacao.split('/').reverse().join('/')); // Converter para YYYY-MM-DD

    const transacao = {
        data: dataFormatada.toLocaleDateString('pt-BR'),
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
    atualizarTituloMes();
    exibirTransacoes();
}

function exibirTransacoes() {
    const historicosMeses = document.getElementById('historicos-meses');
    historicosMeses.innerHTML = ''; // Limpa o conteúdo anterior

    const transacoesFiltradas = transacoes.filter(transacao => transacao.mes === mesAtual && transacao.ano === anoAtual);

    if (transacoesFiltradas.length === 0) {
        historicosMeses.innerHTML = `<p class="text-light">Nenhuma transação encontrada para ${obterNomeMes(mesAtual)} ${anoAtual}.</p>`;
        return;
    }

    const tabela = criarTabela(transacoesFiltradas);
    historicosMeses.appendChild(tabela);
    atualizarTotais(transacoesFiltradas);
}

function criarTabela(transacoesFiltradas) {
    const tabela = document.createElement('div');
    tabela.classList.add('table-container');
    tabela.innerHTML = `
        <table class="table table-dark table-hover">
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
                            <button class="btn btn-warning btn-sm mr-2" onclick="editarTransacao(${index})">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="confirmarExcluirTransacao(${index})">Excluir</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    return tabela;
}

function editarTransacao(index) {
    const transacao = transacoes[index];
    const dataFormatada = new Date(transacao.data.split('/').reverse().join('/')); // Converter para YYYY-MM-DD

    // Preencher os campos do formulário com os dados da transação
    $('.datepicker').datepicker('update', dataFormatada);
    document.getElementById('descricao').value = transacao.descricao;
    document.getElementById('valor').value = transacao.valor;
    document.querySelector(`input[name="tipo"][value="${transacao.tipo}"]`).checked = true;

    // Remove a transação atual antes de editar
    excluirTransacao(index);
}

function confirmarExcluirTransacao(index) {
    const confirmar = confirm('Você tem certeza que deseja excluir esta transação?');
    if (confirmar) {
        excluirTransacao(index);
    }
}

function excluirTransacao(index) {
    transacoes.splice(index, 1);
    salvarTransacoes();
    exibirTransacoes();
}

function atualizarTotais(transacoesFiltradas) {
    const totalEntradas = transacoesFiltradas
        .filter(transacao => transacao.tipo === 'entrada')
        .reduce((acc, transacao) => acc + transacao.valor, 0);
    const totalSaidas = transacoesFiltradas
        .filter(transacao => transacao.tipo === 'saida')
        .reduce((acc, transacao) => acc + transacao.valor, 0);
    const saldo = totalEntradas - totalSaidas;

    const totaisDiv = document.createElement('div');
    totaisDiv.classList.add('totais');
    totaisDiv.innerHTML = `
        <h3>Entradas: <span class="valor total-entrada">R$ ${totalEntradas.toFixed(2)}</span></h3>
        <h3>Saídas: <span class="valor total-saida">R$ ${totalSaidas.toFixed(2)}</span></h3>
        <h3>Saldo: <span class="valor saldo" style="color: ${saldo >= 0 ? '#00FFFF' : 'red'};">R$ ${saldo.toFixed(2)}</span></h3>
    `;

    const container = document.querySelector('.table-container');
    container.appendChild(totaisDiv);
}

function formatarValor(valor) {
    return `R$ ${valor.toFixed(2)}`;
}

function limparCampos() {
    $('.datepicker').datepicker('update', '');
    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';
    document.querySelector('input[name="tipo"][value="entrada"]').checked = true; // Seleciona entrada por padrão
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