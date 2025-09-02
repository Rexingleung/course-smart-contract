const { ethers } = require('ethers');
require('dotenv').config();

// 合约字节码 - 需要从Solidity编译后获得
const COURSE_CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b50..."; // 这里需要替换为实际的字节码

// 合约ABI
const COURSE_CONTRACT_ABI = [
    "constructor()",
    "function createCourse(string memory _title, string memory _description, uint256 _price) public returns (uint256)",
    "function purchaseCourse(uint256 _courseId) public payable",
    "function getCourse(uint256 _courseId) public view returns (string memory title, string memory description, address author, uint256 price, uint256 createdAt)",
    "function getCourseBuyers(uint256 _courseId) public view returns (address[] memory)",
    "function getUserPurchasedCourses(address _user) public view returns (uint256[] memory)",
    "function hasUserPurchasedCourse(uint256 _courseId, address _user) public view returns (bool)",
    "function getCourseCount() public view returns (uint256)",
    "function courseCounter() public view returns (uint256)",
    "event CourseCreated(uint256 indexed courseId, string title, address indexed author, uint256 price)",
    "event CoursePurchased(uint256 indexed courseId, address indexed buyer, uint256 price)"
];

async function deployCourseContract() {
    try {
        console.log('开始部署Course合约...');
        
        // 连接到网络
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('部署账户:', wallet.address);
        
        // 检查账户余额
        const balance = await provider.getBalance(wallet.address);
        console.log('账户余额:', ethers.formatEther(balance), 'ETH');
        
        if (balance < ethers.parseEther('0.01')) {
            throw new Error('账户余额不足，需要至少0.01 ETH来部署合约');
        }
        
        // 创建合约工厂
        const contractFactory = new ethers.ContractFactory(COURSE_CONTRACT_ABI, COURSE_CONTRACT_BYTECODE, wallet);
        
        // 部署合约
        console.log('正在部署合约...');
        const contract = await contractFactory.deploy();
        
        console.log('合约部署交易已发送，交易哈希:', contract.deploymentTransaction().hash);
        console.log('等待合约部署确认...');
        
        // 等待部署确认
        await contract.waitForDeployment();
        
        const contractAddress = await contract.getAddress();
        console.log('✅ 合约部署成功!');
        console.log('合约地址:', contractAddress);
        console.log('部署者地址:', wallet.address);
        
        // 验证合约是否正确部署
        const courseCount = await contract.getCourseCount();
        console.log('初始课程数量:', courseCount.toString());
        
        // 保存部署信息到文件
        const deploymentInfo = {
            contractAddress: contractAddress,
            deployerAddress: wallet.address,
            deploymentHash: contract.deploymentTransaction().hash,
            networkUrl: process.env.RPC_URL || 'http://localhost:8545',
            deployedAt: new Date().toISOString()
        };
        
        require('fs').writeFileSync(
            'deployment.json',
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('部署信息已保存到 deployment.json');
        
        return contractAddress;
        
    } catch (error) {
        console.error('❌ 部署失败:', error);
        throw error;
    }
}

// 使用Hardhat编译和部署的函数
async function deployWithHardhat() {
    try {
        console.log('使用Hardhat编译并部署合约...');
        
        // 首先需要编译合约
        const { execSync } = require('child_process');
        
        console.log('编译合约...');
        execSync('npx hardhat compile', { stdio: 'inherit' });
        
        // 读取编译后的合约
        const artifactPath = './artifacts/contracts/Course.sol/Course.json';
        const artifact = JSON.parse(require('fs').readFileSync(artifactPath, 'utf8'));
        
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('部署账户:', wallet.address);
        
        // 创建合约工厂
        const contractFactory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
        
        // 部署合约
        console.log('正在部署合约...');
        const contract = await contractFactory.deploy();
        
        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();
        
        console.log('✅ 合约部署成功!');
        console.log('合约地址:', contractAddress);
        
        // 保存部署信息
        const deploymentInfo = {
            contractAddress: contractAddress,
            deployerAddress: wallet.address,
            abi: artifact.abi,
            deployedAt: new Date().toISOString()
        };
        
        require('fs').writeFileSync(
            'deployment.json',
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        return contractAddress;
        
    } catch (error) {
        console.error('❌ Hardhat部署失败:', error);
        throw error;
    }
}

// 主函数
async function main() {
    try {
        let contractAddress;
        
        // 检查是否使用Hardhat
        if (process.argv.includes('--hardhat')) {
            contractAddress = await deployWithHardhat();
        } else {
            contractAddress = await deployCourseContract();
        }
        
        console.log('\n📋 部署完成总结:');
        console.log('合约地址:', contractAddress);
        console.log('网络:', process.env.RPC_URL || 'http://localhost:8545');
        console.log('\n现在可以在courseService.js中使用这个合约地址了!');
        
    } catch (error) {
        console.error('部署过程中出现错误:', error);
        process.exit(1);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main();
}

module.exports = {
    deployCourseContract,
    deployWithHardhat
};