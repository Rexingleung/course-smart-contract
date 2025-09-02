# Course 智能合约 Node.js 服务

这个项目提供了一个完整的 Node.js 服务来与 Course 智能合约进行交互，包括合约部署、功能调用、API服务器和测试套件。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env` 示例文件并填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# RPC节点URL
RPC_URL=http://localhost:8545

# 私钥（不要在生产环境中使用）
PRIVATE_KEY=0x您的私钥

# 合约地址（部署后获得）
CONTRACT_ADDRESS=0x合约地址
```

### 3. 部署合约

如果你还没有部署合约：

```bash
# 方式1: 使用内置部署脚本
npm run deploy

# 方式2: 使用 Hardhat 部署
npm run deploy -- --hardhat
```

### 4. 运行测试

```bash
# 运行基础功能测试
npm test

# 运行性能测试
npm run test:performance
```

### 5. 启动API服务器

```bash
# 启动生产服务器
npm run server

# 或者启动开发服务器（自动重启）
npm run dev
```

## 📚 使用方式

### 直接使用 CourseContractService 类

```javascript
const { CourseContractService } = require('./courseService');

const courseService = new CourseContractService(
    'http://localhost:8545',  // RPC URL
    '0x你的私钥',             // 私钥
    '0x合约地址'              // 合约地址
);

// 创建课程
const result = await courseService.createCourse(
    "区块链开发",
    "学习智能合约开发",
    0.1  // 0.1 ETH
);

// 获取课程信息
const course = await courseService.getCourse(1);

// 购买课程
const purchase = await courseService.purchaseCourse(1, 0.1);
```

### 使用 REST API

启动API服务器后，可以通过HTTP请求与合约交互：

#### 获取课程总数
```bash
curl http://localhost:3000/api/courses/count
```

#### 创建课程
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"测试课程","description":"课程描述","price":0.1}'
```

#### 获取课程信息
```bash
curl http://localhost:3000/api/courses/1
```

#### 购买课程
```bash
curl -X POST http://localhost:3000/api/courses/1/purchase \
  -H "Content-Type: application/json" \
  -d '{"payment":0.1}'
```

### WebSocket 实时事件

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

// 订阅事件
socket.emit('subscribe-events');

// 监听课程创建事件
socket.on('course-created', (data) => {
    console.log('新课程创建:', data);
});

// 监听课程购买事件
socket.on('course-purchased', (data) => {
    console.log('课程购买:', data);
});
```

## 📖 API 文档

启动服务器后访问：`http://localhost:3000/api/docs`

### 主要 API 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/courses/count` | 获取课程总数 |
| POST | `/api/courses` | 创建新课程 |
| GET | `/api/courses/:id` | 获取课程详情 |
| POST | `/api/courses/:id/purchase` | 购买课程 |
| GET | `/api/courses/:id/buyers` | 获取课程购买者 |
| GET | `/api/users/:address/courses` | 获取用户购买的课程 |
| GET | `/api/courses` | 获取所有课程（分页） |

## 🧪 测试

项目包含全面的测试套件：

### 基础功能测试
```bash
npm test
```

测试包括：
- 获取账户余额
- 获取课程总数
- 创建课程
- 获取课程信息
- 获取购买者列表
- 检查购买状态
- 事件监听
- 错误处理

### 性能测试
```bash
npm run test:performance
```

性能测试包括：
- 并发读取操作
- 批量创建课程
- 响应时间统计

## 🏗️ 项目结构

```
├── courseService.js     # 核心合约服务类
├── server.js           # Express API服务器
├── deploy.js          # 合约部署脚本
├── test.js            # 测试套件
├── package.json       # 项目配置
├── .env.example       # 环境变量示例
├── deployment.json    # 部署信息（自动生成）
└── README.md         # 项目文档
```

## 🔧 核心功能

### CourseContractService 类方法

#### 写操作（需要 gas）
- `createCourse(title, description, priceInEth)` - 创建新课程
- `purchaseCourse(courseId, paymentInEth)` - 购买课程

#### 读操作（免费）
- `getCourse(courseId)` - 获取课程详细信息
- `getCourseCount()` - 获取课程总数
- `getCourseBuyers(courseId)` - 获取课程购买者列表
- `getUserPurchasedCourses(userAddress)` - 获取用户购买的课程
- `hasUserPurchasedCourse(courseId, userAddress)` - 检查购买状态
- `getBalance(address)` - 获取账户余额

#### 事件监听
- `listenToCourseCreatedEvents(callback)` - 监听课程创建事件
- `listenToCoursePurchasedEvents(callback)` - 监听课程购买事件
- `stopListening()` - 停止监听所有事件

## 🌐 网络配置

### 本地开发（Ganache/Hardhat）
```env
RPC_URL=http://localhost:8545
```

### Sepolia 测试网
```env
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

### 主网（谨慎使用）
```env
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
```

## 🔒 安全注意事项

1. **私钥安全**
   - 永远不要将私钥提交到版本控制系统
   - 在生产环境中使用环境变量或安全的密钥管理系统
   - 考虑使用硬件钱包或多重签名钱包

2. **网络配置**
   - 确认你连接到正确的网络
   - 在主网上操作前先在测试网验证

3. **Gas 费用**
   - 监控 gas 价格，避免不必要的高费用
   - 设置合理的 gas 限制

## 🐛 常见问题

### Q: 部署合约时出现 "insufficient funds" 错误
A: 确保你的账户有足够的 ETH 来支付 gas 费用。本地开发环境通常需要至少 0.01 ETH。

### Q: 交易一直处于 pending 状态
A: 检查 gas 价格设置，可能需要提高 gas 价格以加快交易确认。

### Q: 无法连接到网络
A: 检查 RPC_URL 是否正确，网络是否可访问。

### Q: 合约调用失败
A: 检查合约地址是否正确，合约是否已正确部署。

## 📊 监控和日志

项目包含详细的日志输出：

- 交易哈希和确认状态
- Gas 使用量统计
- 错误详细信息
- 事件监听状态

## 🔄 更新和维护

### 更新合约
如果需要更新智能合约：

1. 修改 Solidity 代码
2. 重新编译合约
3. 部署新合约
4. 更新 `.env` 中的合约地址

### 数据迁移
如果需要迁移数据到新合约，可以：

1. 从旧合约读取所有数据
2. 在新合约中重新创建数据
3. 更新应用程序配置

## 📈 性能优化

### 批量操作
对于大量操作，考虑：
- 使用批量调用减少网络请求
- 实现缓存机制
- 使用事件日志进行数据同步

### 内存优化
- 避免在内存中存储大量区块链数据
- 使用分页查询大型数据集
- 定期清理事件监听器

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 📞 支持

如果你遇到问题或需要帮助：

1. 查看 [常见问题](#-常见问题) 部分
2. 检查项目的 Issues 页面
3. 创建新的 Issue 描述你的问题

## 🚀 扩展功能

这个基础框架可以扩展以支持：

- 课程分类和标签
- 用户评分和评论
- 优惠券和折扣
- 课程内容管理
- 支付方式扩展（ERC-20 代币）
- NFT 证书系统

## 📚 相关资源

- [Ethers.js 文档](https://docs.ethers.io/v6/)
- [Solidity 文档](https://docs.soliditylang.org/)
- [Hardhat 文档](https://hardhat.org/docs)
- [Express.js 文档](https://expressjs.com/)

---

**注意：这是一个示例项目，请在生产环境使用前进行充分的测试和安全审计。**