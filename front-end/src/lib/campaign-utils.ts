import { FUNDRAISING_CONTRACT, SBTC_CONTRACT } from "@/constants/contracts";
import { ContractCallRegularOptions } from "@stacks/connect";
import { Network } from "./contract-utils";
import {
  AnchorMode,
  FungiblePostCondition,
  Pc,
  PostConditionMode,
} from "@stacks/transactions";

interface ContributeParams {
  address: string;
  price: number;
}

export const getPurchaseWithStxTx = (
  network: Network,
  params: ContributeParams // Send price in microstacks
): ContractCallRegularOptions => {
  const { address, price } = params;

  return {
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    contractAddress: FUNDRAISING_CONTRACT.address || "",
    contractName: FUNDRAISING_CONTRACT.name,
    network,
    functionName: "purchase-with-stx",
    functionArgs: [],
    postConditions: [Pc.principal(address).willSendEq(price).ustx()],
  };
};

export const getPurchaseWithSbtcTx = (
  network: Network,
  params: ContributeParams // Send price in sats
): ContractCallRegularOptions => {
  const { address, price } = params;

  const postCondition: FungiblePostCondition = {
    type: "ft-postcondition",
    address,
    condition: "eq",
    asset: `${SBTC_CONTRACT.address}.${SBTC_CONTRACT.name}::sBTC`,
    amount: price,
  };

  return {
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    contractAddress: FUNDRAISING_CONTRACT.address || "",
    contractName: FUNDRAISING_CONTRACT.name,
    network,
    functionName: "purchase-with-sbtc",
    functionArgs: [],
    postConditions: [postCondition],
  };
};

export const getInitializeTx = (
  network: Network,
  address: string
): ContractCallRegularOptions => {
  return {
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    contractAddress: FUNDRAISING_CONTRACT.address || "",
    contractName: FUNDRAISING_CONTRACT.name,
    network,
    functionName: "initialize-campaign",
    functionArgs: [],
    postConditions: [Pc.principal(address).willSendEq(0).ustx()],
  };
};

export const getCancelTx = (
  network: Network,
  address: string
): ContractCallRegularOptions => {
  return {
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    contractAddress: FUNDRAISING_CONTRACT.address || "",
    contractName: FUNDRAISING_CONTRACT.name,
    network,
    functionName: "cancel-campaign",
    functionArgs: [],
    postConditions: [Pc.principal(address).willSendEq(0).ustx()],
  };
};

export const getRefundTx = (
  network: Network,
  address: string
): ContractCallRegularOptions => {
  return {
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    contractAddress: FUNDRAISING_CONTRACT.address || "",
    contractName: FUNDRAISING_CONTRACT.name,
    network,
    functionName: "refund",
    functionArgs: [],
    postConditions: [Pc.principal(address).willSendEq(0).ustx()],
  };
};

export const getWithdrawTx = (
  network: Network,
  address: string
): ContractCallRegularOptions => {
  return {
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    contractAddress: FUNDRAISING_CONTRACT.address || "",
    contractName: FUNDRAISING_CONTRACT.name,
    network,
    functionName: "withdraw",
    functionArgs: [],
    postConditions: [Pc.principal(address).willSendEq(0).ustx()],
  };
};
