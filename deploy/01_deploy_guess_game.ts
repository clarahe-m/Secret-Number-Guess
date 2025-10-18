import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const deployed = await deploy("GuessGame", {
    from: deployer,
    log: true,
  });

  log(`GuessGame contract: ${deployed.address}`);
};
export default func;
func.id = "deploy_guess_game";
func.tags = ["GuessGame"];

