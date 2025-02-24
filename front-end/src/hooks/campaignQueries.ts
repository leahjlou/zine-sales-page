import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { getApi, getStacksUrl } from "@/lib/stacks-api";
import { FUNDRAISING_CONTRACT } from "@/constants/contracts";
import { cvToJSON, hexToCV, cvToHex, principalCV } from "@stacks/transactions";
import { PriceData, satsToSbtc, ustxToStx } from "@/lib/currency-utils";

export interface CampaignInfo {
  start: number;
  totalStx: number;
  totalSbtc: number;
  usdValue: number;
  purchaseCount: number;
  isCancelled: boolean;
  ustxPrice: number;
  satsPrice: number;
}

export const useCampaignInfo = (
  currentPrices: PriceData | undefined
): UseQueryResult<CampaignInfo> => {
  const api = getApi(getStacksUrl()).smartContractsApi;

  return useQuery<CampaignInfo>({
    queryKey: ["campaignInfo"],
    queryFn: async () => {
      const response = await api.callReadOnlyFunction({
        contractAddress: FUNDRAISING_CONTRACT.address || "",
        contractName: FUNDRAISING_CONTRACT.name,
        functionName: "get-campaign-info",
        readOnlyFunctionArgs: {
          sender: FUNDRAISING_CONTRACT.address || "",
          arguments: [],
        },
      });
      if (response?.okay && response?.result) {
        const result = cvToJSON(hexToCV(response?.result || ""));
        if (result?.success) {
          const totalSbtc = parseInt(
            result?.value?.value?.totalSbtc?.value,
            10
          );
          const totalStx = parseInt(result?.value?.value?.totalStx?.value, 10);

          return {
            start: parseInt(result?.value?.value?.start?.value, 10),
            totalSbtc,
            totalStx,
            usdValue:
              Number(ustxToStx(totalStx)) * (currentPrices?.stx || 0) +
              satsToSbtc(totalSbtc) * (currentPrices?.sbtc || 0),
            purchaseCount: parseInt(
              result?.value?.value?.purchaseCount?.value,
              10
            ),
            isCancelled: result?.value?.value?.isCancelled?.value,
            ustxPrice: parseInt(result?.value?.value?.ustxPrice?.value, 10),
            satsPrice: parseInt(result?.value?.value?.satsPrice?.value, 10),
          };
        } else {
          throw new Error("Error fetching campaign info from blockchain");
        }
      } else {
        throw new Error(
          response?.cause || "Error fetching campaign info from blockchain"
        );
      }
    },
    refetchInterval: 10000,
    retry: false,
    enabled: !!(currentPrices?.stx && currentPrices?.sbtc),
  });
};

interface CampaignDonation {
  stxAmount: number;
  sbtcAmount: number;
}

export const useExistingPurchase = (
  address?: string | null | undefined
): UseQueryResult<CampaignDonation> => {
  const api = getApi(getStacksUrl()).smartContractsApi;
  return useQuery<CampaignDonation>({
    queryKey: ["existingPurchases", address],
    queryFn: async () => {
      if (!address) throw new Error("Address is required");

      const response = await api.callReadOnlyFunction({
        contractAddress: FUNDRAISING_CONTRACT.address || "",
        contractName: FUNDRAISING_CONTRACT.name,
        functionName: "get-purchase-status",
        readOnlyFunctionArgs: {
          sender: FUNDRAISING_CONTRACT.address || "",
          arguments: [cvToHex(principalCV(address))],
        },
      });

      if (response?.okay) {
        const result = cvToJSON(hexToCV(response?.result || ""));

        if (result?.success) {
          return result?.value?.value;
        } else {
          throw new Error("Error fetching donation info from blockchain");
        }
      } else {
        throw new Error(
          response?.cause
            ? `${response?.cause}`
            : "Error fetching donation info from blockchain"
        );
      }
    },
    enabled: !!address,
    refetchInterval: 10000,
    retry: false,
  });
};
