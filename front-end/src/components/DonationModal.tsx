import { useCampaignInfo } from "@/hooks/campaignQueries";
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
  VStack,
  RadioGroup,
  Radio,
  ModalFooter,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useContext } from "react";
import HiroWalletContext from "./HiroWalletProvider";
import {
  executeContractCall,
  isDevnetEnvironment,
  isTestnetEnvironment,
} from "@/lib/contract-utils";
import { useDevnetWallet } from "@/lib/devnet-wallet-context";
import { ConnectWalletButton } from "./ConnectWallet";
import { DevnetWalletButton } from "./DevnetWalletButton";
import { getStacksNetworkString } from "@/lib/stacks-api";
import { satsToSbtc, useCurrentPrices, ustxToStx } from "@/lib/currency-utils";
import { openContractCall } from "@stacks/connect";
import {
  getPurchaseWithSbtcTx,
  getPurchaseWithStxTx,
} from "@/lib/campaign-utils";

export default function DonationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => undefined;
}) {
  const { mainnetAddress, testnetAddress } = useContext(HiroWalletContext);
  const {
    currentWallet: devnetWallet,
    wallets: devnetWallets,
    setCurrentWallet: setDevnetWallet,
  } = useDevnetWallet();
  const currentWalletAddress = isDevnetEnvironment()
    ? devnetWallet?.stxAddress
    : isTestnetEnvironment()
    ? testnetAddress
    : mainnetAddress;

  const { data: prices } = useCurrentPrices();
  const { data: campaignInfo } = useCampaignInfo(prices);

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stx");
  const toast = useToast();

  const handleSubmit = async () => {
    setIsLoading(true);

    // Handle donation
    try {
      if (!campaignInfo) {
        throw new Error("Sale prices not found");
      }

      const txOptions =
        paymentMethod === "sbtc"
          ? getPurchaseWithSbtcTx(getStacksNetworkString(), {
              address: currentWalletAddress || "",
              price: campaignInfo.satsPrice,
            })
          : getPurchaseWithStxTx(getStacksNetworkString(), {
              address: currentWalletAddress || "",
              price: campaignInfo.ustxPrice,
            });

      const doSuccessToast = (txid: string) => {
        toast({
          title: "Thank you!",
          description: (
            <Flex direction="column" gap="4">
              <Box>Processing purchase.</Box>
              <Box fontSize="xs">
                Transaction ID: <strong>{txid}</strong>
              </Box>
            </Flex>
          ),
          status: "success",
          isClosable: true,
          duration: 30000,
        });
      };

      // Devnet uses direct call, Testnet/Mainnet needs to prompt with browser extension
      if (isDevnetEnvironment()) {
        const { txid } = await executeContractCall(txOptions, devnetWallet);
        doSuccessToast(txid);
      } else {
        await openContractCall({
          ...txOptions,
          onFinish: (data) => {
            doSuccessToast(data.txId);
          },
          onCancel: () => {
            toast({
              title: "Cancelled",
              description: "Transaction was cancelled",
              status: "info",
              duration: 3000,
            });
          },
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to purchase",
        status: "error",
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Buy Now</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb="8">
          <Flex direction="column" gap="3">
            {!currentWalletAddress ? (
              <Flex
                p={6}
                borderWidth="1px"
                borderRadius="lg"
                align="center"
                justify="center"
                direction="column"
                gap="4"
              >
                <Box>Please connect a STX wallet to purchase.</Box>
                {isDevnetEnvironment() ? (
                  <DevnetWalletButton
                    currentWallet={devnetWallet}
                    wallets={devnetWallets}
                    onWalletSelect={setDevnetWallet}
                  />
                ) : (
                  <ConnectWalletButton />
                )}
              </Flex>
            ) : (
              <>
                <Box mx="auto" p={6} borderWidth="1px" borderRadius="lg">
                  <VStack spacing={6} align="stretch">
                    <Text fontSize="lg" fontWeight="bold">
                      Choose Payment Method
                    </Text>

                    <RadioGroup
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                    >
                      <div>
                        <Radio value="stx" id="stx">
                          {ustxToStx(campaignInfo?.ustxPrice || 0)} STX
                        </Radio>
                      </div>
                      <div>
                        <Radio value="sbtc" id="sbtc">
                          {satsToSbtc(campaignInfo?.satsPrice || 0)} sBTC
                        </Radio>
                      </div>
                    </RadioGroup>

                    <Flex direction="column" gap="1">
                      <Button
                        colorScheme="green"
                        size="lg"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                      >
                        Buy
                      </Button>
                    </Flex>
                  </VStack>
                </Box>
              </>
            )}
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
