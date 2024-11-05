let transacoes = [];
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();
let transacaoEditandoIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    inicializarDatepicker();
    carregarTransacoes();
    atualizarTituloMes();
    exibirTransacoes();

    document.getElementById('adicionar').addEventListener('click', adicionarOuAtualizarTransacao);
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

function adicionarOuAtualizarTransacao() {
    const dataTransacao = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.querySelector('input[name="tipo"]:checked').value;

    if (!dataTransacao || !descricao || isNaN(valor) || valor <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    const partesData = dataTransacao.split('/');
    const dataFormatada = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    const transacao = {
        data: dataFormatada.toLocaleDateString('pt-BR'),
        descricao,
        valor,
        tipo,
        mes: dataFormatada.getMonth(),
        ano: dataFormatada.getFullYear()
    };

    if (transacaoEditandoIndex !== null) {
        transacoes[transacaoEditandoIndex] = transacao;
        transacaoEditandoIndex = null;
    } else {
        transacoes.push(transacao);
    }

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
    historicosMeses.innerHTML = '';

    const transacoesFiltradas = transacoes.filter(transacao => transacao.mes === mesAtual && transacao.ano === anoAtual);

    if (transacoesFiltradas.length === 0) {
        historicosMeses.innerHTML = `<p class="text-light">Nenhuma transação encontrada para ${obterNomeMes(mesAtual)} ${anoAtual}.</p>`;
        atualizarTotais([]);
        return;
    }

    const tabela = criarTabela(transacoesFiltradas);
    historicosMeses.appendChild(tabela);
    atualizarTotais(transacoesFiltradas);
}

function criarTabela(transacoesFiltradas) {
    const tabela = document.createElement('div');
    tabela.classList.add('table-responsive', 'table-container');
    tabela.innerHTML = `
        <table class="table table-dark table-hover">
            <thead>
                <tr>
                    <th>📅 Data</th>
                    <th>📝 Descrição</th>
                    <th>💰 Valor</th>
                    <th>💱 Tipo</th>
                    <th>👉 Ações</th>
                </tr>
            </thead>
            <tbody>
                ${transacoesFiltradas.map((transacao, index) => `
                    <tr>
                        <td>${transacao.data}</td>
                        <td>${transacao.descricao}</td>
                        <td>${transacao.tipo === 'saida' ? '-' : ''}R$ ${transacao.valor.toFixed(2)}</td>
                        <td>${transacao.tipo.charAt(0).toUpperCase() + transacao.tipo.slice(1)}</td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="editarTransacao(${index})">✏️ Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="excluirTransacao(${index})">🗑️ Excluir</button>
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
    document.getElementById('data').value = transacao.data;
    document.getElementById('descricao').value = transacao.descricao;
    document.getElementById('valor').value = transacao.valor;
    document.querySelector(`input[name="tipo"][value="${transacao.tipo}"]`).checked = true;
    transacaoEditandoIndex = index;
}

function excluirTransacao(index) {
    transacoes.splice(index, 1);
    salvarTransacoes();
    exibirTransacoes();
}

function atualizarTotais(transacoesFiltradas) {
    const totalEntrada = transacoesFiltradas
        .filter(t => t.tipo === 'entrada')
        .reduce((acc, t) => acc + t.valor, 0);
    const totalSaida = transacoesFiltradas
        .filter(t => t.tipo === 'saida')
        .reduce((acc, t) => acc + t.valor, 0);
    const saldo = totalEntrada - totalSaida;

    document.querySelector('.total-entrada').textContent = `R$ ${totalEntrada.toFixed(2)}`;
    document.querySelector('.total-saida').textContent = `R$ ${totalSaida.toFixed(2)}`;
    document.querySelector('.saldo').textContent = `R$ ${saldo.toFixed(2)}`;
    document.querySelector('.saldo').style.color = saldo >= 0 ? '#00FFFF' : '#FF0000';
}

function limparCampos() {
    document.getElementById('data').value = '';
    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('entrada').checked = true;
}

function salvarTransacoes() {
    localStorage.setItem('transacoes', JSON.stringify(transacoes));
}

function carregarTransacoes() {
    const transacoesSalvas = localStorage.getItem('transacoes');
    if (transacoesSalvas) {
        transacoes = JSON.parse(transacoesSalvas);
    }
}
