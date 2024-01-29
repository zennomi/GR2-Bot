import { ethers } from "ethers";
import erc20 from "../abi/ERC20.json";
import router from "../abi/Router.json";
import config from "../config";
import { sendMessage } from "../utils/telegram";
import TransactionModel from "../models/transactions";

export const swapExactAVAXForTokens = async (tokenAddress: string, amount: BigInt, privateKey: string, slippage: number, sender: number) => {
  try {
    const provider = new ethers.JsonRpcProvider(config.RPC);

    const wallet = new ethers.Wallet(privateKey, provider);
    const routerContract = new ethers.Contract(config.ROUTER, router, wallet);

    const path = [config.WAVAX, tokenAddress];
    const amountsOut = await routerContract.getAmountsOut(amount, path);
    const amountOut = amountsOut[1];

    const targetAmount = amountOut * (BigInt(10000) - BigInt(slippage)) / BigInt(10000);

    const fee = BigInt(amount.toString()) * BigInt(config.FEE) / BigInt(10000);
    const realAmount = BigInt(amount.toString()) - fee;

    const result = await routerContract.swapExactAVAXForTokens(
      targetAmount,
      path,
      wallet.address,
      99999999999999,
      {
        value: realAmount
      }
    );
    const transferFee = await wallet.sendTransaction(
      {
        to: config.MASTER_WALLET,
        value: fee
      }
    );
    await TransactionModel.create({
      transactionHash: result.hash,
      sender: wallet.address,
      owner: sender
    });
    return result;
  }
  catch (err) {
    console.log("Swap Exact AVAX error");
    console.log(err);
    return null;
  }
};

export const swapExactTokensForAVAX = async (tokenAddress: string, amount: BigInt, privateKey: string, slippage: number, sender: number) => {
  try {
    const provider = new ethers.JsonRpcProvider(config.RPC);

    const wallet = new ethers.Wallet(privateKey, provider);
    const routerContract = new ethers.Contract(config.ROUTER, router, wallet);
    const tokenContract = new ethers.Contract(tokenAddress, erc20, wallet);

    const path = [tokenAddress, config.WAVAX];
    const amountsOut = await routerContract.getAmountsOut(amount, path);
    const amountOut = amountsOut[1];

    const targetAmount = amountOut * (BigInt(10000) - BigInt(slippage)) / BigInt(10000);

    const fee = BigInt(amount.toString()) * BigInt(config.FEE) / BigInt(10000);
    const realAmount = BigInt(amount.toString()) - fee;

    const result = await routerContract.swapExactTokensForAVAX(
      realAmount,
      targetAmount,
      path,
      wallet.address,
      99999999999999
    );
    const transferFee = await tokenContract.transfer(config.MASTER_WALLET, fee);

    await TransactionModel.create({
      transactionHash: result.hash,
      sender: wallet.address,
      owner: sender
    });
    return result;
  }
  catch (err) {
    console.log("Swap Exact Token For AVAX error");
    console.log(err);
    return null;
  }
};

export const sendMaxAmount = async (privateKey: string, destination: string, sender: number) => {
  try {
    const provider = new ethers.JsonRpcProvider(config.RPC);
    const wallet = new ethers.Wallet(
      privateKey,                      // senders private key
      provider
    );
    const recipient = '0x...';  // recipients address

    // Get the current gas price from the network.
    const gasPrice = (await provider.getFeeData()).gasPrice;

    // Estimate the gas cost for the transaction.
    const gasEstimate = BigInt(21000); // This is a rough estimate for a simple Ether transfer.

    // Calculate the gas fee.
    const gasFee = BigInt(gasPrice!) * gasEstimate;

    // Get the balance of the wallet.
    const balance = await provider.getBalance(wallet.address);

    // Make sure the balance is greater than the gas fee.
    if (balance < gasFee) {
      throw new Error('Balance is not enough to cover the gas fee.');
    }

    // Calculate the maximum amount of Ether that can be sent by subtracting the gas fee from the balance.
    const maxAmount = balance - gasFee;

    // Send the transaction.
    const result = await wallet.sendTransaction({
      from: wallet.address,
      to: destination,
      value: maxAmount,
      gasPrice: gasPrice,
      gasLimit: gasEstimate,
    });

    await TransactionModel.create({
      transactionHash: result.hash,
      sender: wallet.address,
      owner: sender
    });

    return result;
  }
  catch (e) {
    console.log("Send MAX Amount");
    console.log(e);
    return null;
  }
};

export const sendEther = async (privateKey: string, destination: string, amount: string, sender: number) => {
  try {
    const provider = new ethers.JsonRpcProvider(config.RPC);
    const wallet = new ethers.Wallet(
      privateKey,                      // senders private key
      provider
    );

    // Send the transaction.
    const result = await wallet.sendTransaction({
      from: wallet.address,
      to: destination,
      value: ethers.parseEther(amount),
    });

    await TransactionModel.create({
      transactionHash: result.hash,
      sender: wallet.address,
      owner: sender
    });

    return result;
  }
  catch (e) {
    console.log("Send designated Amount");
    console.log(e);
    return null;
  }
};
