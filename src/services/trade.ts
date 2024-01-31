import { ethers } from "ethers";
import erc20 from "../abi/ERC20.json";
import router from "../abi/Router.json";
import config from "../config";
import TransactionModel from "../models/transactions";
import logger from "../logger";

export const swapExactETHForTokens = async (tokenAddress: string, amount: BigInt, privateKey: string, slippage: number, sender: number) => {
  try {
    const provider = new ethers.JsonRpcProvider(config.RPC);

    const wallet = new ethers.Wallet(privateKey, provider);
    const routerContract = new ethers.Contract(config.ROUTER, router, wallet);

    const path = [config.WETH, tokenAddress];
    const amountsOut = await routerContract.getAmountsOut(amount, path);
    const amountOut = amountsOut[1];

    const targetAmount = amountOut * (BigInt(10000) - BigInt(slippage)) / BigInt(10000);

    const fee = BigInt(amount.toString()) * BigInt(config.FEE) / BigInt(10000);
    const realAmount = BigInt(amount.toString()) - fee;

    const result = await routerContract.swapExactETHForTokens(
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
    logger.info("Swap Exact ETH error");
    logger.error(err);
    return null;
  }
};

export const swapExactTokensForETH = async (tokenAddress: string, amount: BigInt, privateKey: string, slippage: number, sender: number) => {
  try {
    const provider = new ethers.JsonRpcProvider(config.RPC);

    const wallet = new ethers.Wallet(privateKey, provider);
    const routerContract = new ethers.Contract(config.ROUTER, router, wallet);
    const tokenContract = new ethers.Contract(tokenAddress, erc20, wallet);

    const path = [tokenAddress, config.WETH];
    const amountsOut = await routerContract.getAmountsOut(amount, path);
    const amountOut = amountsOut[1];

    const targetAmount = amountOut * (BigInt(10000) - BigInt(slippage)) / BigInt(10000);

    const fee = BigInt(amount.toString()) * BigInt(config.FEE) / BigInt(10000);
    const realAmount = BigInt(amount.toString()) - fee;

    const result = await routerContract.swapExactTokensForETH(
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
    logger.info("Swap Exact Token For ETH error");
    logger.error(err);
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
    logger.info("Send MAX Amount");
    logger.error(e);
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
    logger.info("Send designated Amount");
    logger.error(e);
    return null;
  }
};

export const approveMax = async (privateKey: string, tokenAddress: string,) => {
  try {
    const provider = new ethers.JsonRpcProvider(config.RPC);

    const wallet = new ethers.Wallet(privateKey, provider);

    // approve for max amount
    const tokenContract = new ethers.Contract(tokenAddress, erc20, wallet);
    const tx = await tokenContract.approve(config.ROUTER, ethers.MaxUint256);
    await tx.wait()
  } catch (error) {
    logger.info("Approve error");
    logger.error(error);
  }
}