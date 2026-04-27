import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("IPFSStorageModule", (m) => {
  const ipfsStorage = m.contract("IPFSStorage", []);
  return { ipfsStorage };
});
