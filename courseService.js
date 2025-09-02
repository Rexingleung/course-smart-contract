const { ethers } = require('ethers');

// 合约ABI - 从你的Solidity合约编译后获得
const COURSE_CONTRACT_ABI = [
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

class CourseContractService {
    constructor(providerUrl, privateKey, contractAddress) {
        // 连接到以太坊网络
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        
        // 创建钱包实例
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        
        // 创建合约实例
        this.contract = new ethers.Contract(contractAddress, COURSE_CONTRACT_ABI, this.wallet);
        
        // 只读合约实例（用于查询，不消耗gas）
        this.contractReadOnly = new ethers.Contract(contractAddress, COURSE_CONTRACT_ABI, this.provider);
    }

    // 创建课程
    async createCourse(title, description, priceInEth) {
        try {
            console.log('创建课程:', { title, description, priceInEth });
            
            // 将ETH转换为Wei
            const priceInWei = ethers.parseEther(priceInEth.toString());
            
            // 调用合约方法
            const tx = await this.contract.createCourse(title, description, priceInWei);
            console.log('交易已发送，等待确认...', tx.hash);
            
            // 等待交易确认
            const receipt = await tx.wait();
            console.log('交易已确认:', receipt.hash);
            
            // 从事件中获取课程ID
            const courseCreatedEvent = receipt.logs.find(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed.name === 'CourseCreated';
                } catch (e) {
                    return false;
                }
            });
            
            if (courseCreatedEvent) {
                const parsed = this.contract.interface.parseLog(courseCreatedEvent);
                const courseId = parsed.args[0];
                console.log('课程创建成功，ID:', courseId.toString());
                return {
                    success: true,
                    courseId: courseId.toString(),
                    txHash: receipt.hash,
                    gasUsed: receipt.gasUsed.toString()
                };
            }
            
            return {
                success: true,
                txHash: receipt.hash,
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            console.error('创建课程失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 购买课程
    async purchaseCourse(courseId, paymentInEth) {
        try {
            console.log('购买课程:', { courseId, paymentInEth });
            
            // 将ETH转换为Wei
            const paymentInWei = ethers.parseEther(paymentInEth.toString());
            
            // 调用合约方法（发送ETH）
            const tx = await this.contract.purchaseCourse(courseId, {
                value: paymentInWei
            });
            console.log('交易已发送，等待确认...', tx.hash);
            
            // 等待交易确认
            const receipt = await tx.wait();
            console.log('交易已确认:', receipt.hash);
            
            return {
                success: true,
                txHash: receipt.hash,
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            console.error('购买课程失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取课程信息
    async getCourse(courseId) {
        try {
            console.log('获取课程信息:', courseId);
            
            const result = await this.contractReadOnly.getCourse(courseId);
            
            return {
                success: true,
                course: {
                    title: result[0],
                    description: result[1],
                    author: result[2],
                    price: ethers.formatEther(result[3]), // 转换为ETH
                    priceWei: result[3].toString(),
                    createdAt: new Date(Number(result[4]) * 1000).toISOString()
                }
            };
            
        } catch (error) {
            console.error('获取课程信息失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取课程购买者列表
    async getCourseBuyers(courseId) {
        try {
            console.log('获取课程购买者:', courseId);
            
            const buyers = await this.contractReadOnly.getCourseBuyers(courseId);
            
            return {
                success: true,
                buyers: buyers
            };
            
        } catch (error) {
            console.error('获取课程购买者失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取用户购买的课程列表
    async getUserPurchasedCourses(userAddress) {
        try {
            console.log('获取用户购买的课程:', userAddress);
            
            const courseIds = await this.contractReadOnly.getUserPurchasedCourses(userAddress);
            
            return {
                success: true,
                courseIds: courseIds.map(id => id.toString())
            };
            
        } catch (error) {
            console.error('获取用户购买的课程失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 检查用户是否购买了特定课程
    async hasUserPurchasedCourse(courseId, userAddress) {
        try {
            console.log('检查用户是否购买了课程:', { courseId, userAddress });
            
            const hasPurchased = await this.contractReadOnly.hasUserPurchasedCourse(courseId, userAddress);
            
            return {
                success: true,
                hasPurchased: hasPurchased
            };
            
        } catch (error) {
            console.error('检查用户购买状态失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取课程总数
    async getCourseCount() {
        try {
            console.log('获取课程总数');
            
            const count = await this.contractReadOnly.getCourseCount();
            
            return {
                success: true,
                count: count.toString()
            };
            
        } catch (error) {
            console.error('获取课程总数失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 监听课程创建事件
    listenToCourseCreatedEvents(callback) {
        console.log('开始监听课程创建事件...');
        
        this.contract.on('CourseCreated', (courseId, title, author, price, event) => {
            const eventData = {
                courseId: courseId.toString(),
                title: title,
                author: author,
                price: ethers.formatEther(price),
                priceWei: price.toString(),
                txHash: event.log.transactionHash,
                blockNumber: event.log.blockNumber
            };
            console.log('课程创建事件:', eventData);
            callback(eventData);
        });
    }

    // 监听课程购买事件
    listenToCoursePurchasedEvents(callback) {
        console.log('开始监听课程购买事件...');
        
        this.contract.on('CoursePurchased', (courseId, buyer, price, event) => {
            const eventData = {
                courseId: courseId.toString(),
                buyer: buyer,
                price: ethers.formatEther(price),
                priceWei: price.toString(),
                txHash: event.log.transactionHash,
                blockNumber: event.log.blockNumber
            };
            console.log('课程购买事件:', eventData);
            callback(eventData);
        });
    }

    // 停止监听事件
    stopListening() {
        this.contract.removeAllListeners();
        console.log('已停止监听所有事件');
    }

    // 获取账户余额
    async getBalance(address = null) {
        try {
            const targetAddress = address || this.wallet.address;
            const balance = await this.provider.getBalance(targetAddress);
            
            return {
                success: true,
                balance: ethers.formatEther(balance),
                balanceWei: balance.toString(),
                address: targetAddress
            };
            
        } catch (error) {
            console.error('获取余额失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 使用示例
async function example() {
    // 配置参数
    const config = {
        providerUrl: 'http://localhost:8545', // 本地Ganache或其他RPC端点
        // providerUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID', // Sepolia测试网
        privateKey: '0x您的私钥', // 替换为您的私钥
        contractAddress: '0x您部署的合约地址' // 替换为您部署的合约地址
    };

    // 创建服务实例
    const courseService = new CourseContractService(
        config.providerUrl,
        config.privateKey,
        config.contractAddress
    );

    try {
        // 获取当前账户余额
        const balance = await courseService.getBalance();
        console.log('当前账户余额:', balance);

        // 获取课程总数
        const courseCount = await courseService.getCourseCount();
        console.log('课程总数:', courseCount);

        // 创建新课程
        const newCourse = await courseService.createCourse(
            "区块链开发入门",
            "学习如何开发智能合约和DApp",
            0.1 // 0.1 ETH
        );
        console.log('创建课程结果:', newCourse);

        if (newCourse.success) {
            // 获取刚创建的课程信息
            const courseInfo = await courseService.getCourse(newCourse.courseId);
            console.log('课程信息:', courseInfo);

            // 购买课程（需要使用不同的账户）
            // const purchase = await courseService.purchaseCourse(newCourse.courseId, 0.1);
            // console.log('购买课程结果:', purchase);
        }

        // 监听事件
        courseService.listenToCourseCreatedEvents((eventData) => {
            console.log('收到课程创建事件:', eventData);
        });

        courseService.listenToCoursePurchasedEvents((eventData) => {
            console.log('收到课程购买事件:', eventData);
        });

    } catch (error) {
        console.error('示例执行失败:', error);
    }
}

// 导出服务类和示例函数
module.exports = {
    CourseContractService,
    example
};

// 如果直接运行此文件，执行示例
if (require.main === module) {
    example().catch(console.error);
}