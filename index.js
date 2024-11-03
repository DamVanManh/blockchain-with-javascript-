// https://youtu.be/TlW5KqOKWoQ?si=oSdRtRdMpZ0-ncpj
const hash = require("crypto-js/sha256");

class Block {
  constructor(prevHash, data) {
    this.prevHash = prevHash;
    this.data = data;
    this.timeStamp = new Date();
    this.hash = this.calculateHash();
    this.mineVar = 0;
  }
  calculateHash() {
    return hash(
      this.prevHash + JSON.stringify(this.data) + this.timeStamp + this.mineVar
    ).toString();
  }

  mine(difficulty) {
    while (!this.hash.startsWith("0".repeat(difficulty))) {
      this.mineVar++; // vì input vào đã cho cho ra kết quả k như mong đợi là phải start với 00... nên cần phải đổi input để có output hash mới > tăng mineVar
      this.hash = this.calculateHash();
    }
  }
}

class BlockChain {
  constructor(difficulty) {
    const genesisBLock = new Block("0000", { isGenesis: true });

    this.difficulty = difficulty;
    this.chain = [genesisBLock];
  }
  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }
  addBlock(data) {
    const lastBlock = this.getLastBlock();
    const newBlock = new Block(lastBlock.hash, data);

    console.log("start mining");
    console.time("mine");
    newBlock.mine(this.difficulty); // khi add block mới thì phải đào với độ khó lớn
    console.timeEnd("mine");
    console.log("end mining", newBlock);

    this.chain.push(newBlock);
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      if (currentBlock.prevHash !== prevBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

const hoangChain = new BlockChain(5);
console.log(hoangChain);

hoangChain.addBlock({
  from: "hoang",
  to: "code dao",
  amount: 100,
});

hoangChain.addBlock({
  from: "hoang",
  to: "tran",
  amount: 400,
});

// // hack thử và bị chống hack
// hoangChain.chain[1].data = {
//   from: "hoang",
//   to: "code dao",
//   amount: 50,
// };
// hoangChain.chain[1].hash = hoangChain.chain[1].calculateHash();
// console.log(hoangChain.chain);
// console.log("chain valid ", hoangChain.isValid());
