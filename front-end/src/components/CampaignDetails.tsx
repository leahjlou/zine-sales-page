"use client";
import {
  Container,
  Box,
  IconButton,
  Image,
  Text,
  Flex,
  useBreakpointValue,
  Heading,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Alert,
  AlertTitle,
  AlertDescription,
  Spinner,
  Link,
} from "@chakra-ui/react";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { useContext, useEffect, useState } from "react";
import { CAMPAIGN_SUBTITLE, CAMPAIGN_TITLE } from "@/constants/campaign";
import StyledMarkdown from "./StyledMarkdown";
import { useCampaignInfo, useExistingPurchase } from "@/hooks/campaignQueries";
import DonationModal from "./DonationModal";
import HiroWalletContext from "./HiroWalletProvider";
import { useDevnetWallet } from "@/lib/devnet-wallet-context";
import {
  isDevnetEnvironment,
  isTestnetEnvironment,
} from "@/lib/contract-utils";
import { satsToSbtc, useCurrentPrices, ustxToStx } from "@/lib/currency-utils";
import { FUNDRAISING_CONTRACT } from "@/constants/contracts";
import CampaignAdminControls from "./CampaignAdminControls";

export default function CampaignDetails({
  images,
  markdownContent,
}: {
  images: string[];
  markdownContent: string;
}) {
  const { mainnetAddress, testnetAddress } = useContext(HiroWalletContext);
  const { currentWallet: devnetWallet } = useDevnetWallet();
  const currentWalletAddress = isDevnetEnvironment()
    ? devnetWallet?.stxAddress
    : isTestnetEnvironment()
    ? testnetAddress
    : mainnetAddress;

  const [downloadLink, setDownloadLink] = useState("");

  useEffect(() => {
    fetch("/api/download")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setDownloadLink(data.downloadUrl);
      });
  }, []);

  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const slideSize = useBreakpointValue({ base: "100%", md: "500px" });

  const { data: currentPrices } = useCurrentPrices();
  const { data: campaignInfo, error: campaignFetchError } =
    useCampaignInfo(currentPrices);

  const campaignIsUninitialized = campaignInfo?.start === 0;
  const campaignIsCancelled =
    !campaignIsUninitialized && campaignInfo?.isCancelled;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  const { data: existingPurchase } = useExistingPurchase(currentWalletAddress);

  return (
    <Container maxW="container.xl" py="8">
      <Flex direction="column" gap="6">
        <Flex direction="column" gap="1">
          <Heading>{CAMPAIGN_TITLE}</Heading>
          <Text>{CAMPAIGN_SUBTITLE}</Text>
        </Flex>

        {campaignInfo &&
        currentWalletAddress === FUNDRAISING_CONTRACT.address ? (
          <CampaignAdminControls
            campaignInfo={campaignInfo}
            campaignIsUninitialized={campaignIsUninitialized}
            campaignIsCancelled={!!campaignIsCancelled}
          />
        ) : null}

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} alignItems="start">
          {/* Left column: Image carousel */}
          <Box position="relative" width="full" overflow="hidden">
            <Flex width={slideSize} mx="auto" position="relative">
              <Image
                src={images[currentIndex]}
                alt={`Campaign image ${currentIndex + 1}`}
                objectFit="cover"
                width="full"
                height="auto"
              />
              <IconButton
                aria-label="Previous image"
                icon={<ChevronLeftIcon boxSize="5" />}
                onClick={prevSlide}
                position="absolute"
                left="2"
                top="50%"
                transform="translateY(-50%)"
                colorScheme="gray"
                rounded="full"
              />
              <IconButton
                aria-label="Next image"
                icon={<ChevronRightIcon boxSize="5" />}
                onClick={nextSlide}
                position="absolute"
                right="2"
                top="50%"
                transform="translateY(-50%)"
                colorScheme="gray"
                rounded="full"
              />
              <Text
                position="absolute"
                bottom="2"
                right="2"
                bg="blackAlpha.700"
                color="white"
                px="2"
                py="1"
                rounded="md"
                fontSize="sm"
              >
                {currentIndex + 1} / {images.length}
              </Text>
            </Flex>
          </Box>

          {/* Right column: Campaign stats & donation */}
          <Box>
            <Box p={6} borderRadius="lg" borderWidth="1px">
              {campaignIsUninitialized ? (
                <Flex direction="column" gap="4">
                  This campaign hasn&apos;t started yet!
                </Flex>
              ) : null}

              {campaignInfo && !campaignIsUninitialized ? (
                <Flex direction="column" gap={6}>
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Price</StatLabel>
                      <StatNumber>
                        {ustxToStx(campaignInfo?.ustxPrice)} STX
                      </StatNumber>
                      <StatLabel>or</StatLabel>
                      <StatNumber>
                        {satsToSbtc(campaignInfo?.satsPrice)} BTC
                      </StatNumber>
                      <StatLabel>
                        ({campaignInfo?.satsPrice?.toLocaleString()} Satoshis)
                      </StatLabel>
                    </Stat>
                    <Stat>
                      <StatLabel>Copies sold</StatLabel>
                      <StatNumber>
                        {campaignInfo?.purchaseCount?.toLocaleString()}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>

                  {campaignIsCancelled ? (
                    <Flex direction="column" gap="2">
                      <Box>This sales campaign was cancelled.</Box>
                    </Flex>
                  ) : (
                    <>
                      {existingPurchase ? (
                        <Flex direction="column" gap="2">
                          <Flex gap="2" align="center">
                            <CheckCircleIcon color="green.500" />
                            Thanks for your purchase!
                          </Flex>
                          <Button
                            size="lg"
                            colorScheme="green"
                            as={Link}
                            href={downloadLink}
                          >
                            Access digital download now
                          </Button>
                        </Flex>
                      ) : (
                        <Flex direction="column" gap="4">
                          <Button
                            size="lg"
                            colorScheme="green"
                            width="full"
                            onClick={() => {
                              setIsDonationModalOpen(true);
                            }}
                          >
                            Buy Now
                          </Button>
                          <Box fontSize="xs">
                            <Box mb="2">
                              <strong>Digital download</strong>: After you
                              purchase, you will be able to view a download link
                              for a digital PDF.
                            </Box>
                            <Box>
                              Already purchased? Please connect your wallet to
                              verify your purchase and access the download link.
                            </Box>
                          </Box>
                        </Flex>
                      )}
                    </>
                  )}
                </Flex>
              ) : campaignFetchError ? (
                <Box>
                  <Alert status="warning">
                    <Box>
                      <AlertTitle>Campaign Data Unavailable</AlertTitle>
                      <AlertDescription>
                        Unable to retrieve campaign data from the blockchain.
                        This could be due to network issues or the campaign may
                        no longer exist.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </Box>
              ) : !campaignIsUninitialized ? (
                <Box w="full" textAlign="center">
                  <Spinner size="lg" />
                </Box>
              ) : null}
            </Box>
          </Box>
        </SimpleGrid>

        {/* Markdown content */}
        <StyledMarkdown>{markdownContent}</StyledMarkdown>
      </Flex>
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => {
          setIsDonationModalOpen(false);
        }}
      />
    </Container>
  );
}
