import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import ProductDescription from "../../components/productDescription";
import { Box, Center, Heading, Text } from "@chakra-ui/react";
import { useWeb3React, UnsupportedChainIdError } from "@web3-react/core";
import { useDisclosure } from "@chakra-ui/react";
import ModalMetamask from "../../components/modalMetamask";
import ModalTransaction from "../../components/modalTransaction";
import ModalUsability from "../../components/modalUsability";
import { Button } from "@chakra-ui/react";
import useNFTGetterHandler from "../../hooks/useNFTGetterHandler";

const ProductDetails = () => {
  const nftGetterHandler = useNFTGetterHandler();
  const { tokenId } = useParams();
  const [dataOfCurrentProduct, setDataOfCurrentProduct] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { activate, account, library, active, deactivate, error } =
    useWeb3React();

  const {
    isOpen: isTransactionOpen,
    onOpen: onTransactionOpen,
    onClose: onTransactionClose,
  } = useDisclosure();

  const {
    isOpen: isUsabilityOpen,
    onOpen: onUsabilityOpen,
    onClose: onUsabilityClose,
  } = useDisclosure();

  // const metamaskConnect = false;
  const metamaskValidation = () => {
    !active ? onOpen() : onTransactionOpen();
    !active ? onOpen() : onUsabilityOpen();
    // console.log(active);
  };

  const canBuy = dataOfCurrentProduct.inSale;
  console.log(canBuy, "can buy");

  const getValidButton = (dataOfProduct) => {
    const { owner, isUsed, inSale } = dataOfProduct;
    if (isUsed) {
      return "Usado";
    } else if (owner === account) {
      return "Canjear";
    } else if (inSale) {
      // setCanBuy(true);
      return "Comprar";
    } else {
      return "No disponible para venta";
    }
  };

  const getFixedDataFromIpfsAndContract = (ipfs, contractData) => {
    let result = {
      description: ipfs.description,
      name: ipfs.description,
      newPrice: ipfs.attributes[2].value,
      oldPrice: ipfs.attributes[1].value,
      image: ipfs.image,
      inSale: contractData.inSale,
      isUsed: contractData.isUsed,
      owner: contractData.owner,
    };

    return result;
  };

  const getDataOfToken = async (tokenId) => {
    const dataOfCurrentToken = await nftGetterHandler.methods
      .getDataOfToken(tokenId)
      .call()
      .then((result) => result);
    const tokenURI = await dataOfCurrentToken.tokenURI;
    const dataFromAxios = await axios.get(tokenURI);
    const fixedData = getFixedDataFromIpfsAndContract(
      dataFromAxios.data,
      dataOfCurrentToken
    );
    setDataOfCurrentProduct(fixedData);
  };

  useEffect(() => {
    getDataOfToken(tokenId);
  }, []);

  const { name, description, image, newPrice, oldPrice } = dataOfCurrentProduct;

  return (
    <>
      <Center py={12}>
        <Box
          role={"group"}
          maxW={"330px"}
          width={[
            "100%", // 0-30em
            "90%", // 30em-48em
            "80%", // 62em+
          ]}
        >
          <ProductDescription
            name={name}
            image={image}
            newPrice={newPrice}
            oldPrice={oldPrice}
          />
          <Heading fontSize="sm" color={"gray.500"}>
            Product Description
          </Heading>
          <Text color={"gray.500"} mb={6}>
            {" "}
            {description}
          </Text>
          <Heading fontSize="sm" color={"gray.500"}>
            Terminos y condiciones
          </Heading>
          <Text color={"gray.500"}> {description}</Text>
          <Button
            colorScheme={"green"}
            mt={10}
            w="100%"
            onClick={() => metamaskValidation(!isOpen)}
            disabled={dataOfCurrentProduct.isUsed}
          >
            {getValidButton(dataOfCurrentProduct)}
          </Button>
        </Box>
        <ModalMetamask
          {...{ isOpen, onClose, onTransactionOpen }}
        ></ModalMetamask>
        {active && canBuy &&  (
          <>
            <ModalTransaction
              {...{
                isTransactionOpen,
                onTransactionClose,
                name,
                newPrice,
                description,
              }}
            ></ModalTransaction>
          </>
          // ) : (
          //   <>
          //   <ModalUsability/>
          //   </>
          // )}
        )}
        {active && (dataOfCurrentProduct.owner === account) && !canBuy &&  (
          <ModalUsability isOpen={isUsabilityOpen} onClose={onUsabilityClose} />
        )}
      </Center>
    </>
  );
};

export default ProductDetails;
