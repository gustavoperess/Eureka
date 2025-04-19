import hre from "hardhat";

async function main() {
  const Registry = await ethers.getContractFactory('EurekaInvoiceRegistry');
  const reg = await Registry.deploy();
  await reg.waitForDeployment();
  console.log('▶ Deployed at', await reg.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
