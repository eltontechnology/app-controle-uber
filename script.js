let transacoes = [];
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();
let db;

// Abre o banco de dados
function abrirBancoDeDados() {
    const request = indexedDB.open('transacoesDB', 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        const objectStore = db.createObjectStore('transacoes', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('mes', 'mes');
        objectStore.createIndex('ano', 'ano');
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        carregarTransacoes(); // Carrega transações ao abrir o banco
    };

    request.onerror = function(event) {
        console.error('Erro ao abrir o banco de dados:', event);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    abrirBancoDeDados(); // Chama a função para abrir o banco de dados
    inicializarDatepicker();
    atualizarTituloMes();
    exibirTransacoes();

    document.getElementById('adicionar').addEventListener('click', adicionarTransacao);
    document.getElementById('mes-anterior').addEventListener('click', () => mudarMes(-1));
    document.getElementById('mes-proximo').addEventListener('click', () => mudarMes(1));
    document.getElementById('exportar-csv').addEventListener('click', exportarParaCSV);
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
    historicosMeses.innerHTML = '';

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
    tabela.classList.add('table-responsive');
    tabela.classList.add('table-container');
    tabela.innerHTML = `
        <table class="table table-dark table-hover">
            <thead>
                <tr>
                    <th>📅 Data</th>
                    <th>📝 Descrição</th>
                    <th>💲 Valor</th>
                    <th>💱 Tipo</th>
                    <th>👉 Ações</th>
                </tr>
            </thead>
            <tbody>
                ${transacoesFiltradas.map((transacao, index) => `
                    <tr class="${transacao.tipo === 'entrada' ? 'historico-entrada' : 'historico-saida'}">
                        <td data-label="📅 Data">${transacao.data}</td>
                        <td data-label="📝 Descrição">${transacao.descricao}</td>
                        <td data-label="💲 Valor">R$ ${transacao.valor.toFixed(2)}</td>
                        <td data-label="💱 Tipo">${transacao.tipo.charAt(0).toUpperCase() + transacao.tipo.slice(1)}</td>
                        <td data-label="👉 Ações">
                            <button class="btn btn-warning btn-sm mr-2" onclick="editarTransacao(${index})">✏️Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="confirmarExcluirTransacao(${index})">🗑️Excluir</button>
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
    const dataFormatada = new Date(transacao.data.split('/').reverse().join('/'));

    $('.datepicker').datepicker('update', dataFormatada);
    document.getElementById('descricao').value = transacao.descricao;
    document.getElementById('valor').value = transacao.valor;
    document.querySelector(`input[name="tipo"][value="${transacao.tipo}"]`).checked = true;

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
        <h3>📈 Entradas: <span class="valor total-entrada">R$ ${totalEntradas.toFixed(2)}</span></h3>
        <h3>📉 Saídas: <span class="valor total-saida">R$ ${totalSaidas.toFixed(2)}</span></h3>
        <h3>📊 Saldo: <span class="valor saldo" style="color: ${saldo >= 0 ? '#00FFFF'  : 'red'};">R$ ${saldo.toFixed(2)}</span></h3>
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
    document.getElementById('entrada').checked = true; // Resetando para 'Entrada'
}

function salvarTransacoes() {
    const transaction = db.transaction(['transacoes'], 'readwrite');
    const objectStore = transaction.objectStore('transacoes');

    // Remove todas as transações existentes antes de salvar as novas
    objectStore.clear();

    transacoes.forEach(transacao => {
        objectStore.add(transacao);
    });

    transaction.oncomplete = function() {
        console.log('Transações salvas com sucesso.');
    };

    transaction.onerror = function(event) {
        console.error('Erro ao salvar transações:', event);
    };
}

function carregarTransacoes() {
    const transaction = db.transaction(['transacoes'], 'readonly');
    const objectStore = transaction.objectStore('transacoes');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        transacoes = event.target.result;
        exibirTransacoes(); // Exibe as transações após carregá-las
    };

    request.onerror = function(event) {
        console.error('Erro ao carregar transações:', event);
    };
}

function exportarParaCSV() {
    const transacoesFiltradas = transacoes.filter(transacao => transacao.mes === mesAtual && transacao.ano === anoAtual);
    let csv = 'Data,Descrição,Valor,Tipo\n';
    transacoesFiltradas.forEach(transacao => {
        csv += `${transacao.data},${transacao.descricao},${transacao.valor},${transacao.tipo}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes_${obterNomeMes(mesAtual)}_${anoAtual}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
