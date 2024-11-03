const hash = require("crypto-js/sha256");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

class Wallet {
  constructor() {
    const key = ec.genKeyPair();
    this.privateKey = key.getPrivate("hex");
    this.publicKey = key.getPublic("hex");
  }

  createTransaction(toAddress, amount) {
    const transaction = new Transaction(this.publicKey, toAddress, amount);
    transaction.signature = this.signTransaction(transaction);
    return transaction;
  }

  signTransaction(transaction) {
    const hashTx = hash(
      JSON.stringify({
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
      })
    ).toString();

    const sig = ec.keyFromPrivate(this.privateKey).sign(hashTx, "base64");
    return sig.toDER("hex");
  }
}

class Transaction {
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.signature = null;
  }

  isValid() {
    if (this.from === null) return true;
    if (!this.signature || !this.from)
      throw new Error("No signature in this transaction");

    const key = ec.keyFromPublic(this.from, "hex");
    const hashTx = hash(
      JSON.stringify({ from: this.from, to: this.to, amount: this.amount })
    ).toString();

    return key.verify(hashTx, this.signature);
  }
}

class Block {
  constructor(prevHash, transactions) {
    this.prevHash = prevHash;
    this.transactions = transactions;
    this.timeStamp = new Date();
    this.hash = this.calculateHash();
    this.mineVar = 0;
  }

  calculateHash() {
    return hash(
      this.prevHash +
        JSON.stringify(this.transactions) +
        this.timeStamp +
        this.mineVar
    ).toString();
  }

  mine(difficulty) {
    while (!this.hash.startsWith("0".repeat(difficulty))) {
      this.mineVar++;
      this.hash = this.calculateHash();
    }
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }
}

class BlockChain {
  constructor(difficulty) {
    const genesisBlock = new Block("0000", []);
    this.difficulty = difficulty;
    this.chain = [genesisBlock];
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    if (!transaction.isValid()) throw new Error("Invalid transaction");
    this.pendingTransactions.push(transaction);
  }

  minePendingTransactions(miningRewardAddress) {
    const block = new Block(this.getLastBlock().hash, this.pendingTransactions);
    block.mine(this.difficulty);

    console.log("Block mined!");
    this.chain.push(block);

    this.pendingTransactions = [
      new Transaction(null, miningRewardAddress, this.miningReward),
    ];
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.from === address) {
          balance -= trans.amount;
        }
        if (trans.to === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (!currentBlock.hasValidTransactions()) {
        return false;
      }

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

// Testing
const myWallet = new Wallet();
const recipientWallet = new Wallet();

const myTransaction = myWallet.createTransaction(recipientWallet.publicKey, 50);

const myBlockchain = new BlockChain(2);
myBlockchain.addTransaction(myTransaction);

myBlockchain.minePendingTransactions(myWallet.publicKey);
console.log(
  "Balance of my wallet:",
  myBlockchain.getBalanceOfAddress(myWallet.publicKey)
);
console.log(
  "Balance of recipient wallet:",
  myBlockchain.getBalanceOfAddress(recipientWallet.publicKey)
);
