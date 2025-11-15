const fs = require('fs');
const path = require('path');

const casamentosPath = path.join(__dirname, 'casamentos.json');

function loadData() {
  if (!fs.existsSync(casamentosPath)) {
    fs.writeFileSync(casamentosPath, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(casamentosPath, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(casamentosPath, JSON.stringify(data, null, 2));
}

async function casar(id1, id2, dataCasamento) {
  const data = loadData();
  data.push({
    proposer: id1,
    member: id2,
    data: dataCasamento,
  });
  saveData(data);
}

async function divorciar(id1, id2) {
  let casamentos = loadData();
  casamentos = casamentos.filter(
    c => !(
      (c.proposer === id1 && c.member === id2) ||
      (c.proposer === id2 && c.member === id1)
    )
  );
  saveData(casamentos);
}

async function getCasamento(id1, id2) {
  const casamentos = loadData();
  return casamentos.find(
    c => (
      (c.proposer === id1 && c.member === id2) ||
      (c.proposer === id2 && c.member === id1)
    )
  );
}

module.exports = {
  casar,
  divorciar,
  getCasamento,
};