import { ethers } from "ethers";
import erc20 from "../abi/ERC20.json";
import factory from "../abi/Factory.json";
import config from "../config";
import { factoryAbi } from "../abi";

export const getTokenBalance = async (tokenAddress: string, address: string) => {
    try {
        const contract = new ethers.Contract(tokenAddress, erc20, new ethers.JsonRpcProvider(config.RPC));
        return (await contract.balanceOf(address)).toString();
    }
    catch (err) {
        return null;
    }
};

export const getTokenName = async (tokenAddress: string) => {
    try {
        const contract = new ethers.Contract(tokenAddress, erc20, new ethers.JsonRpcProvider(config.RPC));
        return (await contract.name()).toString();
    }
    catch (err) {
        return null;
    }
};

export const getTokenSymbol = async (tokenAddress: string) => {
    try {
        const contract = new ethers.Contract(tokenAddress, erc20, new ethers.JsonRpcProvider(config.RPC));
        return (await contract.symbol()).toString();
    }
    catch (err) {
        return null;
    }
};

export const getNativeBalance = async (address: string) => {
    try {
        const provider = new ethers.JsonRpcProvider(config.RPC);
        return (await provider.getBalance(address)).toString();
    }
    catch (err) {
        return null;
    }
};

export const getPair = async (token1: string, token2: string) => {
    try {
        const provider = new ethers.JsonRpcProvider(config.RPC);
        const factory = new ethers.Contract(config.FACTORY, factoryAbi, provider);
        return (await factory.getPair(token1, token2));
    }
    catch (err) {
        return null;
    }

};