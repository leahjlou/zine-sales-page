import useTransactionExecuter from "@/hooks/useTransactionExecuter";
import {
  getCancelTx,
  getInitializeTx,
  getWithdrawTx,
} from "@/lib/campaign-utils";
import {
  isDevnetEnvironment,
  isTestnetEnvironment,
} from "@/lib/contract-utils";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tooltip,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import HiroWalletContext from "./HiroWalletProvider";
import { useDevnetWallet } from "@/lib/devnet-wallet-context";
import { getStacksNetworkString } from "@/lib/stacks-api";
import { CampaignInfo } from "@/hooks/campaignQueries";
import { satsToSbtc, ustxToStx } from "@/lib/currency-utils";

export default function CampaignAdminControls({
  campaignIsUninitialized,
  campaignIsCancelled,
  campaignInfo,
}: {
  campaignIsUninitialized: boolean;
  campaignIsCancelled: boolean;
  campaignInfo: CampaignInfo;
}) {
  const { mainnetAddress, testnetAddress } = useContext(HiroWalletContext);
  const { currentWallet: devnetWallet } = useDevnetWallet();
  const currentWalletAddress = isDevnetEnvironment()
    ? devnetWallet?.stxAddress
    : isTestnetEnvironment()
    ? testnetAddress
    : mainnetAddress;

  const [isInitializingCampaign, setIsInitializingCampaign] = useState(false);
  const [isCancelConfirmationModalOpen, setIsCancelConfirmationModalOpen] =
    useState(false);

  const executeTx = useTransactionExecuter();

  const handleInitializeCampaign = async () => {
    const txOptions = getInitializeTx(
      getStacksNetworkString(),
      currentWalletAddress || ""
    );
    await executeTx(
      txOptions,
      devnetWallet,
      "Campaign was initialized",
      "Campaign was not initialized"
    );
    setIsInitializingCampaign(true);
  };

  const handleCancel = async () => {
    setIsCancelConfirmationModalOpen(false);
    const txOptions = getCancelTx(
      getStacksNetworkString(),
      currentWalletAddress || ""
    );
    await executeTx(
      txOptions,
      devnetWallet,
      "Campaign cancellation was requested",
      "Campaign was not cancelled"
    );
  };

  const handleWithdraw = async () => {
    const txOptions = getWithdrawTx(
      getStacksNetworkString(),
      currentWalletAddress || ""
    );
    await executeTx(
      txOptions,
      devnetWallet,
      "Withdraw requested",
      "Withdraw not requested"
    );
  };

  return (
    <>
      <Alert mb="4" colorScheme="gray">
        <Box>
          <AlertTitle mb="2">Admin Controls</AlertTitle>
          <AlertDescription>
            <Flex direction="column" gap="2">
              {campaignIsUninitialized ? (
                isInitializingCampaign ? (
                  <Box>
                    Initializing campaign, please wait for it to be confirmed
                    on-chain...
                  </Box>
                ) : (
                  <>
                    <Box mb="1">
                      This campaign is not yet open for sales. Do you want to
                      open it now?
                    </Box>
                    <Box>
                      <Button
                        colorScheme="green"
                        onClick={handleInitializeCampaign}
                      >
                        Open for sales now
                      </Button>
                    </Box>
                  </>
                )
              ) : (
                <Flex direction="column">
                  {/* Cancelled campaign - cannot withdraw or cancel */}
                  {campaignIsCancelled ? (
                    <Box>
                      You have cancelled this campaign. Contributions are
                      eligible for a refund.
                    </Box>
                  ) : (
                    // Uncancelled campaign - controls to withdraw or cancel
                    <Flex direction="column" gap="2">
                      <Box>
                        <strong>Current balance:</strong>
                      </Box>
                      <Box>{ustxToStx(campaignInfo.totalStx)} STX</Box>
                      <Box>{satsToSbtc(campaignInfo.totalSbtc)} sBTC</Box>
                      <Box>Total ≈${campaignInfo.usdValue?.toFixed(2)}</Box>
                      <Button colorScheme="green" onClick={handleWithdraw}>
                        Withdraw funds
                      </Button>
                      <Tooltip label="If you cancel the sales campaign, purchases will no longer be available. You'll still be able to withdraw any balance from purchases so far.">
                        <Button
                          colorScheme="yellow"
                          onClick={() => {
                            setIsCancelConfirmationModalOpen(true);
                          }}
                        >
                          Cancel campaign
                        </Button>
                      </Tooltip>
                    </Flex>
                  )}
                </Flex>
              )}
            </Flex>
          </AlertDescription>
        </Box>
      </Alert>
      <Modal
        isOpen={isCancelConfirmationModalOpen}
        onClose={() => {
          setIsCancelConfirmationModalOpen(false);
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cancel Campaign?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            This campaign will be cancelled. All contributors will be eligible
            for a refund, and you will not be able to collect the funds. This
            campaign will not accept new donations.
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => {
                setIsCancelConfirmationModalOpen(false);
              }}
              mr="3"
            >
              Nevermind
            </Button>
            <Button colorScheme="blue" onClick={handleCancel}>
              Yes, End Campaign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
